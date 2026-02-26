// src/services/x/xAnalyticsService.ts
import { TwitterApi } from 'twitter-api-v2';

export async function getUserTimeline(accessToken: string): Promise<any[]> {
  const userClient = new TwitterApi(accessToken);

  // Get authenticated user's ID
  const me = await userClient.v2.me({ 'user.fields': ['id', 'name', 'username', 'public_metrics'] });
  const userId = me.data.id;

  // Fetch recent tweets with engagement metrics
  const timeline = await userClient.v2.userTimeline(userId, {
    max_results: 10,
    'tweet.fields': ['created_at', 'public_metrics', 'entities'],
    exclude: ['retweets', 'replies'],
  });

  return timeline.data.data?.map(tweet => ({
    id: tweet.id,
    text: tweet.text,
    createdAt: tweet.created_at,
    likes: tweet.public_metrics?.like_count ?? 0,
    retweets: tweet.public_metrics?.retweet_count ?? 0,
    replies: tweet.public_metrics?.reply_count ?? 0,
    impressions: tweet.public_metrics?.impression_count ?? 0,
  })) ?? [];
}

export async function getMentions(accessToken: string): Promise<any[]> {
  const userClient = new TwitterApi(accessToken);
  const me = await userClient.v2.me();

  const mentions = await userClient.v2.userMentionTimeline(me.data.id, {
    max_results: 10,
    'tweet.fields': ['created_at', 'public_metrics', 'author_id'],
  });

  return mentions.data.data ?? [];
}
