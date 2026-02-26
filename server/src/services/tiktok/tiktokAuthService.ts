// src/services/tiktok/tiktokAuthService.ts
import crypto from 'crypto';
import axios from 'axios';

const TIKTOK_AUTH_URL = 'https://www.tiktok.com/v2/auth/authorize/';
const TIKTOK_TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/';

// PKCE helper functions
function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier: string): string {
  return crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');
}

// STEP A: Generate TikTok auth URL with PKCE
export async function getTikTokAuthUrl(): Promise<{
  url: string;
  state: string;
  codeVerifier: string;
}> {
  const state = crypto.randomBytes(16).toString('hex');
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    scope: 'user.info.basic,video.list,video.upload,video.publish',
    response_type: 'code',
    redirect_uri: process.env.TIKTOK_REDIRECT_URI!,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  const url = `${TIKTOK_AUTH_URL}?${params.toString()}`;

  return { url, state, codeVerifier };
}

// STEP B: Exchange authorization code for access token
export async function exchangeTikTokCode(
  code: string,
  codeVerifier: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  openId: string;
}> {
  const response = await axios.post(
    TIKTOK_TOKEN_URL,
    {
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.TIKTOK_REDIRECT_URI!,
      code_verifier: codeVerifier,
    },
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  const data = response.data.data;

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in, // 24 hours = 86400 seconds
    openId: data.open_id,
  };
}

// STEP C: Refresh TikTok access token
export async function refreshTikTokToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const response = await axios.post(
    TIKTOK_TOKEN_URL,
    {
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    },
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  const data = response.data.data;

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}
