/**
 * Response Sender Service
 * Sends auto-replies to comments on various platforms
 */

import { PrismaClient, Platform, ResponseAction, AutoReplyRule } from '@prisma/client';
import axios from 'axios';
import { EncryptionService } from './encryption.service';
import { replaceTemplateVariables } from '../lib/template-engine';
import { incrementResponseCount } from '../lib/rate-limiter';

const prisma = new PrismaClient();

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
 * Send a reply to a YouTube comment
 */
const sendYouTubeReply = async (accessToken: string, commentId: string, responseText: string): Promise<string> => {
  try {
    const response = await axios.post(
      'https://www.googleapis.com/youtube/v3/comments',
      {
        snippet: {
          parentId: commentId,
          textOriginal: responseText,
        },
      },
      {
        params: {
          part: 'snippet',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.id;
  } catch (error: any) {
    console.error('Error sending YouTube reply:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || 'Failed to send YouTube reply');
  }
};

/**
 * Send a reply to an Instagram comment
 */
const sendInstagramReply = async (accessToken: string, commentId: string, responseText: string): Promise<string> => {
  try {
    const response = await axios.post(
      `https://graph.instagram.com/${commentId}/replies`,
      {
        message: responseText,
      },
      {
        params: {
          access_token: accessToken,
        },
      }
    );

    return response.data.id;
  } catch (error: any) {
    console.error('Error sending Instagram reply:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || 'Failed to send Instagram reply');
  }
};

/**
 * Send an Instagram DM
 */
const sendInstagramDM = async (accessToken: string, userId: string, responseText: string): Promise<string> => {
  try {
    const response = await axios.post(
      'https://graph.instagram.com/me/messages',
      {
        recipient: { id: userId },
        message: { text: responseText },
      },
      {
        params: {
          access_token: accessToken,
        },
      }
    );

    return response.data.message_id;
  } catch (error: any) {
    console.error('Error sending Instagram DM:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || 'Failed to send Instagram DM');
  }
};

/**
 * Send a reply to a TikTok comment
 */
const sendTikTokReply = async (accessToken: string, commentId: string, videoId: string, responseText: string): Promise<string> => {
  try {
    // Note: TikTok comment reply API requires special permissions
    const response = await axios.post(
      'https://open.tiktokapis.com/v2/video/comment/reply/',
      {
        video_id: videoId,
        comment_id: commentId,
        text: responseText,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.data.comment_id;
  } catch (error: any) {
    console.error('Error sending TikTok reply:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || 'Failed to send TikTok reply');
  }
};

/**
 * Get video title for template variable
 */
const getVideoTitle = async (platform: Platform, videoId: string, accessToken: string): Promise<string> => {
  try {
    switch (platform) {
      case Platform.YOUTUBE: {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
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
      case Platform.INSTAGRAM: {
        const response = await axios.get(`https://graph.instagram.com/${videoId}`, {
          params: {
            fields: 'caption',
            access_token: accessToken,
          },
        });
        return response.data.caption || 'this post';
      }
      case Platform.TIKTOK: {
        // TikTok doesn't always have titles, use description
        return 'this video';
      }
      default:
        return 'this content';
    }
  } catch (error) {
    console.error('Error fetching video title:', error);
    return 'this content';
  }
};

/**
 * Send a response to a comment
 */
export const sendResponse = async (
  comment: Comment,
  rule: AutoReplyRule,
  userId: string,
  matchedKeyword?: string,
  aiConfidenceScore?: number
): Promise<{ success: boolean; responseId?: string; errorMessage?: string }> => {
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
    const accessToken = EncryptionService.decrypt(connection.accessToken);

    // Get video title for template
    const videoTitle = await getVideoTitle(comment.platform, comment.videoId, accessToken);

    // Replace template variables
    const responseText = replaceTemplateVariables(rule.responseTemplate, {
      username: comment.author,
      videoTitle,
      customLink: rule.customLink || '',
      commentText: comment.text,
      platform: comment.platform,
    });

    // Send response based on action type
    let responseId: string | undefined;

    switch (rule.responseAction) {
      case ResponseAction.REPLY_COMMENT:
      case ResponseAction.SEND_LINK: {
        switch (comment.platform) {
          case Platform.YOUTUBE:
            responseId = await sendYouTubeReply(accessToken, comment.id, responseText);
            break;
          case Platform.INSTAGRAM:
            responseId = await sendInstagramReply(accessToken, comment.id, responseText);
            break;
          case Platform.TIKTOK:
            responseId = await sendTikTokReply(accessToken, comment.id, comment.videoId, responseText);
            break;
        }
        break;
      }

      case ResponseAction.SEND_DM: {
        if (comment.platform === Platform.INSTAGRAM) {
          responseId = await sendInstagramDM(accessToken, comment.authorId, responseText);
        } else {
          throw new Error('DM only supported for Instagram');
        }
        break;
      }

      case ResponseAction.LOG_ONLY: {
        // Don't send anything, just log
        console.log('LOG_ONLY: Would send:', responseText);
        responseId = 'log-only';
        break;
      }

      case ResponseAction.WEBHOOK: {
        // Call external webhook
        if (rule.customLink) {
          await axios.post(rule.customLink, {
            comment,
            rule: {
              id: rule.id,
              name: rule.name,
            },
            matchedKeyword,
            aiConfidenceScore,
          });
          responseId = 'webhook-sent';
        } else {
          throw new Error('Webhook URL not configured');
        }
        break;
      }
    }

    // Increment daily usage
    await incrementResponseCount(rule.id, userId);

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
  } catch (error: any) {
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
