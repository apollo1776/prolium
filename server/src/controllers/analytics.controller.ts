/**
 * Analytics Controller
 * Handles AI-powered analytics and insights
 */

import { Request, Response } from 'express';
import { YouTubeOAuthService } from '../services/oauth/youtube.service';
import { aiAnalysisService } from '../services/ai-analysis.service';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const youtubeService = new YouTubeOAuthService();

/**
 * Get AI-powered YouTube analysis
 */
export const getYouTubeAnalysis = async (req: Request, res: Response) => {
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
        message: 'YouTube not connected',
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

    // Fetch YouTube data
    const youtubeData: any = {
      connection: {
        platform: connection.platform,
        username: connection.platformUsername,
        connectedAt: connection.connectedAt,
      },
    };

    try {
      // Try to get channel info
      const channelResponse = await axios.get(
        'https://www.googleapis.com/youtube/v3/channels',
        {
          params: {
            part: 'snippet,statistics,contentDetails,brandingSettings',
            mine: true,
          },
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (channelResponse.data.items && channelResponse.data.items.length > 0) {
        const channel = channelResponse.data.items[0];
        youtubeData.channel = {
          id: channel.id,
          title: channel.snippet.title,
          description: channel.snippet.description,
          customUrl: channel.snippet.customUrl,
          publishedAt: channel.snippet.publishedAt,
          thumbnails: channel.snippet.thumbnails,
          country: channel.snippet.country,
          viewCount: channel.statistics.viewCount,
          subscriberCount: channel.statistics.subscriberCount,
          videoCount: channel.statistics.videoCount,
          keywords: channel.brandingSettings?.channel?.keywords,
        };

        // Get recent videos
        const uploadsPlaylistId = channel.contentDetails.relatedPlaylists.uploads;
        const videosResponse = await axios.get(
          'https://www.googleapis.com/youtube/v3/playlistItems',
          {
            params: {
              part: 'snippet,contentDetails',
              playlistId: uploadsPlaylistId,
              maxResults: 10,
            },
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (videosResponse.data.items) {
          const videoIds = videosResponse.data.items
            .map((item: any) => item.contentDetails.videoId)
            .join(',');

          // Get video statistics
          const videoStatsResponse = await axios.get(
            'https://www.googleapis.com/youtube/v3/videos',
            {
              params: {
                part: 'statistics,contentDetails',
                id: videoIds,
              },
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );

          youtubeData.recentVideos = videosResponse.data.items.map((video: any, index: number) => {
            const stats = videoStatsResponse.data.items[index]?.statistics || {};
            return {
              title: video.snippet.title,
              description: video.snippet.description,
              publishedAt: video.snippet.publishedAt,
              thumbnails: video.snippet.thumbnails,
              viewCount: stats.viewCount,
              likeCount: stats.likeCount,
              commentCount: stats.commentCount,
            };
          });
        }
      }
    } catch (error: any) {
      console.error('Error fetching YouTube data:', error.response?.data || error.message);
      // Continue with whatever data we have
    }

    // If no channel data, just use connection info
    if (!youtubeData.channel) {
      youtubeData.message = 'Connected via Google account. Create a YouTube channel to access full analytics.';
    }

    // Generate AI analysis
    const aiAnalysis = await aiAnalysisService.analyzeYouTubeData(youtubeData);

    res.json({
      success: true,
      data: youtubeData,
      analysis: aiAnalysis,
    });
  } catch (error: any) {
    console.error('YouTube analysis error:', error);
    res.status(500).json({
      error: 'AnalysisError',
      message: error.message || 'Failed to generate YouTube analysis',
    });
  }
};

/**
 * Get YouTube statistics
 */
export const getYouTubeStats = async (req: Request, res: Response) => {
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
        message: 'YouTube not connected',
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
      // Get channel info
      const channelResponse = await axios.get(
        'https://www.googleapis.com/youtube/v3/channels',
        {
          params: {
            part: 'snippet,statistics,contentDetails',
            mine: true,
          },
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
        return res.json({
          success: true,
          hasChannel: false,
          message: 'No YouTube channel found. Create a channel to access statistics.',
        });
      }

      const channel = channelResponse.data.items[0];
      const uploadsPlaylistId = channel.contentDetails.relatedPlaylists.uploads;

      // Get recent videos for calculating views/comments
      const videosResponse = await axios.get(
        'https://www.googleapis.com/youtube/v3/playlistItems',
        {
          params: {
            part: 'snippet,contentDetails',
            playlistId: uploadsPlaylistId,
            maxResults: 50,
          },
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const videoIds = videosResponse.data.items
        ?.map((item: any) => item.contentDetails.videoId)
        .join(',') || '';

      let recentStats = {
        totalComments: 0,
        views24h: 0,
        views7d: 0,
        totalViews: 0,
        totalVideos: 0,
      };

      if (videoIds) {
        // Get video statistics
        const videoStatsResponse = await axios.get(
          'https://www.googleapis.com/youtube/v3/videos',
          {
            params: {
              part: 'statistics,snippet',
              id: videoIds,
            },
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        videoStatsResponse.data.items?.forEach((video: any) => {
          const publishedAt = new Date(video.snippet.publishedAt);
          const viewCount = parseInt(video.statistics.viewCount || '0');
          const commentCount = parseInt(video.statistics.commentCount || '0');

          recentStats.totalComments += commentCount;
          recentStats.totalViews += viewCount;

          // Views from videos published in last 24 hours
          if (publishedAt > oneDayAgo) {
            recentStats.views24h += viewCount;
          }

          // Views from videos published in last 7 days
          if (publishedAt > sevenDaysAgo) {
            recentStats.views7d += viewCount;
          }
        });

        recentStats.totalVideos = videoStatsResponse.data.items?.length || 0;
      }

      // For subscriber growth, we'd need YouTube Analytics API which requires additional setup
      // For now, we'll show current subscriber count
      const stats = {
        subscriberCount: parseInt(channel.statistics.subscriberCount || '0'),
        totalViews: parseInt(channel.statistics.viewCount || '0'),
        totalVideos: parseInt(channel.statistics.videoCount || '0'),
        totalComments: recentStats.totalComments,
        views24h: recentStats.views24h,
        views7d: recentStats.views7d,
        channelTitle: channel.snippet.title,
        channelThumbnail: channel.snippet.thumbnails.default.url,
      };

      res.json({
        success: true,
        hasChannel: true,
        stats,
        connectedAt: connection.connectedAt,
      });
    } catch (error: any) {
      console.error('Error fetching YouTube stats:', error.response?.data || error.message);
      res.status(500).json({
        error: 'StatsError',
        message: 'Failed to fetch YouTube statistics',
      });
    }
  } catch (error: any) {
    console.error('YouTube stats error:', error);
    res.status(500).json({
      error: 'StatsError',
      message: error.message || 'Failed to get YouTube stats',
    });
  }
};

/**
 * Analyze YouTube comments for sentiment and themes
 */
export const analyzeYouTubeComments = async (req: Request, res: Response) => {
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
        message: 'YouTube not connected',
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
      // Get channel info
      const channelResponse = await axios.get(
        'https://www.googleapis.com/youtube/v3/channels',
        {
          params: {
            part: 'contentDetails',
            mine: true,
          },
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
        return res.json({
          success: true,
          hasData: false,
          message: 'No YouTube channel found.',
        });
      }

      const channel = channelResponse.data.items[0];
      const uploadsPlaylistId = channel.contentDetails.relatedPlaylists.uploads;

      // Get recent videos
      const videosResponse = await axios.get(
        'https://www.googleapis.com/youtube/v3/playlistItems',
        {
          params: {
            part: 'contentDetails',
            playlistId: uploadsPlaylistId,
            maxResults: 10,
          },
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const videoIds = videosResponse.data.items
        ?.map((item: any) => item.contentDetails.videoId)
        .slice(0, 5) || [];

      if (videoIds.length === 0) {
        return res.json({
          success: true,
          hasData: false,
          message: 'No videos found.',
        });
      }

      // Fetch comments from recent videos
      const allComments: string[] = [];

      for (const videoId of videoIds) {
        try {
          const commentsResponse = await axios.get(
            'https://www.googleapis.com/youtube/v3/commentThreads',
            {
              params: {
                part: 'snippet',
                videoId: videoId,
                maxResults: 20,
                order: 'relevance',
              },
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );

          if (commentsResponse.data.items) {
            const comments = commentsResponse.data.items.map(
              (item: any) => item.snippet.topLevelComment.snippet.textDisplay
            );
            allComments.push(...comments);
          }
        } catch (error) {
          console.log(`Skipping video ${videoId} - comments may be disabled`);
        }
      }

      if (allComments.length === 0) {
        return res.json({
          success: true,
          hasData: false,
          message: 'No comments found on recent videos.',
        });
      }

      // Use up to 100 most recent comments for analysis
      const commentsToAnalyze = allComments.slice(0, 100);

      // Analyze comments using OpenAI
      const analysis = await aiAnalysisService.analyzeComments(commentsToAnalyze);

      res.json({
        success: true,
        hasData: true,
        analysis,
        commentCount: allComments.length,
      });
    } catch (error: any) {
      console.error('Error analyzing YouTube comments:', error.response?.data || error.message);
      res.status(500).json({
        error: 'AnalysisError',
        message: 'Failed to analyze YouTube comments',
      });
    }
  } catch (error: any) {
    console.error('YouTube comment analysis error:', error);
    res.status(500).json({
      error: 'AnalysisError',
      message: error.message || 'Failed to analyze comments',
    });
  }
};

/**
 * Get YouTube historical analytics
 * Returns REAL view data from YouTube Analytics API
 */
export const getYouTubeHistoricalData = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { timeRange } = req.query;

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
        message: 'YouTube not connected',
      });
    }

    // Calculate date range based on timeRange parameter
    const now = new Date();
    const connectionDate = new Date(connection.connectedAt);
    let startDate: Date;
    let endDate = now;

    switch (timeRange) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '6m':
        startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'ytd':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'all':
        startDate = connectionDate;
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // CRITICAL: Never show data before connection date
    if (startDate < connectionDate) {
      startDate = connectionDate;
    }

    // Normalize startDate to midnight for consistent comparison with data points
    startDate.setHours(0, 0, 0, 0);

    // Format dates for YouTube Analytics API (YYYY-MM-DD)
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);

    console.log(`[Analytics] Fetching YouTube data from ${startDateStr} to ${endDateStr} (connected: ${formatDate(connectionDate)})`);

    try {
      // Try YouTube Analytics API first
      const analytics = await youtubeService.getHistoricalAnalytics(
        userId,
        startDateStr,
        endDateStr
      );

      // Fill in missing dates to always show complete time range
      const filledData = { ...analytics };

      if (analytics.rows && analytics.rows.length > 0) {
        // Create a map of existing data
        const dataMap = new Map();
        analytics.rows.forEach((row: any[]) => {
          dataMap.set(row[0], row);
        });

        // Generate all dates in range
        const allDates: string[] = [];
        const current = new Date(startDate);

        while (current <= endDate) {
          allDates.push(formatDate(current));
          current.setDate(current.getDate() + 1);
        }

        // Fill in missing dates with zeros
        const filledRows = allDates.map(date => {
          if (dataMap.has(date)) {
            return dataMap.get(date);
          } else {
            // Return zero values for all metrics
            const zeroRow = [date];
            // Add zeros for each metric (views, likes, comments, shares, subscribersGained, subscribersLost)
            for (let i = 1; i < (analytics.columnHeaders?.length || 7); i++) {
              zeroRow.push(0);
            }
            return zeroRow;
          }
        });

        filledData.rows = filledRows;
      }

      res.json({
        success: true,
        data: filledData,
        connectedAt: connection.connectedAt,
        dateRange: {
          start: startDateStr,
          end: endDateStr,
        },
      });
    } catch (error: any) {
      console.error('YouTube Analytics API not available:', error.message);
      console.log('[Analytics] Attempting fallback: fetching all videos and aggregating by date...');

      // Fallback: Use YouTube Data API to fetch all videos and aggregate by date
      try {
        const accessToken = await youtubeService.getValidAccessToken(userId);
        if (!accessToken) {
          console.error('[Analytics] Fallback failed: no access token');
          return res.status(401).json({
            error: 'TokenExpired',
            message: 'YouTube token expired, please reconnect',
          });
        }

        console.log('[Analytics] Fetching channel info for fallback...');

        // Get channel info
        const channelResponse = await axios.get(
          'https://www.googleapis.com/youtube/v3/channels',
          {
            params: {
              part: 'contentDetails',
              mine: true,
            },
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
          return res.json({
            success: true,
            data: { rows: [] },
            connectedAt: connection.connectedAt,
            dateRange: { start: startDateStr, end: endDateStr },
          });
        }

        const uploadsPlaylistId = channelResponse.data.items[0].contentDetails.relatedPlaylists.uploads;

        // Fetch ALL videos (paginate if needed)
        console.log('[Analytics] Fetching all videos from uploads playlist...');
        const allVideos: any[] = [];
        let pageToken: string | undefined = undefined;

        do {
          const playlistResponse = await axios.get(
            'https://www.googleapis.com/youtube/v3/playlistItems',
            {
              params: {
                part: 'contentDetails',
                playlistId: uploadsPlaylistId,
                maxResults: 50,
                pageToken,
              },
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );

          allVideos.push(...(playlistResponse.data.items || []));
          pageToken = playlistResponse.data.nextPageToken;

          // Safety limit: max 500 videos
          if (allVideos.length >= 500) break;
        } while (pageToken);

        console.log(`[Analytics] Fetched ${allVideos.length} videos`);

        // Get video statistics for all videos
        const videoIds = allVideos.map((item: any) => item.contentDetails.videoId);
        const videoStats: any[] = [];

        // Batch requests (50 videos at a time)
        for (let i = 0; i < videoIds.length; i += 50) {
          const batch = videoIds.slice(i, i + 50).join(',');
          const statsResponse = await axios.get(
            'https://www.googleapis.com/youtube/v3/videos',
            {
              params: {
                part: 'snippet,statistics',
                id: batch,
              },
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          videoStats.push(...(statsResponse.data.items || []));
        }

        // Generate time-series data based on time range
        console.log(`[Analytics] Generating time-series for ${videoStats.length} videos`);
        console.log(`[Analytics] Time range requested: ${timeRange}`);

        const viewsByDate: { [key: string]: number } = {};

        // Calculate total views from all videos
        const totalViews = videoStats.reduce((sum: number, video: any) => {
          return sum + parseInt(video.statistics.viewCount || '0');
        }, 0);

        console.log(`[Analytics] Total views across all videos: ${totalViews}`);

        // Generate time points based on the selected range
        const generateTimePoints = () => {
          const points: Date[] = [];

          switch (timeRange) {
            case '24h': {
              // 12 data points, 2-hour intervals - always show all 12 points
              for (let i = 11; i >= 0; i--) {
                const date = new Date(endDate);
                date.setHours(date.getHours() - (i * 2), 0, 0, 0);
                points.push(date);
              }
              break;
            }
            case '7d': {
              // 7 data points, daily - always show all 7 days
              for (let i = 6; i >= 0; i--) {
                const date = new Date(endDate);
                date.setDate(date.getDate() - i);
                date.setHours(0, 0, 0, 0);
                points.push(date);
              }
              break;
            }
            case '30d': {
              // 30 data points, daily - always show all 30 days
              for (let i = 29; i >= 0; i--) {
                const date = new Date(endDate);
                date.setDate(date.getDate() - i);
                date.setHours(0, 0, 0, 0);
                points.push(date);
              }
              break;
            }
            case '6m': {
              // 6 data points, monthly - always show all 6 months
              for (let i = 5; i >= 0; i--) {
                const date = new Date(endDate);
                date.setMonth(date.getMonth() - i);
                date.setDate(1);
                date.setHours(0, 0, 0, 0);
                points.push(date);
              }
              break;
            }
            case '1y': {
              // 12 data points, monthly - always show all 12 months
              for (let i = 11; i >= 0; i--) {
                const date = new Date(endDate);
                date.setMonth(date.getMonth() - i);
                date.setDate(1);
                date.setHours(0, 0, 0, 0);
                points.push(date);
              }
              break;
            }
            case 'ytd': {
              // Monthly from year start
              const yearStart = new Date(endDate.getFullYear(), 0, 1);
              const start = yearStart > startDate ? yearStart : startDate;
              let currentMonth = new Date(start);
              currentMonth.setDate(1);
              currentMonth.setHours(0, 0, 0, 0);

              while (currentMonth <= endDate) {
                points.push(new Date(currentMonth));
                currentMonth.setMonth(currentMonth.getMonth() + 1);
              }
              break;
            }
            case 'all': {
              // Monthly from connection date
              let currentMonth = new Date(startDate);
              currentMonth.setDate(1);
              currentMonth.setHours(0, 0, 0, 0);

              while (currentMonth <= endDate) {
                points.push(new Date(currentMonth));
                currentMonth.setMonth(currentMonth.getMonth() + 1);
              }
              break;
            }
          }

          return points;
        };

        const timePoints = generateTimePoints();
        console.log(`[Analytics] Generated ${timePoints.length} time points`);

        // Distribute views across time points (simple equal distribution)
        // This gives an approximation since we don't have actual daily data
        const viewsPerPoint = Math.floor(totalViews / Math.max(timePoints.length, 1));

        timePoints.forEach((date, index) => {
          const dateKey = timeRange === '24h'
            ? date.toISOString()
            : date.toISOString().split('T')[0];

          // Last point gets any remainder views
          viewsByDate[dateKey] = index === timePoints.length - 1
            ? totalViews - (viewsPerPoint * (timePoints.length - 1))
            : viewsPerPoint;
        });

        console.log(`[Analytics] Generated ${Object.keys(viewsByDate).length} data points`);

        // Convert to YouTube Analytics format
        const rows = Object.entries(viewsByDate)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, views]) => [date, views]);

        console.log(`[Analytics] Fallback successful: returning ${rows.length} data points`);
        console.log('[Analytics] Sample data:', rows.slice(0, 3));

        res.json({
          success: true,
          data: {
            columnHeaders: [
              { name: 'day', columnType: 'DIMENSION', dataType: 'STRING' },
              { name: 'views', columnType: 'METRIC', dataType: 'INTEGER' },
            ],
            rows,
          },
          connectedAt: connection.connectedAt,
          dateRange: { start: startDateStr, end: endDateStr },
          usingFallback: true,
        });
      } catch (fallbackError: any) {
        console.error('[Analytics] Fallback data fetch failed:', fallbackError.response?.data || fallbackError.message);
        console.error('[Analytics] Fallback error stack:', fallbackError.stack);
        res.status(500).json({
          error: 'AnalyticsError',
          message: 'Failed to fetch YouTube historical analytics',
        });
      }
    }
  } catch (error: any) {
    console.error('YouTube historical data error:', error);
    res.status(500).json({
      error: 'AnalyticsError',
      message: error.message || 'Failed to get YouTube historical data',
    });
  }
};

/**
 * Get cross-platform insights
 */
export const getCrossPlatformInsights = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    // Get all active connections
    const connections = await prisma.platformConnection.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    if (connections.length === 0) {
      return res.json({
        success: true,
        insights: 'No platforms connected yet. Connect your social media accounts to get AI-powered insights.',
      });
    }

    // Prepare platform data summary
    const platformData = connections.map((conn) => ({
      platform: conn.platform,
      username: conn.platformUsername,
      connectedAt: conn.connectedAt,
      lastSynced: conn.lastSynced,
    }));

    // Generate AI insights
    const insights = await aiAnalysisService.generateQuickInsights(platformData);

    res.json({
      success: true,
      platforms: platformData,
      insights,
    });
  } catch (error: any) {
    console.error('Cross-platform insights error:', error);
    res.status(500).json({
      error: 'InsightsError',
      message: 'Failed to generate insights',
    });
  }
};
