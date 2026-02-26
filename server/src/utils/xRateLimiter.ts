// src/utils/xRateLimiter.ts
export async function withXRateLimit<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    if (err.code === 429) {
      const resetMs = (err.rateLimit?.reset ?? 0) * 1000;
      const waitMs = Math.max(resetMs - Date.now(), 60000); // min 1 min wait
      console.warn(`X rate limit hit. Waiting ${waitMs / 1000}s`);
      await new Promise(r => setTimeout(r, waitMs));
      return fn(); // retry once
    }
    throw err;
  }
}
