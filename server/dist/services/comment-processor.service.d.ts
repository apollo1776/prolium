/**
 * Comment Processor Service
 * Matches comments against auto-reply rules and queues responses
 */
import { Platform } from '@prisma/client';
interface Comment {
    id: string;
    text: string;
    author: string;
    authorId: string;
    videoId: string;
    platform: Platform;
    publishedAt: Date;
}
/**
 * Process a comment against all user's active rules
 */
export declare const processComment: (comment: Comment, userId: string) => Promise<void>;
export {};
//# sourceMappingURL=comment-processor.service.d.ts.map