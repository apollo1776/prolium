// src/services/tiktok/tiktokPostService.ts
import axios from 'axios';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { refreshTikTokToken } from './tiktokAuthService';

const prisma = new PrismaClient();

const TIKTOK_API_BASE = 'https://open.tiktokapis.com';

/**
 * Post a video to TikTok using the Direct Post API (3-step process)
 *
 * Step 1: Initialize upload to get upload_url
 * Step 2: Upload video bytes to upload_url
 * Step 3: Publish the video
 */
export async function postVideoToTikTok(
  userId: string,
  videoPath: string,
  title: string,
  privacyLevel: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY' = 'PUBLIC_TO_EVERYONE',
  disableComment?: boolean,
  disableDuet?: boolean,
  disableStitch?: boolean
): Promise<{ publishId: string; shareUrl?: string }> {
  // Get TikTok account from database
  const account = await prisma.platformConnection.findUnique({
    where: {
      userId_platform: {
        userId,
        platform: 'TIKTOK',
      },
    },
  });

  if (!account) throw new Error('TikTok account not connected');

  // Refresh token if within 2 hours of expiry (TikTok tokens expire in 24h)
  let accessToken = account.accessToken;
  let refreshToken = account.refreshToken;

  if (account.tokenExpiresAt && account.tokenExpiresAt < new Date(Date.now() + 2 * 60 * 60 * 1000)) {
    const refreshed = await refreshTikTokToken(account.refreshToken!);
    accessToken = refreshed.accessToken;
    refreshToken = refreshed.refreshToken;

    await prisma.platformConnection.update({
      where: {
        userId_platform: {
          userId,
          platform: 'TIKTOK',
        },
      },
      data: {
        accessToken,
        refreshToken,
        tokenExpiresAt: new Date(Date.now() + refreshed.expiresIn * 1000),
      },
    });
  }

  // Get video file stats
  const videoStats = fs.statSync(videoPath);
  const videoSizeBytes = videoStats.size;
  const videoBuffer = fs.readFileSync(videoPath);

  // STEP 1: Initialize video upload
  const initResponse = await axios.post(
    `${TIKTOK_API_BASE}/v2/post/publish/video/init/`,
    {
      post_info: {
        title,
        privacy_level: privacyLevel,
        disable_comment: disableComment || false,
        disable_duet: disableDuet || false,
        disable_stitch: disableStitch || false,
      },
      source_info: {
        source: 'FILE_UPLOAD',
        video_size: videoSizeBytes,
        chunk_size: videoSizeBytes, // Single chunk upload
        total_chunk_count: 1,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
    }
  );

  const { publish_id, upload_url } = initResponse.data.data;

  // STEP 2: Upload video bytes to the upload_url
  await axios.put(upload_url, videoBuffer, {
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Length': videoSizeBytes,
    },
  });

  // STEP 3: Publish the video
  const publishResponse = await axios.post(
    `${TIKTOK_API_BASE}/v2/post/publish/status/fetch/`,
    {
      publish_id,
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
    }
  );

  return {
    publishId: publish_id,
    shareUrl: publishResponse.data.data?.publicaly_available_post_id
      ? `https://www.tiktok.com/@user/video/${publishResponse.data.data.publicaly_available_post_id}`
      : undefined,
  };
}

/**
 * Check the status of a TikTok video publish
 */
export async function checkTikTokPublishStatus(
  userId: string,
  publishId: string
): Promise<{
  status: string;
  failReason?: string;
  publiclyAvailablePostId?: string;
}> {
  const account = await prisma.platformConnection.findUnique({
    where: {
      userId_platform: {
        userId,
        platform: 'TIKTOK',
      },
    },
  });

  if (!account) throw new Error('TikTok account not connected');

  const response = await axios.post(
    `${TIKTOK_API_BASE}/v2/post/publish/status/fetch/`,
    {
      publish_id: publishId,
    },
    {
      headers: {
        Authorization: `Bearer ${account.accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
    }
  );

  const data = response.data.data;

  return {
    status: data.status, // PUBLISH_COMPLETE, PROCESSING_UPLOAD, FAILED, etc.
    failReason: data.fail_reason,
    publiclyAvailablePostId: data.publicaly_available_post_id,
  };
}
