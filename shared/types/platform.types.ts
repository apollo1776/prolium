/**
 * Shared Platform Types
 * Used by both frontend and backend
 */

export type Platform = 'YOUTUBE' | 'TIKTOK' | 'INSTAGRAM' | 'GOOGLE';

export interface PlatformConnection {
  id: string;
  userId: string;
  platform: Platform;
  platformUserId: string;
  platformUsername?: string;
  scopesGranted: string[];
  connectedAt: Date;
  lastSynced?: Date;
  isActive: boolean;
  tokenExpiresAt?: Date;
}

export interface ConnectPlatformResponse {
  success: boolean;
  connection?: PlatformConnection;
  error?: string;
}

export interface DisconnectPlatformRequest {
  platform: string;
}
