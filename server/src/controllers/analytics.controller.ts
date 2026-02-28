/**
 * Analytics Controller
 * Handles AI-powered analytics and insights
 */

import { Request, Response } from 'express';
import { YouTubeOAuthService } from '../services/oauth/youtube.service';
import { XOAuthService } from '../services/oauth/x.service';
import { aiAnalysisService } from '../services/ai-analysis.service';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const youtubeService = new YouTubeOAuthService();
const xService = new XOAuthService();

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

                                                                 if (publishedAt > oneDayAgo) {
                                                                               recentStats.views24h += viewCount;
                                                                 }
                            if (publishedAt > sevenDaysAgo) {
                                          recentStats.views7d += viewCount;
                            }
                });

                recentStats.totalVideos = videoStatsResponse.data.items?.length || 0;
            }

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

      const connection = await prisma.platformConnection.findFirst({
              where: { userId, platform: 'YOUTUBE', isActive: true },
      });

      if (!connection) {
              return res.status(404).json({ error: 'NotConnected', message: 'YouTube not connected' });
      }

      const accessToken = await youtubeService.getValidAccessToken(userId);
          if (!accessToken) {
                  return res.status(401).json({ error: 'TokenExpired', message: 'YouTube token expired, please reconnect' });
          }

      try {
              const channelResponse = await axios.get(
                        'https://www.googleapis.com/youtube/v3/channels',
                { params: { part: 'contentDetails', mine: true }, headers: { Authorization: `Bearer ${accessToken}` } }
                      );

            if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
                      return res.json({ success: true, hasData: false, message: 'No YouTube channel found.' });
            }

            const uploadsPlaylistId = channelResponse.data.items[0].contentDetails.relatedPlaylists.uploads;

            const videosResponse = await axios.get(
                      'https://www.googleapis.com/youtube/v3/playlistItems',
              { params: { part: 'contentDetails', playlistId: uploadsPlaylistId, maxResults: 10 }, headers: { Authorization: `Bearer ${accessToken}` } }
                    );

            const videoIds = videosResponse.data.items?.map((item: any) => item.contentDetails.videoId).slice(0, 5) || [];

            if (videoIds.length === 0) {
                      return res.json({ success: true, hasData: false, message: 'No videos found.' });
            }

            const allComments: string[] = [];
              for (const videoId of videoIds) {
                        try {
                                    const commentsResponse = await axios.get(
                                                  'https://www.googleapis.com/youtube/v3/commentThreads',
                                      { params: { part: 'snippet', videoId, maxResults: 20, order: 'relevance' }, headers: { Authorization: `Bearer ${accessToken}` } }
                                                );
                                    if (commentsResponse.data.items) {
                                                  allComments.push(...commentsResponse.data.items.map((item: any) => item.snippet.topLevelComment.snippet.textDisplay));
                                    }
                        } catch {
                                    console.log(`Skipping video ${videoId}`);
                        }
              }

            if (allComments.length === 0) {
                      return res.json({ success: true, hasData: false, message: 'No comments found on recent videos.' });
            }

            const analysis = await aiAnalysisService.analyzeComments(allComments.slice(0, 100));
              res.json({ success: true, hasData: true, analysis, commentCount: allComments.length });
      } catch (error: any) {
              console.error('Error analyzing YouTube comments:', error.response?.data || error.message);
              res.status(500).json({ error: 'AnalysisError', message: 'Failed to analyze YouTube comments' });
      }
    } catch (error: any) {
          console.error('YouTube comment analysis error:', error);
          res.status(500).json({ error: 'AnalysisError', message: error.message || 'Failed to analyze comments' });
    }
};

/**
 * Get YouTube historical analytics
 */
export const getYouTubeHistoricalData = async (req: Request, res: Response) => {
    try {
          const userId = req.user?.userId;
          const { timeRange } = req.query;

      if (!userId) {
              return res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
      }

      const connection = await prisma.platformConnection.findFirst({
              where: { userId, platform: 'YOUTUBE', isActive: true },
      });

      if (!connection) {
              return res.status(404).json({ error: 'NotConnected', message: 'YouTube not connected' });
      }

      const now = new Date();
          const connectionDate = new Date(connection.connectedAt);
          let startDate: Date;
          const endDate = now;

      switch (timeRange) {
        case '24h': startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
        case '7d': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
        case '30d': startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
        case '6m': startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000); break;
        case '1y': startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); break;
        case 'ytd': startDate = new Date(now.getFullYear(), 0, 1); break;
        case 'all': startDate = connectionDate; break;
        default: startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      if (startDate < connectionDate) { startDate = connectionDate; }
          startDate.setHours(0, 0, 0, 0);

      const formatDate = (date: Date) => date.toISOString().split('T')[0];
          const startDateStr = formatDate(startDate);
          const endDateStr = formatDate(endDate);

      try {
              const analytics = await youtubeService.getHistoricalAnalytics(userId, startDateStr, endDateStr);
              const filledData = { ...analytics };

            if (analytics.rows && analytics.rows.length > 0) {
                      const dataMap = new Map();
                      analytics.rows.forEach((row: any[]) => { dataMap.set(row[0], row); });

                const allDates: string[] = [];
                      const current = new Date(startDate);
                      while (current <= endDate) {
                                  allDates.push(formatDate(current));
                                  current.setDate(current.getDate() + 1);
                      }

                filledData.rows = allDates.map(date => {
                            if (dataMap.has(date)) return dataMap.get(date);
                            const zeroRow = [date];
                            for (let i = 1; i < (analytics.columnHeaders?.length || 7); i++) { zeroRow.push('0'); }
                            return zeroRow;
                });
            }

            res.json({ success: true, data: filledData, connectedAt: connection.connectedAt, dateRange: { start: startDateStr, end: endDateStr } });
      } catch (error: any) {
              res.status(500).json({ error: 'AnalyticsError', message: 'Failed to fetch YouTube historical analytics' });
      }
    } catch (error: any) {
          console.error('YouTube historical data error:', error);
          res.status(500).json({ error: 'AnalyticsError', message: error.message || 'Failed to get YouTube historical data' });
    }
};

/**
 * Get cross-platform insights
 */
export const getCrossPlatformInsights = async (req: Request, res: Response) => {
    try {
          const userId = req.user?.userId;

      if (!userId) {
              return res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
      }

      const connections = await prisma.platformConnection.findMany({
              where: { userId, isActive: true },
      });

      if (connections.length === 0) {
              return res.json({ success: true, insights: 'No platforms connected yet. Connect your social media accounts to get AI-powered insights.' });
      }

      const platformData = connections.map((conn) => ({
              platform: conn.platform,
              username: conn.platformUsername,
              connectedAt: conn.connectedAt,
              lastSynced: conn.lastSynced,
      }));

      const insights = await aiAnalysisService.generateQuickInsights(platformData);

      res.json({ success: true, platforms: platformData, insights });
    } catch (error: any) {
          console.error('Cross-platform insights error:', error);
          res.status(500).json({ error: 'InsightsError', message: 'Failed to generate insights' });
    }
};

/**
 * GET /api/analytics/x/stats
 * Get X (Twitter) account statistics
 */
export const getXStats = async (req: Request, res: Response) => {
    try {
          const userId = req.user?.userId;

      if (!userId) {
              return res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
      }

      const connection = await prisma.platformConnection.findFirst({
              where: { userId, platform: 'X', isActive: true },
      });

      if (!connection) {
              return res.json({ hasAccount: false });
      }

      const accessToken = await xService.getValidAccessToken(userId);
          if (!accessToken) {
                  return res.json({ hasAccount: false });
          }

      try {
              const response = await axios.get('https://api.x.com/2/users/me', {
                        params: {
                                    'user.fields': 'id,name,username,public_metrics,profile_image_url,description,verified',
                        },
                        headers: { Authorization: `Bearer ${accessToken}` },
              });

            const user = response.data.data;
              const metrics = user.public_metrics;

            res.json({
                      hasAccount: true,
                      stats: {
                                  followersCount: metrics.followers_count,
                                  followingCount: metrics.following_count,
                                  tweetCount: metrics.tweet_count,
                                  listedCount: metrics.listed_count,
                                  totalImpressions: 0, // X API v2 free tier doesn't provide impression data
                      },
                      profile: {
                                  id: user.id,
                                  name: user.name,
                                  username: user.username,
                                  profileImageUrl: user.profile_image_url,
                                  description: user.description,
                                  verified: user.verified,
                      },
                      connectedAt: connection.connectedAt,
            });
      } catch (error: any) {
              console.error('[X Stats] API error:', error.response?.data || error.message);
              res.status(500).json({ error: 'StatsError', message: 'Failed to fetch X statistics' });
      }
    } catch (error: any) {
          console.error('[X Stats] Error:', error);
          res.status(500).json({ error: 'StatsError', message: error.message || 'Failed to get X stats' });
    }
};

/**
 * GET /api/analytics/x
 * Get AI-powered X (Twitter) analysis
 */
export const getXAnalysis = async (req: Request, res: Response) => {
    try {
          const userId = req.user?.userId;

      if (!userId) {
              return res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
      }

      const connection = await prisma.platformConnection.findFirst({
              where: { userId, platform: 'X', isActive: true },
      });

      if (!connection) {
              return res.status(404).json({ error: 'NotConnected', message: 'X (Twitter) not connected' });
      }

      const accessToken = await xService.getValidAccessToken(userId);
          if (!accessToken) {
                  return res.status(401).json({ error: 'TokenExpired', message: 'X token expired, please reconnect' });
          }

      try {
              // Fetch user profile and recent tweets
            const userResponse = await axios.get('https://api.x.com/2/users/me', {
                      params: {
                                  'user.fields': 'id,name,username,public_metrics,description,created_at',
                      },
                      headers: { Authorization: `Bearer ${accessToken}` },
            });

            const user = userResponse.data.data;

            // Fetch recent tweets
            let tweets: any[] = [];
              try {
                        const tweetsResponse = await axios.get(`https://api.x.com/2/users/${user.id}/tweets`, {
                                    params: {
                                                  max_results: 10,
                                                  'tweet.fields': 'public_metrics,created_at,text',
                                    },
                                    headers: { Authorization: `Bearer ${accessToken}` },
                        });
                        tweets = tweetsResponse.data.data || [];
              } catch (tweetError: any) {
                        console.log('[X Analysis] Could not fetch tweets:', tweetError.response?.data?.title || tweetError.message);
              }

            const xData = {
                      profile: {
                                  name: user.name,
                                  username: user.username,
                                  followers: user.public_metrics.followers_count,
                                  following: user.public_metrics.following_count,
                                  tweetCount: user.public_metrics.tweet_count,
                                  description: user.description,
                                  accountCreated: user.created_at,
                      },
                      recentTweets: tweets.map((t: any) => ({
                                  text: t.text,
                                  likes: t.public_metrics?.like_count || 0,
                                  retweets: t.public_metrics?.retweet_count || 0,
                                  replies: t.public_metrics?.reply_count || 0,
                                  impressions: t.public_metrics?.impression_count || 0,
                                  createdAt: t.created_at,
                      })),
            };

            // Generate AI analysis using a prompt similar to YouTube analysis
            const prompt = `Analyze this X (Twitter) account data and provide insights:

            Profile: @${xData.profile.username} (${xData.profile.name})
            Followers: ${xData.profile.followers.toLocaleString()}
            Following: ${xData.profile.following.toLocaleString()}
            Total Tweets: ${xData.profile.tweetCount.toLocaleString()}
            Bio: ${xData.profile.description || 'No bio'}

            Recent Tweets (${xData.recentTweets.length}):
            ${xData.recentTweets.map((t: any, i: number) => `${i+1}. "${t.text.substring(0, 100)}..." - Likes: ${t.likes}, Retweets: ${t.retweets}, Replies: ${t.replies}`).join('\n')}

            Provide a JSON response with: { "summary": "...", "insights": ["...", "..."], "recommendations": ["...", "..."] }`;

            let analysis = { summary: '', insights: [] as string[], recommendations: [] as string[] };

            try {
                      const aiResult = await (aiAnalysisService as any).openai?.chat.completions.create({
                                  model: 'gpt-4o-mini',
                                  messages: [
                                    { role: 'system', content: 'You are a social media analytics expert. Respond with valid JSON only.' },
                                    { role: 'user', content: prompt },
                                              ],
                                  temperature: 0.7,
                                  max_tokens: 1000,
                                  response_format: { type: 'json_object' },
                      });

                if (aiResult) {
                            const parsed = JSON.parse(aiResult.choices[0].message.content || '{}');
                            analysis = {
                                          summary: parsed.summary || '',
                                          insights: parsed.insights || [],
                                          recommendations: parsed.recommendations || [],
                            };
                }
            } catch (aiError: any) {
                      console.log('[X Analysis] AI analysis skipped:', aiError.message);
                      analysis = {
                                  summary: `@${xData.profile.username} has ${xData.profile.followers.toLocaleString()} followers and ${xData.profile.tweetCount.toLocaleString()} tweets.`,
                                  insights: ['Connect an OpenAI API key for detailed AI-powered insights.'],
                                  recommendations: ['Post consistently to grow your following.', 'Engage with your audience by replying to comments.'],
                      };
            }

            res.json({ success: true, ...analysis });
      } catch (error: any) {
              console.error('[X Analysis] API error:', error.response?.data || error.message);
              res.status(500).json({ error: 'AnalysisError', message: 'Failed to fetch X data for analysis' });
      }
    } catch (error: any) {
          console.error('[X Analysis] Error:', error);
          res.status(500).json({ error: 'AnalysisError', message: error.message || 'Failed to generate X analysis' });
    }
};
