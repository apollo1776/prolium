/**
 * Response Sender Service
 * Sends auto-replies to comments on various platforms
 */
import { Platform, AutoReplyRule } from '@prisma/client';
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
 * Send a response to a comment
 */
export declare const sendResponse: (comment: Comment, rule: AutoReplyRule, userId: string, matchedKeyword?: string, aiConfidenceScore?: number) => Promise<{
    success: boolean;
    responseId?: string;
    errorMessage?: string;
}>;
export {};
//# sourceMappingURL=response-sender.service.d.ts.map