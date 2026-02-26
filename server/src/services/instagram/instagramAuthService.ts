// src/services/instagram/instagramAuthService.ts
import axios from 'axios';
import crypto from 'crypto';

const INSTAGRAM_AUTH_URL = 'https://api.instagram.com/oauth/authorize';
const INSTAGRAM_TOKEN_URL = 'https://api.instagram.com/oauth/access_token';
const INSTAGRAM_GRAPH_URL = 'https://graph.instagram.com';

// STEP A: Generate Instagram authorization URL
export async function getInstagramAuthUrl(): Promise<{
  url: string;
  state: string;
}> {
  const state = crypto.randomBytes(16).toString('hex');

  const params = new URLSearchParams({
    client_id: process.env.INSTAGRAM_CLIENT_ID!,
    redirect_uri: process.env.INSTAGRAM_REDIRECT_URI!,
    scope: 'instagram_basic,instagram_content_publish,instagram_manage_comments,instagram_manage_insights',
    response_type: 'code',
    state,
  });

  const url = `${INSTAGRAM_AUTH_URL}?${params.toString()}`;

  return { url, state };
}

// STEP B: Exchange authorization code for short-lived access token
export async function exchangeInstagramCode(code: string): Promise<{
  accessToken: string;
  userId: string;
}> {
  const params = new URLSearchParams({
    client_id: process.env.INSTAGRAM_CLIENT_ID!,
    client_secret: process.env.INSTAGRAM_CLIENT_SECRET!,
    grant_type: 'authorization_code',
    redirect_uri: process.env.INSTAGRAM_REDIRECT_URI!,
    code,
  });

  const response = await axios.post(INSTAGRAM_TOKEN_URL, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  return {
    accessToken: response.data.access_token,
    userId: response.data.user_id,
  };
}

// STEP C: Exchange short-lived token for long-lived token (60 days)
export async function getLongLivedToken(shortLivedToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const params = new URLSearchParams({
    grant_type: 'ig_exchange_token',
    client_secret: process.env.INSTAGRAM_CLIENT_SECRET!,
    access_token: shortLivedToken,
  });

  const response = await axios.get(`${INSTAGRAM_GRAPH_URL}/access_token?${params.toString()}`);

  return {
    accessToken: response.data.access_token,
    expiresIn: response.data.expires_in, // 5184000 seconds = 60 days
  };
}

// STEP D: Refresh long-lived token (extends for another 60 days)
export async function refreshInstagramToken(currentToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const params = new URLSearchParams({
    grant_type: 'ig_refresh_token',
    access_token: currentToken,
  });

  const response = await axios.get(`${INSTAGRAM_GRAPH_URL}/refresh_access_token?${params.toString()}`);

  return {
    accessToken: response.data.access_token,
    expiresIn: response.data.expires_in, // 5184000 seconds = 60 days
  };
}

// Get Instagram user profile info
export async function getInstagramUserInfo(accessToken: string): Promise<{
  id: string;
  username: string;
  accountType: string;
  mediaCount: number;
}> {
  const response = await axios.get(`${INSTAGRAM_GRAPH_URL}/me`, {
    params: {
      fields: 'id,username,account_type,media_count',
      access_token: accessToken,
    },
  });

  return {
    id: response.data.id,
    username: response.data.username,
    accountType: response.data.account_type,
    mediaCount: response.data.media_count,
  };
}
