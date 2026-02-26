// src/services/x/xPostService.ts
import { TwitterApi } from 'twitter-api-v2';
import { PrismaClient } from '@prisma/client';
import { refreshXToken } from './xAuthService';

const prisma = new PrismaClient();

export async function postTweet(
  userId: string,
  text: string
): Promise<{ tweetId: string; url: string }> {
  const account = await prisma.platformConnection.findUnique({
    where: {
      userId_platform: {
        userId,
        platform: 'X'
      }
    },
  });

  if (!account) throw new Error('X account not connected');

  // Refresh token if within 5 minutes of expiry
  let accessToken = account.accessToken;
  let refreshToken = account.refreshToken;

  if (account.tokenExpiresAt && account.tokenExpiresAt < new Date(Date.now() + 5 * 60 * 1000)) {
    const refreshed = await refreshXToken(account.refreshToken!);
    accessToken = refreshed.accessToken;
    refreshToken = refreshed.refreshToken;

    await prisma.platformConnection.update({
      where: {
        userId_platform: {
          userId,
          platform: 'X'
        }
      },
      data: {
        accessToken,
        refreshToken
      },
    });
  }

  const userClient = new TwitterApi(accessToken);
  const tweet = await userClient.v2.tweet(text);

  return {
    tweetId: tweet.data.id,
    url: `https://x.com/i/web/status/${tweet.data.id}`,
  };
}
