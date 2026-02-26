"use strict";
/**
 * Rate Limiter for Auto-Reply System
 * Ensures we don't exceed daily limits per rule
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTodayUsage = exports.getRandomDelay = exports.incrementResponseCount = exports.canSendResponse = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Check if rule has exceeded daily response limit
 */
const canSendResponse = async (ruleId, maxResponsesPerDay) => {
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
exports.canSendResponse = canSendResponse;
/**
 * Increment daily response count for a rule
 */
const incrementResponseCount = async (ruleId, userId) => {
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
exports.incrementResponseCount = incrementResponseCount;
/**
 * Get random delay between min and max seconds
 */
const getRandomDelay = (minSeconds, maxSeconds) => {
    return Math.floor(Math.random() * (maxSeconds - minSeconds + 1) + minSeconds) * 1000; // Convert to milliseconds
};
exports.getRandomDelay = getRandomDelay;
/**
 * Get usage stats for a rule today
 */
const getTodayUsage = async (ruleId) => {
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
exports.getTodayUsage = getTodayUsage;
//# sourceMappingURL=rate-limiter.js.map