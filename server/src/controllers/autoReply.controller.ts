/**
 * Auto-Reply Controller
 * Manages auto-reply rules, logs, and statistics
 */

import { Request, Response } from 'express';
import { PrismaClient, TriggerType, MatchMode, ResponseAction, Platform } from '@prisma/client';
import { pollAllPlatforms } from '../services/comment-poller.service';

const prisma = new PrismaClient();

/**
 * Get all auto-reply rules for the current user
 */
export const getRules = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    const rules = await prisma.autoReplyRule.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        logs: {
          take: 5,
          orderBy: { triggeredAt: 'desc' },
        },
        _count: {
          select: { logs: true },
        },
      },
    });

    res.json({
      success: true,
      rules,
    });
  } catch (error: any) {
    console.error('Error fetching rules:', error);
    res.status(500).json({
      error: 'RulesError',
      message: 'Failed to fetch auto-reply rules',
    });
  }
};

/**
 * Get a single auto-reply rule
 */
export const getRule = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    const rule = await prisma.autoReplyRule.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        logs: {
          take: 10,
          orderBy: { triggeredAt: 'desc' },
        },
        _count: {
          select: { logs: true },
        },
      },
    });

    if (!rule) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Rule not found',
      });
    }

    res.json({
      success: true,
      rule,
    });
  } catch (error: any) {
    console.error('Error fetching rule:', error);
    res.status(500).json({
      error: 'RuleError',
      message: 'Failed to fetch auto-reply rule',
    });
  }
};

/**
 * Create a new auto-reply rule
 */
export const createRule = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    const {
      name,
      triggerType = 'KEYWORD',
      keywords = [],
      matchMode = 'CONTAINS',
      caseSensitive = false,
      aiSimilarityThreshold = 0.8,
      platforms = ['YOUTUBE'],
      videoIds = [],
      responseAction = 'REPLY_COMMENT',
      responseTemplate,
      customLink,
      attachmentUrl,
      maxResponsesPerDay = 100,
      minDelaySeconds = 30,
      maxDelaySeconds = 120,
      skipNegativeSentiment = true,
      skipSpam = true,
      onlyVerifiedUsers = false,
      minFollowerCount,
    } = req.body;

    // Validation
    if (!name || !responseTemplate) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Name and response template are required',
      });
    }

    if (triggerType === 'KEYWORD' && keywords.length === 0) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'At least one keyword is required for keyword triggers',
      });
    }

    const rule = await prisma.autoReplyRule.create({
      data: {
        userId,
        name,
        triggerType: triggerType as TriggerType,
        keywords,
        matchMode: matchMode as MatchMode,
        caseSensitive,
        aiSimilarityThreshold,
        platforms: platforms as Platform[],
        videoIds,
        responseAction: responseAction as ResponseAction,
        responseTemplate,
        customLink,
        attachmentUrl,
        maxResponsesPerDay,
        minDelaySeconds,
        maxDelaySeconds,
        skipNegativeSentiment,
        skipSpam,
        onlyVerifiedUsers,
        minFollowerCount,
      },
    });

    res.json({
      success: true,
      rule,
    });
  } catch (error: any) {
    console.error('Error creating rule:', error);
    res.status(500).json({
      error: 'CreateError',
      message: 'Failed to create auto-reply rule',
    });
  }
};

/**
 * Update an existing auto-reply rule
 */
export const updateRule = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    // Verify ownership
    const existingRule = await prisma.autoReplyRule.findFirst({
      where: { id, userId },
    });

    if (!existingRule) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Rule not found',
      });
    }

    const updateData: any = { ...req.body };
    delete updateData.userId; // Prevent userId changes

    const rule = await prisma.autoReplyRule.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      rule,
    });
  } catch (error: any) {
    console.error('Error updating rule:', error);
    res.status(500).json({
      error: 'UpdateError',
      message: 'Failed to update auto-reply rule',
    });
  }
};

/**
 * Delete an auto-reply rule
 */
export const deleteRule = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    // Verify ownership
    const existingRule = await prisma.autoReplyRule.findFirst({
      where: { id, userId },
    });

    if (!existingRule) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Rule not found',
      });
    }

    await prisma.autoReplyRule.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Rule deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting rule:', error);
    res.status(500).json({
      error: 'DeleteError',
      message: 'Failed to delete auto-reply rule',
    });
  }
};

/**
 * Toggle rule active status
 */
export const toggleRule = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    // Verify ownership
    const existingRule = await prisma.autoReplyRule.findFirst({
      where: { id, userId },
    });

    if (!existingRule) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Rule not found',
      });
    }

    const rule = await prisma.autoReplyRule.update({
      where: { id },
      data: { isActive: !existingRule.isActive },
    });

    res.json({
      success: true,
      rule,
    });
  } catch (error: any) {
    console.error('Error toggling rule:', error);
    res.status(500).json({
      error: 'ToggleError',
      message: 'Failed to toggle auto-reply rule',
    });
  }
};

/**
 * Get activity logs
 */
export const getLogs = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { ruleId, platform, limit = '50', offset = '0' } = req.query;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    const whereClause: any = {};

    if (ruleId) {
      // Verify the rule belongs to the user
      const rule = await prisma.autoReplyRule.findFirst({
        where: { id: ruleId as string, userId },
      });

      if (!rule) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Rule not found',
        });
      }

      whereClause.ruleId = ruleId as string;
    } else {
      // Get logs for all user's rules
      const userRules = await prisma.autoReplyRule.findMany({
        where: { userId },
        select: { id: true },
      });

      whereClause.ruleId = {
        in: userRules.map((r) => r.id),
      };
    }

    if (platform) {
      whereClause.platform = platform as Platform;
    }

    const logs = await prisma.autoReplyLog.findMany({
      where: whereClause,
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      orderBy: { triggeredAt: 'desc' },
      include: {
        rule: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const total = await prisma.autoReplyLog.count({ where: whereClause });

    res.json({
      success: true,
      logs,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error: any) {
    console.error('Error fetching logs:', error);
    res.status(500).json({
      error: 'LogsError',
      message: 'Failed to fetch activity logs',
    });
  }
};

/**
 * Get statistics
 */
export const getStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    // Get all user's rules
    const rules = await prisma.autoReplyRule.findMany({
      where: { userId },
      select: { id: true },
    });

    const ruleIds = rules.map((r) => r.id);

    // Total triggers
    const totalTriggers = await prisma.autoReplyLog.count({
      where: { ruleId: { in: ruleIds } },
    });

    // Successful responses
    const successfulResponses = await prisma.autoReplyLog.count({
      where: {
        ruleId: { in: ruleIds },
        responseSent: true,
      },
    });

    // Response rate
    const responseRate = totalTriggers > 0 ? (successfulResponses / totalTriggers) * 100 : 0;

    // Top performing rules
    const topRules = await prisma.autoReplyLog.groupBy({
      by: ['ruleId'],
      where: { ruleId: { in: ruleIds } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    const topPerformingRules = await Promise.all(
      topRules.map(async (r) => {
        const rule = await prisma.autoReplyRule.findUnique({
          where: { id: r.ruleId },
          select: { id: true, name: true },
        });
        return {
          ...rule,
          triggerCount: r._count.id,
        };
      })
    );

    // Platform breakdown
    const platformStats = await prisma.autoReplyLog.groupBy({
      by: ['platform'],
      where: { ruleId: { in: ruleIds } },
      _count: { id: true },
    });

    // Today's usage
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayUsage = await prisma.dailyUsage.findMany({
      where: {
        userId,
        date: today,
      },
    });

    const todayTotalResponses = todayUsage.reduce((sum, u) => sum + u.responsesCount, 0);

    res.json({
      success: true,
      stats: {
        totalTriggers,
        successfulResponses,
        responseRate: Math.round(responseRate * 10) / 10,
        topPerformingRules,
        platformStats,
        todayTotalResponses,
      },
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      error: 'StatsError',
      message: 'Failed to fetch statistics',
    });
  }
};

/**
 * Test endpoint to manually trigger comment polling
 */
export const testPoll = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    // Trigger polling for this user
    await pollAllPlatforms(userId);

    res.json({
      success: true,
      message: 'Comment polling triggered successfully',
    });
  } catch (error: any) {
    console.error('Error triggering poll:', error);
    res.status(500).json({
      error: 'PollError',
      message: 'Failed to trigger comment polling',
    });
  }
};
