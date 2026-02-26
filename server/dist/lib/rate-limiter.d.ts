/**
 * Rate Limiter for Auto-Reply System
 * Ensures we don't exceed daily limits per rule
 */
/**
 * Check if rule has exceeded daily response limit
 */
export declare const canSendResponse: (ruleId: string, maxResponsesPerDay: number) => Promise<boolean>;
/**
 * Increment daily response count for a rule
 */
export declare const incrementResponseCount: (ruleId: string, userId: string) => Promise<void>;
/**
 * Get random delay between min and max seconds
 */
export declare const getRandomDelay: (minSeconds: number, maxSeconds: number) => number;
/**
 * Get usage stats for a rule today
 */
export declare const getTodayUsage: (ruleId: string) => Promise<{
    count: number;
    remaining: number;
    maxPerDay: number;
}>;
//# sourceMappingURL=rate-limiter.d.ts.map