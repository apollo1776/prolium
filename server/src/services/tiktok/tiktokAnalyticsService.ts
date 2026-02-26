// src/services/tiktok/tiktokAnalyticsService.ts
import axios from 'axios';

const TIKTOK_API_BASE = 'https://open.tiktokapis.com';

/**
 * Get TikTok user info
 */
export async function getTikTokUserInfo(accessToken: string): Promise<{
  openId: string;
  unionId: string;
  avatarUrl: string;
  displayName: string;
  followerCount: number;
  followingCount: number;
  likes: number;
  videoCount: number;
}> {
  const response = await axios.get(`${TIKTOK_API_BASE}/v2/user/info/`, {
    params: {
      fields: 'open_id,union_id,avatar_url,display_name,follower_count,following_count,likes_count,video_count',
    },
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = response.data.data.user;

  return {
    openId: data.open_id,
    unionId: data.union_id,
    avatarUrl: data.avatar_url,
    displayName: data.display_name,
    followerCount: data.follower_count,
    followingCount: data.following_count,
    likes: data.likes_count,
    videoCount: data.video_count,
  };
}

/**
 * Get user's video list
 */
export async function getTikTokVideoList(
  accessToken: string,
  maxCount: number = 20
): Promise<
  Array<{
    id: string;
    createTime: number;
    coverImageUrl: string;
    shareUrl: string;
    videoDescription: string;
    duration: number;
    height: number;
    width: number;
    title: string;
    embedHtml: string;
    embedLink: string;
  }>
> {
  const response = await axios.post(
    `${TIKTOK_API_BASE}/v2/video/list/`,
    {
      max_count: maxCount,
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
    }
  );

  const videos = response.data.data.videos || [];

  return videos.map((video: any) => ({
    id: video.id,
    createTime: video.create_time,
    coverImageUrl: video.cover_image_url,
    shareUrl: video.share_url,
    videoDescription: video.video_description,
    duration: video.duration,
    height: video.height,
    width: video.width,
    title: video.title,
    embedHtml: video.embed_html,
    embedLink: video.embed_link,
  }));
}

/**
 * Fetch video analytics/insights (requires creator account)
 */
export async function getTikTokVideoInsights(
  accessToken: string,
  videoId: string
): Promise<{
  videoViews: number;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  totalTime: number;
  averageTime: number;
  fullVideoWatchedRate: number;
}> {
  const response = await axios.post(
    `${TIKTOK_API_BASE}/v2/research/video/query/`,
    {
      filters: {
        video_id: {
          operation: 'IN',
          field_values: [videoId],
        },
      },
      fields: [
        'id',
        'video_description',
        'create_time',
        'region_code',
        'share_count',
        'view_count',
        'like_count',
        'comment_count',
        'music_id',
        'hashtag_names',
        'username',
        'effect_ids',
        'voice_to_text',
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
    }
  );

  const video = response.data.data.videos[0];

  return {
    videoViews: video.view_count || 0,
    likes: video.like_count || 0,
    comments: video.comment_count || 0,
    shares: video.share_count || 0,
    reach: video.view_count || 0,
    totalTime: 0, // Not available in basic API
    averageTime: 0,
    fullVideoWatchedRate: 0,
  };
}
