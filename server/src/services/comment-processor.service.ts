/**
 * Comment Processor Service
 * Matches comments against auto-reply rules and queues responses
 */

import { PrismaClient, Platform, TriggerType, MatchMode, AutoReplyRule } from '@prisma/client';
import { generateEmbedding, cosineSimilarity, analyzeSentiment, isQuestion, isSpam } from '../lib/openai';
import { responseQueue } from '../lib/queues';
import { canSendResponse } from '../lib/rate-limiter';

const prisma = new PrismaClient();

interface Comment {
  id: string;
  text: string;
  author: string;
  authorId: string;
  videoId: string;
  platform: Platform;
  publishedAt: Date;
}

interface MatchResult {
  matched: boolean;
  rule: AutoReplyRule;
  matchedKeyword?: string;
  aiConfidenceScore?: number;
  sentimentScore?: number;
  reason?: string; // Why it didn't match
}

/**
 * Check if comment matches keyword-based rule
 */
const matchKeyword = async (comment: Comment, rule: AutoReplyRule): Promise<MatchResult> => {
  const commentText = rule.caseSensitive ? comment.text : comment.text.toLowerCase();

  for (const keyword of rule.keywords) {
    const searchKeyword = rule.caseSensitive ? keyword : keyword.toLowerCase();

    let matched = false;

    switch (rule.matchMode) {
      case MatchMode.EXACT:
        matched = commentText === searchKeyword;
        break;
      case MatchMode.CONTAINS:
        matched = commentText.includes(searchKeyword);
        break;
      case MatchMode.STARTS_WITH:
        matched = commentText.startsWith(searchKeyword);
        break;
      case MatchMode.REGEX:
        try {
          const regex = new RegExp(searchKeyword, rule.caseSensitive ? '' : 'i');
          matched = regex.test(commentText);
        } catch (error) {
          console.error('Invalid regex:', searchKeyword, error);
        }
        break;
      case MatchMode.AI_SIMILARITY:
        try {
          const [commentEmbedding, keywordEmbedding] = await Promise.all([
            generateEmbedding(comment.text),
            generateEmbedding(keyword),
          ]);

          const similarity = cosineSimilarity(commentEmbedding, keywordEmbedding);
          const threshold = rule.aiSimilarityThreshold || 0.8;

          if (similarity >= threshold) {
            return {
              matched: true,
              rule,
              matchedKeyword: keyword,
              aiConfidenceScore: similarity,
            };
          }
        } catch (error) {
          console.error('Error calculating AI similarity:', error);
        }
        break;
    }

    if (matched) {
      return {
        matched: true,
        rule,
        matchedKeyword: keyword,
      };
    }
  }

  return {
    matched: false,
    rule,
    reason: 'No keyword match',
  };
};

/**
 * Check if comment matches semantic rule
 */
const matchSemantic = async (comment: Comment, rule: AutoReplyRule): Promise<MatchResult> => {
  try {
    // Use first keyword as the semantic target
    if (rule.keywords.length === 0) {
      return { matched: false, rule, reason: 'No semantic target defined' };
    }

    const targetIntent = rule.keywords[0]; // e.g., "asking about course"

    const [commentEmbedding, intentEmbedding] = await Promise.all([
      generateEmbedding(comment.text),
      generateEmbedding(targetIntent),
    ]);

    const similarity = cosineSimilarity(commentEmbedding, intentEmbedding);
    const threshold = rule.aiSimilarityThreshold || 0.8;

    if (similarity >= threshold) {
      return {
        matched: true,
        rule,
        aiConfidenceScore: similarity,
      };
    }

    return {
      matched: false,
      rule,
      reason: `Semantic similarity ${similarity.toFixed(2)} below threshold ${threshold}`,
    };
  } catch (error) {
    console.error('Error in semantic matching:', error);
    return { matched: false, rule, reason: 'AI error' };
  }
};

/**
 * Check if comment matches sentiment rule
 */
const matchSentiment = async (comment: Comment, rule: AutoReplyRule): Promise<MatchResult> => {
  try {
    const { sentiment, score } = await analyzeSentiment(comment.text);

    // Assume rule keywords contain target sentiment: ["positive"] or ["negative"]
    const targetSentiment = rule.keywords[0]?.toLowerCase();

    if (sentiment === targetSentiment) {
      return {
        matched: true,
        rule,
        sentimentScore: score,
      };
    }

    return {
      matched: false,
      rule,
      reason: `Sentiment is ${sentiment}, expected ${targetSentiment}`,
    };
  } catch (error) {
    console.error('Error in sentiment matching:', error);
    return { matched: false, rule, reason: 'AI error' };
  }
};

/**
 * Check if comment matches question rule
 */
const matchQuestion = async (comment: Comment, rule: AutoReplyRule): Promise<MatchResult> => {
  try {
    const isQuestionComment = await isQuestion(comment.text);

    if (isQuestionComment) {
      return {
        matched: true,
        rule,
      };
    }

    return {
      matched: false,
      rule,
      reason: 'Not a question',
    };
  } catch (error) {
    console.error('Error in question matching:', error);
    return { matched: false, rule, reason: 'AI error' };
  }
};

/**
 * Check if comment matches mention rule
 */
const matchMention = async (comment: Comment, rule: AutoReplyRule): Promise<MatchResult> => {
  // Check if comment mentions the creator (via keywords containing creator name/handle)
  const commentText = comment.text.toLowerCase();

  for (const keyword of rule.keywords) {
    if (commentText.includes(keyword.toLowerCase())) {
      return {
        matched: true,
        rule,
        matchedKeyword: keyword,
      };
    }
  }

  return {
    matched: false,
    rule,
    reason: 'No mention found',
  };
};

/**
 * Apply filters to check if we should respond
 */
const applyFilters = async (comment: Comment, rule: AutoReplyRule): Promise<{ shouldRespond: boolean; reason?: string }> => {
  // Check spam filter
  if (rule.skipSpam) {
    const isSpamComment = await isSpam(comment.text);
    if (isSpamComment) {
      return { shouldRespond: false, reason: 'Spam detected' };
    }
  }

  // Check sentiment filter
  if (rule.skipNegativeSentiment) {
    const { sentiment } = await analyzeSentiment(comment.text);
    if (sentiment === 'negative') {
      return { shouldRespond: false, reason: 'Negative sentiment' };
    }
  }

  // Check rate limit
  const canSend = await canSendResponse(rule.id, rule.maxResponsesPerDay);
  if (!canSend) {
    return { shouldRespond: false, reason: 'Daily limit reached' };
  }

  return { shouldRespond: true };
};

/**
 * Process a single comment against a rule
 */
const processCommentWithRule = async (comment: Comment, rule: AutoReplyRule): Promise<MatchResult | null> => {
  // Check platform match
  if (!rule.platforms.includes(comment.platform)) {
    return null;
  }

  // Check video scope
  if (rule.videoIds.length > 0 && !rule.videoIds.includes(comment.videoId)) {
    return null;
  }

  // Match based on trigger type
  let matchResult: MatchResult;

  switch (rule.triggerType) {
    case TriggerType.KEYWORD:
      matchResult = await matchKeyword(comment, rule);
      break;
    case TriggerType.SEMANTIC:
      matchResult = await matchSemantic(comment, rule);
      break;
    case TriggerType.SENTIMENT:
      matchResult = await matchSentiment(comment, rule);
      break;
    case TriggerType.QUESTION:
      matchResult = await matchQuestion(comment, rule);
      break;
    case TriggerType.MENTION:
      matchResult = await matchMention(comment, rule);
      break;
    default:
      return null;
  }

  if (!matchResult.matched) {
    return matchResult;
  }

  // Apply filters
  const filterResult = await applyFilters(comment, rule);
  if (!filterResult.shouldRespond) {
    return {
      ...matchResult,
      matched: false,
      reason: filterResult.reason,
    };
  }

  return matchResult;
};

/**
 * Process a comment against all user's active rules
 */
export const processComment = async (comment: Comment, userId: string): Promise<void> => {
  try {
    // Fetch all active rules for this user and platform
    const rules = await prisma.autoReplyRule.findMany({
      where: {
        userId,
        isActive: true,
        platforms: {
          has: comment.platform,
        },
      },
      orderBy: {
        createdAt: 'asc', // Process older rules first
      },
    });

    console.log(`Processing comment ${comment.id} against ${rules.length} rules`);

    for (const rule of rules) {
      const matchResult = await processCommentWithRule(comment, rule);

      if (!matchResult) {
        continue; // Rule doesn't apply to this comment
      }

      // Log the attempt (whether matched or not)
      await prisma.autoReplyLog.create({
        data: {
          ruleId: rule.id,
          platform: comment.platform,
          videoId: comment.videoId,
          commentId: comment.id,
          commentText: comment.text,
          commentAuthor: comment.author,
          commentAuthorId: comment.authorId,
          matchedKeyword: matchResult.matchedKeyword,
          aiConfidenceScore: matchResult.aiConfidenceScore,
          sentimentScore: matchResult.sentimentScore,
          responseAction: rule.responseAction,
          responseSent: false,
          errorMessage: matchResult.matched ? undefined : matchResult.reason,
        },
      });

      if (matchResult.matched) {
        console.log(`Comment ${comment.id} matched rule ${rule.id}: ${rule.name}`);

        // Queue for response
        if (responseQueue) {
          await responseQueue.add(
            'send-response',
            {
              comment,
              rule,
              logId: undefined, // Will be updated later
              matchedKeyword: matchResult.matchedKeyword,
              aiConfidenceScore: matchResult.aiConfidenceScore,
            },
            {
              delay: Math.random() * (rule.maxDelaySeconds - rule.minDelaySeconds) * 1000 + rule.minDelaySeconds * 1000, // Random delay
            }
          );
        } else {
          console.warn('[Comment Processor] Redis not available - cannot queue response');
        }

        // Only match first rule (to avoid duplicate responses)
        break;
      }
    }
  } catch (error) {
    console.error('Error processing comment:', error);
    throw error;
  }
};
