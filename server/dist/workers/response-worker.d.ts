/**
 * Response Worker
 * Sends auto-replies to matched comments with rate limiting
 */
import { Worker } from 'bullmq';
import { Platform, AutoReplyRule } from '@prisma/client';
interface ResponseJobData {
    comment: {
        id: string;
        text: string;
        author: string;
        authorId: string;
        videoId: string;
        platform: Platform;
        publishedAt: Date;
    };
    rule: AutoReplyRule;
    logId?: string;
    matchedKeyword?: string;
    aiConfidenceScore?: number;
}
/**
 * Worker to send responses
 */
export declare const responseWorker: Worker<ResponseJobData, any, string>;
export {};
//# sourceMappingURL=response-worker.d.ts.map