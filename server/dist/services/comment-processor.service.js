"use strict";
/**
 * Comment Processor Service
 * Matches comments against auto-reply rules and queues responses
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.processComment = void 0;
const client_1 = require("@prisma/client");
const openai_1 = require("../lib/openai");
const queues_1 = require("../lib/queues");
const rate_limiter_1 = require("../lib/rate-limiter");
const prisma = new client_1.PrismaClient();
/**
 * Check if comment matches keyword-based rule
 */
const matchKeyword = async (comment, rule) => {
    const commentText = rule.caseSensitive ? comment.text : comment.text.toLowerCase();
    for (const keyword of rule.keywords) {
        const searchKeyword = rule.caseSensitive ? keyword : keyword.toLowerCase();
        let matched = false;
        switch (rule.matchMode) {
            case client_1.MatchMode.EXACT:
                matched = commentText === searchKeyword;
                break;
            case client_1.MatchMode.CONTAINS:
                matched = commentText.includes(searchKeyword);
                break;
            case client_1.MatchMode.STARTS_WITH:
                matched = commentText.startsWith(searchKeyword);
                break;
            case client_1.MatchMode.REGEX:
                try {
                    const regex = new RegExp(searchKeyword, rule.caseSensitive ? '' : 'i');
                    matched = regex.test(commentText);
                }
                catch (error) {
                    console.error('Invalid regex:', searchKeyword, error);
                }
                break;
            case client_1.MatchMode.AI_SIMILARITY:
                try {
                    const [commentEmbedding, keywordEmbedding] = await Promise.all([
                        (0, openai_1.generateEmbedding)(comment.text),
                        (0, openai_1.generateEmbedding)(keyword),
                    ]);
                    const similarity = (0, openai_1.cosineSimilarity)(commentEmbedding, keywordEmbedding);
                    const threshold = rule.aiSimilarityThreshold || 0.8;
                    if (similarity >= threshold) {
                        return {
                            matched: true,
                            rule,
                            matchedKeyword: keyword,
                            aiConfidenceScore: similarity,
                        };
                    }
                }
                catch (error) {
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
const matchSemantic = async (comment, rule) => {
    try {
        // Use first keyword as the semantic target
        if (rule.keywords.length === 0) {
            return { matched: false, rule, reason: 'No semantic target defined' };
        }
        const targetIntent = rule.keywords[0]; // e.g., "asking about course"
        const [commentEmbedding, intentEmbedding] = await Promise.all([
            (0, openai_1.generateEmbedding)(comment.text),
            (0, openai_1.generateEmbedding)(targetIntent),
        ]);
        const similarity = (0, openai_1.cosineSimilarity)(commentEmbedding, intentEmbedding);
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
    }
    catch (error) {
        console.error('Error in semantic matching:', error);
        return { matched: false, rule, reason: 'AI error' };
    }
};
/**
 * Check if comment matches sentiment rule
 */
const matchSentiment = async (comment, rule) => {
    try {
        const { sentiment, score } = await (0, openai_1.analyzeSentiment)(comment.text);
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
    }
    catch (error) {
        console.error('Error in sentiment matching:', error);
        return { matched: false, rule, reason: 'AI error' };
    }
};
/**
 * Check if comment matches question rule
 */
const matchQuestion = async (comment, rule) => {
    try {
        const isQuestionComment = await (0, openai_1.isQuestion)(comment.text);
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
    }
    catch (error) {
        console.error('Error in question matching:', error);
        return { matched: false, rule, reason: 'AI error' };
    }
};
/**
 * Check if comment matches mention rule
 */
const matchMention = async (comment, rule) => {
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
const applyFilters = async (comment, rule) => {
    // Check spam filter
    if (rule.skipSpam) {
        const isSpamComment = await (0, openai_1.isSpam)(comment.text);
        if (isSpamComment) {
            return { shouldRespond: false, reason: 'Spam detected' };
        }
    }
    // Check sentiment filter
    if (rule.skipNegativeSentiment) {
        const { sentiment } = await (0, openai_1.analyzeSentiment)(comment.text);
        if (sentiment === 'negative') {
            return { shouldRespond: false, reason: 'Negative sentiment' };
        }
    }
    // Check rate limit
    const canSend = await (0, rate_limiter_1.canSendResponse)(rule.id, rule.maxResponsesPerDay);
    if (!canSend) {
        return { shouldRespond: false, reason: 'Daily limit reached' };
    }
    return { shouldRespond: true };
};
/**
 * Process a single comment against a rule
 */
const processCommentWithRule = async (comment, rule) => {
    // Check platform match
    if (!rule.platforms.includes(comment.platform)) {
        return null;
    }
    // Check video scope
    if (rule.videoIds.length > 0 && !rule.videoIds.includes(comment.videoId)) {
        return null;
    }
    // Match based on trigger type
    let matchResult;
    switch (rule.triggerType) {
        case client_1.TriggerType.KEYWORD:
            matchResult = await matchKeyword(comment, rule);
            break;
        case client_1.TriggerType.SEMANTIC:
            matchResult = await matchSemantic(comment, rule);
            break;
        case client_1.TriggerType.SENTIMENT:
            matchResult = await matchSentiment(comment, rule);
            break;
        case client_1.TriggerType.QUESTION:
            matchResult = await matchQuestion(comment, rule);
            break;
        case client_1.TriggerType.MENTION:
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
const processComment = async (comment, userId) => {
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
                if (queues_1.responseQueue) {
                    await queues_1.responseQueue.add('send-response', {
                        comment,
                        rule,
                        logId: undefined, // Will be updated later
                        matchedKeyword: matchResult.matchedKeyword,
                        aiConfidenceScore: matchResult.aiConfidenceScore,
                    }, {
                        delay: Math.random() * (rule.maxDelaySeconds - rule.minDelaySeconds) * 1000 + rule.minDelaySeconds * 1000, // Random delay
                    });
                }
                else {
                    console.warn('[Comment Processor] Redis not available - cannot queue response');
                }
                // Only match first rule (to avoid duplicate responses)
                break;
            }
        }
    }
    catch (error) {
        console.error('Error processing comment:', error);
        throw error;
    }
};
exports.processComment = processComment;
//# sourceMappingURL=comment-processor.service.js.map