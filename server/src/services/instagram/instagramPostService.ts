// src/services/instagram/instagramPostService.ts
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { refreshInstagramToken } from './instagramAuthService';

const prisma = new PrismaClient();

const INSTAGRAM_GRAPH_URL = 'https://graph.instagram.com';

/**
 * Publish a photo to Instagram
 * 2-step process: Create container → Publish
 */
export async function publishInstagramPhoto(
  userId: string,
  imageUrl: string,
  caption?: string,
  location_id?: string
): Promise<{ mediaId: string; permalink: string }> {
  const account = await getInstagramAccount(userId);
  const accessToken = await ensureValidToken(userId, account);

  // Step 1: Create media container
  const containerResponse = await axios.post(
    `${INSTAGRAM_GRAPH_URL}/${account.platformUserId}/media`,
    null,
    {
      params: {
        image_url: imageUrl,
        caption: caption || '',
        location_id,
        access_token: accessToken,
      },
    }
  );

  const containerId = containerResponse.data.id;

  // Step 2: Publish the container
  const publishResponse = await axios.post(
    `${INSTAGRAM_GRAPH_URL}/${account.platformUserId}/media_publish`,
    null,
    {
      params: {
        creation_id: containerId,
        access_token: accessToken,
      },
    }
  );

  const mediaId = publishResponse.data.id;

  // Get permalink
  const mediaResponse = await axios.get(`${INSTAGRAM_GRAPH_URL}/${mediaId}`, {
    params: {
      fields: 'permalink',
      access_token: accessToken,
    },
  });

  return {
    mediaId,
    permalink: mediaResponse.data.permalink,
  };
}

/**
 * Publish a video to Instagram Feed
 */
export async function publishInstagramVideo(
  userId: string,
  videoUrl: string,
  caption?: string,
  coverUrl?: string,
  location_id?: string
): Promise<{ mediaId: string; permalink: string }> {
  const account = await getInstagramAccount(userId);
  const accessToken = await ensureValidToken(userId, account);

  // Step 1: Create video container
  const containerParams: any = {
    media_type: 'VIDEO',
    video_url: videoUrl,
    caption: caption || '',
    access_token: accessToken,
  };

  if (coverUrl) containerParams.thumb_offset = 0;
  if (location_id) containerParams.location_id = location_id;

  const containerResponse = await axios.post(
    `${INSTAGRAM_GRAPH_URL}/${account.platformUserId}/media`,
    null,
    { params: containerParams }
  );

  const containerId = containerResponse.data.id;

  // Wait for video to finish processing
  await waitForContainerReady(containerId, accessToken);

  // Step 2: Publish the container
  const publishResponse = await axios.post(
    `${INSTAGRAM_GRAPH_URL}/${account.platformUserId}/media_publish`,
    null,
    {
      params: {
        creation_id: containerId,
        access_token: accessToken,
      },
    }
  );

  const mediaId = publishResponse.data.id;

  // Get permalink
  const mediaResponse = await axios.get(`${INSTAGRAM_GRAPH_URL}/${mediaId}`, {
    params: {
      fields: 'permalink',
      access_token: accessToken,
    },
  });

  return {
    mediaId,
    permalink: mediaResponse.data.permalink,
  };
}

/**
 * Publish a Reel to Instagram
 */
export async function publishInstagramReel(
  userId: string,
  videoUrl: string,
  caption?: string,
  coverUrl?: string,
  shareToFeed: boolean = true
): Promise<{ mediaId: string; permalink: string }> {
  const account = await getInstagramAccount(userId);
  const accessToken = await ensureValidToken(userId, account);

  // Step 1: Create reel container
  const containerParams: any = {
    media_type: 'REELS',
    video_url: videoUrl,
    caption: caption || '',
    share_to_feed: shareToFeed,
    access_token: accessToken,
  };

  if (coverUrl) containerParams.cover_url = coverUrl;

  const containerResponse = await axios.post(
    `${INSTAGRAM_GRAPH_URL}/${account.platformUserId}/media`,
    null,
    { params: containerParams }
  );

  const containerId = containerResponse.data.id;

  // Wait for reel to finish processing
  await waitForContainerReady(containerId, accessToken);

  // Step 2: Publish the reel
  const publishResponse = await axios.post(
    `${INSTAGRAM_GRAPH_URL}/${account.platformUserId}/media_publish`,
    null,
    {
      params: {
        creation_id: containerId,
        access_token: accessToken,
      },
    }
  );

  const mediaId = publishResponse.data.id;

  // Get permalink
  const mediaResponse = await axios.get(`${INSTAGRAM_GRAPH_URL}/${mediaId}`, {
    params: {
      fields: 'permalink',
      access_token: accessToken,
    },
  });

  return {
    mediaId,
    permalink: mediaResponse.data.permalink,
  };
}

/**
 * Publish a carousel (multiple images/videos) to Instagram
 */
export async function publishInstagramCarousel(
  userId: string,
  mediaUrls: Array<{ type: 'IMAGE' | 'VIDEO'; url: string }>,
  caption?: string,
  location_id?: string
): Promise<{ mediaId: string; permalink: string }> {
  const account = await getInstagramAccount(userId);
  const accessToken = await ensureValidToken(userId, account);

  // Step 1: Create containers for each media item
  const childContainerIds: string[] = [];

  for (const media of mediaUrls) {
    const params: any = {
      is_carousel_item: true,
      access_token: accessToken,
    };

    if (media.type === 'IMAGE') {
      params.image_url = media.url;
    } else {
      params.media_type = 'VIDEO';
      params.video_url = media.url;
    }

    const response = await axios.post(
      `${INSTAGRAM_GRAPH_URL}/${account.platformUserId}/media`,
      null,
      { params }
    );

    childContainerIds.push(response.data.id);

    // If video, wait for processing
    if (media.type === 'VIDEO') {
      await waitForContainerReady(response.data.id, accessToken);
    }
  }

  // Step 2: Create carousel container
  const carouselResponse = await axios.post(
    `${INSTAGRAM_GRAPH_URL}/${account.platformUserId}/media`,
    null,
    {
      params: {
        media_type: 'CAROUSEL',
        children: childContainerIds.join(','),
        caption: caption || '',
        location_id,
        access_token: accessToken,
      },
    }
  );

  const carouselContainerId = carouselResponse.data.id;

  // Step 3: Publish the carousel
  const publishResponse = await axios.post(
    `${INSTAGRAM_GRAPH_URL}/${account.platformUserId}/media_publish`,
    null,
    {
      params: {
        creation_id: carouselContainerId,
        access_token: accessToken,
      },
    }
  );

  const mediaId = publishResponse.data.id;

  // Get permalink
  const mediaResponse = await axios.get(`${INSTAGRAM_GRAPH_URL}/${mediaId}`, {
    params: {
      fields: 'permalink',
      access_token: accessToken,
    },
  });

  return {
    mediaId,
    permalink: mediaResponse.data.permalink,
  };
}

// Helper: Get Instagram account from database
async function getInstagramAccount(userId: string) {
  const account = await prisma.platformConnection.findUnique({
    where: {
      userId_platform: {
        userId,
        platform: 'INSTAGRAM',
      },
    },
  });

  if (!account) throw new Error('Instagram account not connected');
  return account;
}

// Helper: Ensure token is valid and refresh if needed
async function ensureValidToken(userId: string, account: any): Promise<string> {
  let accessToken = account.accessToken;

  // Refresh token if within 50 days of expiry (Instagram tokens last 60 days)
  if (account.tokenExpiresAt && account.tokenExpiresAt < new Date(Date.now() + 50 * 24 * 60 * 60 * 1000)) {
    const refreshed = await refreshInstagramToken(account.accessToken);
    accessToken = refreshed.accessToken;

    await prisma.platformConnection.update({
      where: {
        userId_platform: {
          userId,
          platform: 'INSTAGRAM',
        },
      },
      data: {
        accessToken,
        tokenExpiresAt: new Date(Date.now() + refreshed.expiresIn * 1000),
      },
    });
  }

  return accessToken;
}

// Helper: Wait for video container to finish processing
async function waitForContainerReady(containerId: string, accessToken: string, maxAttempts = 20) {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await axios.get(`${INSTAGRAM_GRAPH_URL}/${containerId}`, {
      params: {
        fields: 'status_code',
        access_token: accessToken,
      },
    });

    const status = response.data.status_code;

    if (status === 'FINISHED') {
      return;
    } else if (status === 'ERROR') {
      throw new Error('Instagram media container processing failed');
    }

    // Wait 3 seconds before next attempt
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  throw new Error('Instagram media container processing timeout');
}
