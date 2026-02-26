/**
 * Process Worker
 * Processes comments against auto-reply rules
 */
import { Worker } from 'bullmq';
import { Platform } from '@prisma/client';
interface ProcessJobData {
    comment: {
        id: string;
        text: string;
        author: string;
        authorId: string;
        videoId: string;
        platform: Platform;
        publishedAt: Date;
    };
    userId: string;
}
/**
 * Worker to process comments against rules
 */
export declare const processWorker: Worker<ProcessJobData, any, string>;
export {};
//# sourceMappingURL=process-worker.d.ts.map