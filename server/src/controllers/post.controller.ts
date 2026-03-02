/**
 * Post Controller
 * Handles publishing content to connected social media platforms.
 */
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { postTweet } from '../services/x/xPostService';

const prisma = new PrismaClient();

export const postController = {
  /**
   * Post content to a connected platform
   * POST /posts/publish
   * Body: { platform, content, hashtags?, taskId? }
   */
  async publishPost(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { platform, content, hashtags, taskId } = req.body;

      if (!platform || !content?.trim()) {
        return res.status(400).json({ error: 'platform and content are required' });
      }

      const platformUpper = platform.toUpperCase();

      // Check if user has this platform connected
      const connection = await prisma.platformConnection.findUnique({
        where: { userId_platform: { userId, platform: platformUpper } },
      });

      if (!connection || !connection.isActive) {
        return res.status(400).json({
          error: `${platform} is not connected. Please connect your ${platform} account first.`,
        });
      }

      let result: any = null;

      // Build full post text with hashtags
      let fullText = content.trim();
      if (hashtags && hashtags.length > 0) {
        const tags = hashtags.map((h: string) => h.startsWith('#') ? h : `#${h}`).join(' ');
        // Only add hashtags if they fit within character limits
        if (platformUpper === 'X' && (fullText.length + tags.length + 2) <= 280) {
          fullText = `${fullText}\n\n${tags}`;
        } else if (platformUpper !== 'X') {
          fullText = `${fullText}\n\n${tags}`;
        }
      }

      switch (platformUpper) {
        case 'X':
          // Enforce 280 char limit
          if (fullText.length > 280) {
            fullText = fullText.substring(0, 277) + '...';
          }
          result = await postTweet(userId, fullText);
          break;
        default:
          return res.status(400).json({
            error: `Posting to ${platform} is not yet supported. Currently supported: X (Twitter)`,
          });
      }

      // Save post record
      const post = await prisma.post.create({
        data: {
          userId,
          platform: platformUpper as any,
          content: fullText,
          status: 'published',
          publishedAt: new Date(),
        },
      });

      // Update task status if provided
      if (taskId) {
        await prisma.agentTask.updateMany({
          where: { id: taskId, userId },
          data: { status: 'completed', completedAt: new Date(), moduleOutput: result },
        });
      }

      res.json({
        success: true,
        post: {
          id: post.id,
          platform,
          content: fullText,
          publishedAt: post.publishedAt,
          ...result,
        },
      });
    } catch (err: any) {
      console.error('[Post] publishPost error:', err);
      res.status(500).json({
        error: err.message || 'Failed to publish post',
      });
    }
  },

  /**
   * Get user's post history
   * GET /posts/history
   */
  async getHistory(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const posts = await prisma.post.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      res.json({ posts });
    } catch (err: any) {
      console.error('[Post] getHistory error:', err);
      res.status(500).json({ error: 'Failed to get post history' });
    }
  },
};
