// src/services/x/xAuthService.ts
import { TwitterApi } from 'twitter-api-v2';

const client = new TwitterApi({
  clientId: process.env.X_CLIENT_ID!,
  clientSecret: process.env.X_CLIENT_SECRET!,
});

// STEP A: Generate auth link (call this when user clicks "Connect X")
export async function getXAuthUrl(): Promise<{ url: string; state: string; codeVerifier: string }> {
  const { url, state, codeVerifier } = client.generateOAuth2AuthLink(
    process.env.X_CALLBACK_URL!,
    {
      scope: [
        'tweet.read',
        'tweet.write',
        'users.read',
        'offline.access', // REQUIRED for refresh tokens
      ],
    }
  );
  return { url, state, codeVerifier };
}

// STEP B: Exchange code for tokens (call this in your callback route)
export async function exchangeXCode(
  code: string,
  codeVerifier: string
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const {
    client: loggedClient,
    accessToken,
    refreshToken,
    expiresIn,
  } = await client.loginWithOAuth2({
    code,
    codeVerifier,
    redirectUri: process.env.X_CALLBACK_URL!,
  });

  return { accessToken, refreshToken: refreshToken!, expiresIn };
}

// STEP C: Refresh access token (run this before every API call)
export async function refreshXToken(refreshToken: string) {
  const { accessToken, refreshToken: newRefreshToken } =
    await client.refreshOAuth2Token(refreshToken);
  return { accessToken, refreshToken: newRefreshToken! };
}
