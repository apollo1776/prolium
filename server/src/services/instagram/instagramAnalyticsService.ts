// src/services/instagram/instagramAnalyticsService.ts
import axios from 'axios';

const INSTAGRAM_GRAPH_URL = 'https://graph.instagram.com';

/**
 * Get Instagram account insights (requires Instagram Business or Creator account)
 */
export async function getInstagramAccountInsights(
  accessToken: string,
  igUserId: string,
  period: '28_days' | '7_days' | '1_day' = '28_days'
): Promise<{
  impressions: number;
  reach: number;
  followerCount: number;
  profileViews: number;
  websiteClicks: number;
}> {
  const metrics = [
    'impressions',
    'reach',
    'follower_count',
    'profile_views',
    'website_clicks',
  ];

  const response = await axios.get(`${INSTAGRAM_GRAPH_URL}/${igUserId}/insights`, {
    params: {
      metric: metrics.join(','),
      period,
      access_token: accessToken,
    },
  });

  const data = response.data.data;

  const extractValue = (metricName: string) => {
    const metric = data.find((m: any) => m.name === metricName);
    return metric?.values[0]?.value || 0;
  };

  return {
    impressions: extractValue('impressions'),
    reach: extractValue('reach'),
    followerCount: extractValue('follower_count'),
    profileViews: extractValue('profile_views'),
    websiteClicks: extractValue('website_clicks'),
  };
}

/**
 * Get Instagram media list (recent posts)
 */
export async function getInstagramMedia(
  accessToken: string,
  igUserId: string,
  limit: number = 25
): Promise<
  Array<{
    id: string;
    caption: string;
    mediaType: string;
    mediaUrl: string;
    permalink: string;
    timestamp: string;
    likeCount: number;
    commentsCount: number;
  }>
> {
  const response = await axios.get(`${INSTAGRAM_GRAPH_URL}/${igUserId}/media`, {
    params: {
      fields: 'id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count',
      limit,
      access_token: accessToken,
    },
  });

  return response.data.data.map((media: any) => ({
    id: media.id,
    caption: media.caption || '',
    mediaType: media.media_type,
    mediaUrl: media.media_url,
    permalink: media.permalink,
    timestamp: media.timestamp,
    likeCount: media.like_count || 0,
    commentsCount: media.comments_count || 0,
  }));
}

/**
 * Get insights for a specific Instagram media post
 */
export async function getInstagramMediaInsights(
  accessToken: string,
  mediaId: string,
  isReel: boolean = false
): Promise<{
  impressions: number;
  reach: number;
  engagement: number;
  saved: number;
  videoViews?: number;
  plays?: number;
  totalInteractions?: number;
}> {
  const metrics = isReel
    ? ['plays', 'reach', 'total_interactions', 'saved']
    : ['impressions', 'reach', 'engagement', 'saved', 'video_views'];

  const response = await axios.get(`${INSTAGRAM_GRAPH_URL}/${mediaId}/insights`, {
    params: {
      metric: metrics.join(','),
      access_token: accessToken,
    },
  });

  const data = response.data.data;

  const extractValue = (metricName: string) => {
    const metric = data.find((m: any) => m.name === metricName);
    return metric?.values[0]?.value || 0;
  };

  if (isReel) {
    return {
      impressions: 0,
      reach: extractValue('reach'),
      engagement: 0,
      saved: extractValue('saved'),
      plays: extractValue('plays'),
      totalInteractions: extractValue('total_interactions'),
    };
  } else {
    return {
      impressions: extractValue('impressions'),
      reach: extractValue('reach'),
      engagement: extractValue('engagement'),
      saved: extractValue('saved'),
      videoViews: extractValue('video_views'),
    };
  }
}

/**
 * Get Instagram Stories insights
 */
export async function getInstagramStoryInsights(
  accessToken: string,
  igUserId: string
): Promise<
  Array<{
    id: string;
    mediaType: string;
    timestamp: string;
    impressions: number;
    reach: number;
    replies: number;
    exits: number;
  }>
> {
  // Get stories
  const storiesResponse = await axios.get(`${INSTAGRAM_GRAPH_URL}/${igUserId}/stories`, {
    params: {
      fields: 'id,media_type,timestamp',
      access_token: accessToken,
    },
  });

  const stories = storiesResponse.data.data || [];

  // Get insights for each story
  const storiesWithInsights = await Promise.all(
    stories.map(async (story: any) => {
      const insightsResponse = await axios.get(`${INSTAGRAM_GRAPH_URL}/${story.id}/insights`, {
        params: {
          metric: 'impressions,reach,replies,exits',
          access_token: accessToken,
        },
      });

      const insights = insightsResponse.data.data;

      const extractValue = (metricName: string) => {
        const metric = insights.find((m: any) => m.name === metricName);
        return metric?.values[0]?.value || 0;
      };

      return {
        id: story.id,
        mediaType: story.media_type,
        timestamp: story.timestamp,
        impressions: extractValue('impressions'),
        reach: extractValue('reach'),
        replies: extractValue('replies'),
        exits: extractValue('exits'),
      };
    })
  );

  return storiesWithInsights;
}

/**
 * Get Instagram comments on a media post
 */
export async function getInstagramComments(
  accessToken: string,
  mediaId: string,
  limit: number = 50
): Promise<
  Array<{
    id: string;
    text: string;
    username: string;
    timestamp: string;
    likeCount: number;
  }>
> {
  const response = await axios.get(`${INSTAGRAM_GRAPH_URL}/${mediaId}/comments`, {
    params: {
      fields: 'id,text,username,timestamp,like_count',
      limit,
      access_token: accessToken,
    },
  });

  return response.data.data.map((comment: any) => ({
    id: comment.id,
    text: comment.text,
    username: comment.username,
    timestamp: comment.timestamp,
    likeCount: comment.like_count || 0,
  }));
}

/**
 * Reply to an Instagram comment
 */
export async function replyToInstagramComment(
  accessToken: string,
  commentId: string,
  message: string
): Promise<{ commentId: string }> {
  const response = await axios.post(
    `${INSTAGRAM_GRAPH_URL}/${commentId}/replies`,
    null,
    {
      params: {
        message,
        access_token: accessToken,
      },
    }
  );

  return {
    commentId: response.data.id,
  };
}
