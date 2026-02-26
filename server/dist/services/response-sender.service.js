"use strict";
/**
 * Response Sender Service
 * Sends auto-replies to comments on various platforms
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendResponse = void 0;
const client_1 = require("@prisma/client");
const axios_1 = __importDefault(require("axios"));
const encryption_service_1 = require("./encryption.service");
const template_engine_1 = require("../lib/template-engine");
const rate_limiter_1 = require("../lib/rate-limiter");
const prisma = new client_1.PrismaClient();
/**
 * Send a reply to a YouTube comment
 */
const sendYouTubeReply = async (accessToken, commentId, responseText) => {
    try {
        const response = await axios_1.default.post('https://www.googleapis.com/youtube/v3/comments', {
            snippet: {
                parentId: commentId,
                textOriginal: responseText,
            },
        }, {
            params: {
                part: 'snippet',
            },
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data.id;
    }
    catch (error) {
        console.error('Error sending YouTube reply:', error.response?.data || error.message);
        throw new Error(error.response?.data?.error?.message || 'Failed to send YouTube reply');
    }
};
/**
 * Send a reply to an Instagram comment
 */
const sendInstagramReply = async (accessToken, commentId, responseText) => {
    try {
        const response = await axios_1.default.post(`https://graph.instagram.com/${commentId}/replies`, {
            message: responseText,
        }, {
            params: {
                access_token: accessToken,
            },
        });
        return response.data.id;
    }
    catch (error) {
        console.error('Error sending Instagram reply:', error.response?.data || error.message);
        throw new Error(error.response?.data?.error?.message || 'Failed to send Instagram reply');
    }
};
/**
 * Send an Instagram DM
 */
const sendInstagramDM = async (accessToken, userId, responseText) => {
    try {
        const response = await axios_1.default.post('https://graph.instagram.com/me/messages', {
            recipient: { id: userId },
            message: { text: responseText },
        }, {
            params: {
                access_token: accessToken,
            },
        });
        return response.data.message_id;
    }
    catch (error) {
        console.error('Error sending Instagram DM:', error.response?.data || error.message);
        throw new Error(error.response?.data?.error?.message || 'Failed to send Instagram DM');
    }
};
/**
 * Send a reply to a TikTok comment
 */
const sendTikTokReply = async (accessToken, commentId, videoId, responseText) => {
    try {
        // Note: TikTok comment reply API requires special permissions
        const response = await axios_1.default.post('https://open.tiktokapis.com/v2/video/comment/reply/', {
            video_id: videoId,
            comment_id: commentId,
            text: responseText,
        }, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data.data.comment_id;
    }
    catch (error) {
        console.error('Error sending TikTok reply:', error.response?.data || error.message);
        throw new Error(error.response?.data?.error?.message || 'Failed to send TikTok reply');
    }
};
/**
 * Get video title for template variable
 */
const getVideoTitle = async (platform, videoId, accessToken) => {
    try {
        switch (platform) {
            case client_1.Platform.YOUTUBE: {
                const response = await axios_1.default.get('https://www.googleapis.com/youtube/v3/videos', {
                    params: {
                        part: 'snippet',
                        id: videoId,
                    },
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                return response.data.items[0]?.snippet?.title || 'this video';
            }
            case client_1.Platform.INSTAGRAM: {
                const response = await axios_1.default.get(`https://graph.instagram.com/${videoId}`, {
                    params: {
                        fields: 'caption',
                        access_token: accessToken,
                    },
                });
                return response.data.caption || 'this post';
            }
            case client_1.Platform.TIKTOK: {
                // TikTok doesn't always have titles, use description
                return 'this video';
            }
            default:
                return 'this content';
        }
    }
    catch (error) {
        console.error('Error fetching video title:', error);
        return 'this content';
    }
};
/**
 * Send a response to a comment
 */
const sendResponse = async (comment, rule, userId, matchedKeyword, aiConfidenceScore) => {
    try {
        // Get platform connection
        const connection = await prisma.platformConnection.findFirst({
            where: {
                userId,
                platform: comment.platform,
                isActive: true,
            },
        });
        if (!connection) {
            throw new Error(`No active ${comment.platform} connection`);
        }
        // Decrypt access token
        const accessToken = encryption_service_1.EncryptionService.decrypt(connection.accessToken);
        // Get video title for template
        const videoTitle = await getVideoTitle(comment.platform, comment.videoId, accessToken);
        // Replace template variables
        const responseText = (0, template_engine_1.replaceTemplateVariables)(rule.responseTemplate, {
            username: comment.author,
            videoTitle,
            customLink: rule.customLink || '',
            commentText: comment.text,
            platform: comment.platform,
        });
        // Send response based on action type
        let responseId;
        switch (rule.responseAction) {
            case client_1.ResponseAction.REPLY_COMMENT:
            case client_1.ResponseAction.SEND_LINK: {
                switch (comment.platform) {
                    case client_1.Platform.YOUTUBE:
                        responseId = await sendYouTubeReply(accessToken, comment.id, responseText);
                        break;
                    case client_1.Platform.INSTAGRAM:
                        responseId = await sendInstagramReply(accessToken, comment.id, responseText);
                        break;
                    case client_1.Platform.TIKTOK:
                        responseId = await sendTikTokReply(accessToken, comment.id, comment.videoId, responseText);
                        break;
                }
                break;
            }
            case client_1.ResponseAction.SEND_DM: {
                if (comment.platform === client_1.Platform.INSTAGRAM) {
                    responseId = await sendInstagramDM(accessToken, comment.authorId, responseText);
                }
                else {
                    throw new Error('DM only supported for Instagram');
                }
                break;
            }
            case client_1.ResponseAction.LOG_ONLY: {
                // Don't send anything, just log
                console.log('LOG_ONLY: Would send:', responseText);
                responseId = 'log-only';
                break;
            }
            case client_1.ResponseAction.WEBHOOK: {
                // Call external webhook
                if (rule.customLink) {
                    await axios_1.default.post(rule.customLink, {
                        comment,
                        rule: {
                            id: rule.id,
                            name: rule.name,
                        },
                        matchedKeyword,
                        aiConfidenceScore,
                    });
                    responseId = 'webhook-sent';
                }
                else {
                    throw new Error('Webhook URL not configured');
                }
                break;
            }
        }
        // Increment daily usage
        await (0, rate_limiter_1.incrementResponseCount)(rule.id, userId);
        // Update log
        const log = await prisma.autoReplyLog.findFirst({
            where: {
                ruleId: rule.id,
                commentId: comment.id,
                responseSent: false,
            },
            orderBy: {
                triggeredAt: 'desc',
            },
        });
        if (log) {
            await prisma.autoReplyLog.update({
                where: { id: log.id },
                data: {
                    responseSent: true,
                    responseText,
                    responseId,
                    respondedAt: new Date(),
                },
            });
        }
        console.log(`Successfully sent response to ${comment.platform} comment ${comment.id}`);
        return {
            success: true,
            responseId,
        };
    }
    catch (error) {
        console.error('Error sending response:', error);
        // Update log with error
        const log = await prisma.autoReplyLog.findFirst({
            where: {
                ruleId: rule.id,
                commentId: comment.id,
                responseSent: false,
            },
            orderBy: {
                triggeredAt: 'desc',
            },
        });
        if (log) {
            await prisma.autoReplyLog.update({
                where: { id: log.id },
                data: {
                    errorMessage: error.message,
                    respondedAt: new Date(),
                },
            });
        }
        return {
            success: false,
            errorMessage: error.message,
        };
    }
};
exports.sendResponse = sendResponse;
//# sourceMappingURL=response-sender.service.js.map