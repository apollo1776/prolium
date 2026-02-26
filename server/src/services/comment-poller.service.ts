/**
 * Comment Polling Service
 * Fetches new comments from YouTube, Instagram, and TikTok
 */

import { PrismaClient, Platform } from '@prisma/client';
import axios from 'axios';
import { EncryptionService } from './encryption.service';
import { commentProcessQueue } from '../lib/queues';

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
 * Poll YouTube comments for a specific video
 */
export const pollYouTubeComments = async (
  accessToken: string,
  videoId: string,
  userId: string
): Promise<Comment[]> => {
  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/commentThreads', {
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

    const comments: Comment[] = response.data.items.map((item: any) => ({
      id: item.id,
      text: item.snippet.topLevelComment.snippet.textDisplay,
      author: item.snippet.topLevelComment.snippet.authorDisplayName,
      authorId: item.snippet.topLevelComment.snippet.authorChannelId?.value || '',
      videoId,
      platform: Platform.YOUTUBE,
      publishedAt: new Date(item.snippet.topLevelComment.snippet.publishedAt),
    }));

    return comments;
  } catch (error: any) {
    console.error('Error polling YouTube comments:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Poll Instagram comments for a media post
 */
export const pollInstagramComments = async (
  accessToken: string,
  mediaId: string,
  userId: string
): Promise<Comment[]> => {
  try {
    const response = await axios.get(`https://graph.instagram.com/${mediaId}/comments`, {
      params: {
        fields: 'id,text,username,timestamp',
        access_token: accessToken,
      },
    });

    const comments: Comment[] = response.data.data.map((item: any) => ({
      id: item.id,
      text: item.text,
      author: item.username,
      authorId: item.from?.id || item.username,
      videoId: mediaId,
      platform: Platform.INSTAGRAM,
      publishedAt: new Date(item.timestamp),
    }));

    return comments;
  } catch (error: any) {
    console.error('Error polling Instagram comments:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Poll TikTok comments for a video
 */
export const pollTikTokComments = async (
  accessToken: string,
  videoId: string,
  userId: string
): Promise<Comment[]> => {
  try {
    // Note: TikTok API for comments requires approval and specific permissions
    const response = await axios.get(`https://open.tiktokapis.com/v2/video/comment/list/`, {
      params: {
        video_id: videoId,
        max_count: 100,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const comments: Comment[] = (response.data.data?.comments || []).map((item: any) => ({
      id: item.id,
      text: item.text,
      author: item.user.display_name,
      authorId: item.user.id,
      videoId,
      platform: Platform.TIKTOK,
      publishedAt: new Date(item.create_time * 1000),
    }));

    return comments;
  } catch (error: any) {
    console.error('Error polling TikTok comments:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Filter out already processed comments
 */
const filterNewComments = async (comments: Comment[]): Promise<Comment[]> => {
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
const markCommentsAsProcessed = async (comments: Comment[]): Promise<void> => {
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
const queueCommentsForProcessing = async (comments: Comment[], userId: string): Promise<void> => {
  if (!commentProcessQueue) {
    console.warn('[Comment Poller] Redis not available - skipping queue');
    return;
  }

  for (const comment of comments) {
    await commentProcessQueue.add('process-comment', {
      comment,
      userId,
    });
  }
};

/**
 * Poll all videos for a user's platform connection
 */
export const pollPlatformComments = async (userId: string, platform: Platform): Promise<void> => {
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
    const accessToken = EncryptionService.decrypt(connection.accessToken);

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
    const videoIds = new Set<string>();
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
        let comments: Comment[] = [];

        switch (platform) {
          case Platform.YOUTUBE:
            comments = await pollYouTubeComments(accessToken, videoId, userId);
            break;
          case Platform.INSTAGRAM:
            comments = await pollInstagramComments(accessToken, videoId, userId);
            break;
          case Platform.TIKTOK:
            comments = await pollTikTokComments(accessToken, videoId, userId);
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
      } catch (error) {
        console.error(`Error polling ${platform} video ${videoId}:`, error);
        // Continue with next video
      }
    }
  } catch (error) {
    console.error(`Error polling ${platform} for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Poll all active platforms for a user
 */
export const pollAllPlatforms = async (userId: string): Promise<void> => {
  const platforms = [Platform.YOUTUBE, Platform.INSTAGRAM, Platform.TIKTOK];

  for (const platform of platforms) {
    try {
      await pollPlatformComments(userId, platform);
    } catch (error) {
      console.error(`Error polling ${platform}:`, error);
      // Continue with next platform
    }
  }
};
