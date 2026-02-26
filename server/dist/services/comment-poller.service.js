"use strict";
/**
 * Comment Polling Service
 * Fetches new comments from YouTube, Instagram, and TikTok
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pollAllPlatforms = exports.pollPlatformComments = exports.pollTikTokComments = exports.pollInstagramComments = exports.pollYouTubeComments = void 0;
const client_1 = require("@prisma/client");
const axios_1 = __importDefault(require("axios"));
const encryption_service_1 = require("./encryption.service");
const queues_1 = require("../lib/queues");
const prisma = new client_1.PrismaClient();
/**
 * Poll YouTube comments for a specific video
 */
const pollYouTubeComments = async (accessToken, videoId, userId) => {
    try {
        const response = await axios_1.default.get('https://www.googleapis.com/youtube/v3/commentThreads', {
            params: {
                part: 'snippet',
                videoId,
                maxResults: 100,
                order: 'time', // Most recent first
                textFormat: 'plainText',
            },
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        const comments = response.data.items.map((item) => ({
            id: item.id,
            text: item.snippet.topLevelComment.snippet.textDisplay,
            author: item.snippet.topLevelComment.snippet.authorDisplayName,
            authorId: item.snippet.topLevelComment.snippet.authorChannelId?.value || '',
            videoId,
            platform: client_1.Platform.YOUTUBE,
            publishedAt: new Date(item.snippet.topLevelComment.snippet.publishedAt),
        }));
        return comments;
    }
    catch (error) {
        console.error('Error polling YouTube comments:', error.response?.data || error.message);
        throw error;
    }
};
exports.pollYouTubeComments = pollYouTubeComments;
/**
 * Poll Instagram comments for a media post
 */
const pollInstagramComments = async (accessToken, mediaId, userId) => {
    try {
        const response = await axios_1.default.get(`https://graph.instagram.com/${mediaId}/comments`, {
            params: {
                fields: 'id,text,username,timestamp',
                access_token: accessToken,
            },
        });
        const comments = response.data.data.map((item) => ({
            id: item.id,
            text: item.text,
            author: item.username,
            authorId: item.from?.id || item.username,
            videoId: mediaId,
            platform: client_1.Platform.INSTAGRAM,
            publishedAt: new Date(item.timestamp),
        }));
        return comments;
    }
    catch (error) {
        console.error('Error polling Instagram comments:', error.response?.data || error.message);
        throw error;
    }
};
exports.pollInstagramComments = pollInstagramComments;
/**
 * Poll TikTok comments for a video
 */
const pollTikTokComments = async (accessToken, videoId, userId) => {
    try {
        // Note: TikTok API for comments requires approval and specific permissions
        const response = await axios_1.default.get(`https://open.tiktokapis.com/v2/video/comment/list/`, {
            params: {
                video_id: videoId,
                max_count: 100,
            },
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        const comments = (response.data.data?.comments || []).map((item) => ({
            id: item.id,
            text: item.text,
            author: item.user.display_name,
            authorId: item.user.id,
            videoId,
            platform: client_1.Platform.TIKTOK,
            publishedAt: new Date(item.create_time * 1000),
        }));
        return comments;
    }
    catch (error) {
        console.error('Error polling TikTok comments:', error.response?.data || error.message);
        throw error;
    }
};
exports.pollTikTokComments = pollTikTokComments;
/**
 * Filter out already processed comments
 */
const filterNewComments = async (comments) => {
    const commentIds = comments.map((c) => c.id);
    const existingComments = await prisma.processedComment.findMany({
        where: {
            commentId: {
                in: commentIds,
            },
        },
        select: {
            commentId: true,
        },
    });
    const existingIds = new Set(existingComments.map((c) => c.commentId));
    return comments.filter((c) => !existingIds.has(c.id));
};
/**
 * Mark comments as processed
 */
const markCommentsAsProcessed = async (comments) => {
    await prisma.processedComment.createMany({
        data: comments.map((c) => ({
            platform: c.platform,
            commentId: c.id,
            videoId: c.videoId,
        })),
        skipDuplicates: true,
    });
};
/**
 * Queue comments for processing
 */
const queueCommentsForProcessing = async (comments, userId) => {
    if (!queues_1.commentProcessQueue) {
        console.warn('[Comment Poller] Redis not available - skipping queue');
        return;
    }
    for (const comment of comments) {
        await queues_1.commentProcessQueue.add('process-comment', {
            comment,
            userId,
        });
    }
};
/**
 * Poll all videos for a user's platform connection
 */
const pollPlatformComments = async (userId, platform) => {
    try {
        // Get platform connection
        const connection = await prisma.platformConnection.findFirst({
            where: {
                userId,
                platform,
                isActive: true,
            },
        });
        if (!connection) {
            console.log(`No active ${platform} connection for user ${userId}`);
            return;
        }
        // Decrypt access token
        const accessToken = encryption_service_1.EncryptionService.decrypt(connection.accessToken);
        // Get active rules for this platform
        const rules = await prisma.autoReplyRule.findMany({
            where: {
                userId,
                isActive: true,
                platforms: {
                    has: platform,
                },
            },
        });
        if (rules.length === 0) {
            console.log(`No active rules for ${platform} for user ${userId}`);
            return;
        }
        // Collect all unique video IDs from rules
        const videoIds = new Set();
        for (const rule of rules) {
            if (rule.videoIds.length === 0) {
                // If no specific videos, we need to fetch recent videos from the platform
                // For now, skip this case - users should specify video IDs
                continue;
            }
            rule.videoIds.forEach((id) => videoIds.add(id));
        }
        // Poll comments for each video
        for (const videoId of videoIds) {
            try {
                let comments = [];
                switch (platform) {
                    case client_1.Platform.YOUTUBE:
                        comments = await (0, exports.pollYouTubeComments)(accessToken, videoId, userId);
                        break;
                    case client_1.Platform.INSTAGRAM:
                        comments = await (0, exports.pollInstagramComments)(accessToken, videoId, userId);
                        break;
                    case client_1.Platform.TIKTOK:
                        comments = await (0, exports.pollTikTokComments)(accessToken, videoId, userId);
                        break;
                }
                // Filter out already processed comments
                const newComments = await filterNewComments(comments);
                if (newComments.length > 0) {
                    console.log(`Found ${newComments.length} new comments on ${platform} video ${videoId}`);
                    // Mark as processed
                    await markCommentsAsProcessed(newComments);
                    // Queue for processing
                    await queueCommentsForProcessing(newComments, userId);
                }
            }
            catch (error) {
                console.error(`Error polling ${platform} video ${videoId}:`, error);
                // Continue with next video
            }
        }
    }
    catch (error) {
        console.error(`Error polling ${platform} for user ${userId}:`, error);
        throw error;
    }
};
exports.pollPlatformComments = pollPlatformComments;
/**
 * Poll all active platforms for a user
 */
const pollAllPlatforms = async (userId) => {
    const platforms = [client_1.Platform.YOUTUBE, client_1.Platform.INSTAGRAM, client_1.Platform.TIKTOK];
    for (const platform of platforms) {
        try {
            await (0, exports.pollPlatformComments)(userId, platform);
        }
        catch (error) {
            console.error(`Error polling ${platform}:`, error);
            // Continue with next platform
        }
    }
};
exports.pollAllPlatforms = pollAllPlatforms;
//# sourceMappingURL=comment-poller.service.js.map