/**
 * Trends Controller
 * Fetches trending content and topics from platforms
 */

import { Request, Response } from 'express';
import { YouTubeOAuthService } from '../services/oauth/youtube.service';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const youtubeService = new YouTubeOAuthService();

/**
 * Get trending data for TikTok
 */
export const getTikTokTrends = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    // Check if TikTok is connected
    const connection = await prisma.platformConnection.findFirst({
      where: {
        userId,
        platform: 'TIKTOK',
        isActive: true,
      },
    });

    if (!connection) {
      return res.status(404).json({
        error: 'NotConnected',
        message: 'TikTok not connected. Connect TikTok to see trending data.',
      });
    }

    // TODO: Implement TikTok API trending data fetch once TikTok OAuth is complete
    // For now, return placeholder data
    res.json({
      success: true,
      data: {
        trendingTopics: [],
        topicSaturation: [],
        nicheIntelligence: 'TikTok trending data coming soon. Complete TikTok OAuth setup to access real-time trends.',
      },
    });
  } catch (error: any) {
    console.error('TikTok trends error:', error);
    res.status(500).json({
      error: 'TrendsError',
      message: error.message || 'Failed to get TikTok trending data',
    });
  }
};

/**
 * Get trending data for Instagram
 */
export const getInstagramTrends = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    // Check if Instagram is connected
    const connection = await prisma.platformConnection.findFirst({
      where: {
        userId,
        platform: 'INSTAGRAM',
        isActive: true,
      },
    });

    if (!connection) {
      return res.status(404).json({
        error: 'NotConnected',
        message: 'Instagram not connected. Connect Instagram to see trending data.',
      });
    }

    // TODO: Implement Instagram API trending data fetch once Instagram OAuth is complete
    // For now, return placeholder data
    res.json({
      success: true,
      data: {
        trendingTopics: [],
        topicSaturation: [],
        nicheIntelligence: 'Instagram trending data coming soon. Complete Instagram OAuth setup to access real-time trends.',
      },
    });
  } catch (error: any) {
    console.error('Instagram trends error:', error);
    res.status(500).json({
      error: 'TrendsError',
      message: error.message || 'Failed to get Instagram trending data',
    });
  }
};

/**
 * Get trending videos and topics from YouTube
 */
export const getYouTubeTrends = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    // Get YouTube connection
    const connection = await prisma.platformConnection.findFirst({
      where: {
        userId,
        platform: 'YOUTUBE',
        isActive: true,
      },
    });

    if (!connection) {
      return res.status(404).json({
        error: 'NotConnected',
        message: 'YouTube not connected. Connect YouTube to see trending data.',
      });
    }

    // Get valid access token
    const accessToken = await youtubeService.getValidAccessToken(userId);
    if (!accessToken) {
      return res.status(401).json({
        error: 'TokenExpired',
        message: 'YouTube token expired, please reconnect',
      });
    }

    try {
      // Get trending videos (most popular videos)
      const trendingResponse = await axios.get(
        'https://www.googleapis.com/youtube/v3/videos',
        {
          params: {
            part: 'snippet,statistics,contentDetails',
            chart: 'mostPopular',
            regionCode: 'US',
            maxResults: 10,
            videoCategoryId: '28', // Science & Technology category
          },
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const trendingVideos = trendingResponse.data.items?.map((video: any) => ({
        id: video.id,
        title: video.snippet.title,
        channelTitle: video.snippet.channelTitle,
        viewCount: parseInt(video.statistics.viewCount || '0'),
        likeCount: parseInt(video.statistics.likeCount || '0'),
        commentCount: parseInt(video.statistics.commentCount || '0'),
        publishedAt: video.snippet.publishedAt,
        thumbnail: video.snippet.thumbnails.medium.url,
        tags: video.snippet.tags || [],
      })) || [];

      // Extract trending topics from video tags
      const tagFrequency: { [key: string]: number } = {};
      trendingVideos.forEach((video: any) => {
        video.tags.forEach((tag: string) => {
          if (tag && tag.length > 2) {
            const normalizedTag = tag.toLowerCase();
            tagFrequency[normalizedTag] = (tagFrequency[normalizedTag] || 0) + 1;
          }
        });
      });

      // Sort tags by frequency and calculate growth (simulated based on view counts)
      const trendingTopics = Object.entries(tagFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tag, count]) => {
          const relatedVideos = trendingVideos.filter((v: any) =>
            v.tags.some((t: string) => t.toLowerCase() === tag)
          );
          const totalViews = relatedVideos.reduce((sum: number, v: any) => sum + v.viewCount, 0);
          const avgLikes = relatedVideos.reduce((sum: number, v: any) => sum + v.likeCount, 0) / relatedVideos.length;

          // Simulate growth percentage based on engagement
          const engagementRate = relatedVideos.length > 0 ? (avgLikes / (totalViews / relatedVideos.length)) * 100 : 0;
          const growth = Math.min(Math.floor(engagementRate * 30), 250);

          return {
            tag: tag.replace(/\s+/g, '_'),
            volume: totalViews > 1000000 ? `${(totalViews / 1000000).toFixed(1)}M` : `${(totalViews / 1000).toFixed(0)}K`,
            growth: `+${growth}%`,
            status: growth > 100 ? 'viral' : growth > 50 ? 'rising' : 'stable',
            videoCount: count,
          };
        });

      // Calculate topic saturation (based on video counts in categories)
      const topicSaturation = [
        {
          label: trendingTopics[0]?.tag.replace(/_/g, ' ') || 'Technology',
          val: Math.min((trendingTopics[0]?.videoCount || 1) * 15, 85),
          color: 'bg-indigo-500/40',
        },
        {
          label: trendingTopics[1]?.tag.replace(/_/g, ' ') || 'AI & ML',
          val: Math.min((trendingTopics[1]?.videoCount || 1) * 10, 60),
          color: 'bg-emerald-500/40',
        },
        {
          label: trendingTopics[2]?.tag.replace(/_/g, ' ') || 'Development',
          val: Math.min((trendingTopics[2]?.videoCount || 1) * 8, 45),
          color: 'bg-amber-500/40',
        },
      ];

      // AI-generated niche intelligence based on trending data
      const topTrend = trendingTopics[0];
      const nicheIntelligence = topTrend
        ? `Creators in the ${topTrend.tag.replace(/_/g, ' ')} space are gaining massive traction. Content with "${topTrend.tag.replace(/_/g, ' ')}" tags is seeing ${topTrend.growth} growth this week with ${topTrend.volume} total views.`
        : 'Connect more platforms to get personalized niche intelligence and trend analysis.';

      res.json({
        success: true,
        data: {
          trendingTopics,
          trendingVideos: trendingVideos.slice(0, 5),
          topicSaturation,
          nicheIntelligence,
        },
      });
    } catch (error: any) {
      console.error('Error fetching trending data:', error.response?.data || error.message);
      res.status(500).json({
        error: 'TrendsError',
        message: 'Failed to fetch trending data from YouTube',
      });
    }
  } catch (error: any) {
    console.error('Trends error:', error);
    res.status(500).json({
      error: 'TrendsError',
      message: error.message || 'Failed to get trending data',
    });
  }
};
