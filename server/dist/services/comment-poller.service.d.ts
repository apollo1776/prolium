/**
 * Comment Polling Service
 * Fetches new comments from YouTube, Instagram, and TikTok
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
 * Poll YouTube comments for a specific video
 */
export declare const pollYouTubeComments: (accessToken: string, videoId: string, userId: string) => Promise<Comment[]>;
/**
 * Poll Instagram comments for a media post
 */
export declare const pollInstagramComments: (accessToken: string, mediaId: string, userId: string) => Promise<Comment[]>;
/**
 * Poll TikTok comments for a video
 */
export declare const pollTikTokComments: (accessToken: string, videoId: string, userId: string) => Promise<Comment[]>;
/**
 * Poll all videos for a user's platform connection
 */
export declare const pollPlatformComments: (userId: string, platform: Platform) => Promise<void>;
/**
 * Poll all active platforms for a user
 */
export declare const pollAllPlatforms: (userId: string) => Promise<void>;
export {};
//# sourceMappingURL=comment-poller.service.d.ts.map