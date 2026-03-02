// src/services/x/xPostService.ts
import { TwitterApi } from 'twitter-api-v2';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function postTweet(
  userId: string,
  text: string
): Promise<{ tweetId: string; url: string }> {
  const account = await prisma.platformConnection.findUnique({
    where: { userId_platform: { userId, platform: 'X' } },
  });
  if (!account) throw new Error('X account not connected');
  if (!account.refreshToken) throw new Error('No refresh token available. Please reconnect your X account.');

  // Use OAuth 2.0 PKCE client credentials to refresh and get a user-context client
  const appClient = new TwitterApi({
    clientId: process.env.X_CLIENT_ID!,
    clientSecret: process.env.X_CLIENT_SECRET!,
  });

  let userClient: TwitterApi;
  let accessToken: string;
  let newRefreshToken: string;

  try {
    const { client, accessToken: at, refreshToken: rt } = await appClient.refreshOAuth2Token(account.refreshToken);
    userClient = client;
    accessToken = at;
    newRefreshToken = rt!;
  } catch (refreshErr: any) {
    console.error('[xPostService] Token refresh failed:', refreshErr?.message || refreshErr);
    throw new Error('Failed to refresh X token. Please reconnect your X account.');
  }

  // Save the new tokens
  await prisma.platformConnection.update({
    where: { userId_platform: { userId, platform: 'X' } },
    data: {
      accessToken,
      refreshToken: newRefreshToken,
      tokenExpiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
    },
  });

  // Post tweet using the user-context client from the refresh flow
  try {
    const tweet = await userClient.v2.tweet(text);
    return {
      tweetId: tweet.data.id,
      url: `https://x.com/i/web/status/${tweet.data.id}`,
    };
  } catch (tweetErr: any) {
    console.error('[xPostService] Tweet failed:', JSON.stringify(tweetErr?.data || tweetErr?.message || tweetErr));
    throw tweetErr;
  }
}
