// src/services/x/xMediaService.ts
import { TwitterApi } from 'twitter-api-v2';
import fs from 'fs';

export async function postTweetWithMedia(
  accessToken: string,
  text: string,
  mediaPath: string,
  mimeType: string // e.g. 'image/jpeg', 'video/mp4'
): Promise<{ tweetId: string }> {
  const userClient = new TwitterApi(accessToken);

  // Upload media using new v2 endpoint
  const mediaBuffer = fs.readFileSync(mediaPath);
  const mediaId = await userClient.v1.uploadMedia(mediaBuffer, { mimeType });

  // Note: twitter-api-v2 library handles the v2 media upload internally
  // For large videos, use chunked upload:
  // const mediaId = await userClient.v1.uploadMedia(mediaPath, { mimeType, longVideo: true });

  const tweet = await userClient.v2.tweet({
    text,
    media: { media_ids: [mediaId] },
  });

  return { tweetId: tweet.data.id };
}
