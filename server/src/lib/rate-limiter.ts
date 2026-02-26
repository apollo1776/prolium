/**
 * Rate Limiter for Auto-Reply System
 * Ensures we don't exceed daily limits per rule
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Check if rule has exceeded daily response limit
 */
export const canSendResponse = async (ruleId: string, maxResponsesPerDay: number): Promise<boolean> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const usage = await prisma.dailyUsage.findUnique({
    where: {
      ruleId_date: {
        ruleId,
        date: today,
      },
    },
  });

  if (!usage) {
    return true; // No usage today yet
  }

  return usage.responsesCount < maxResponsesPerDay;
};

/**
 * Increment daily response count for a rule
 */
export const incrementResponseCount = async (ruleId: string, userId: string): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.dailyUsage.upsert({
    where: {
      ruleId_date: {
        ruleId,
        date: today,
      },
    },
    update: {
      responsesCount: {
        increment: 1,
      },
    },
    create: {
      userId,
      ruleId,
      date: today,
      responsesCount: 1,
    },
  });
};

/**
 * Get random delay between min and max seconds
 */
export const getRandomDelay = (minSeconds: number, maxSeconds: number): number => {
  return Math.floor(Math.random() * (maxSeconds - minSeconds + 1) + minSeconds) * 1000; // Convert to milliseconds
};

/**
 * Get usage stats for a rule today
 */
export const getTodayUsage = async (ruleId: string): Promise<{ count: number; remaining: number; maxPerDay: number }> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rule = await prisma.autoReplyRule.findUnique({
    where: { id: ruleId },
    select: { maxResponsesPerDay: true },
  });

  if (!rule) {
    throw new Error('Rule not found');
  }

  const usage = await prisma.dailyUsage.findUnique({
    where: {
      ruleId_date: {
        ruleId,
        date: today,
      },
    },
  });

  const count = usage?.responsesCount || 0;
  const maxPerDay = rule.maxResponsesPerDay;
  const remaining = Math.max(0, maxPerDay - count);

  return { count, remaining, maxPerDay };
};
