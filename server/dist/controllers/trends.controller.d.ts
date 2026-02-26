/**
 * Trends Controller
 * Fetches trending content and topics from platforms
 */
import { Request, Response } from 'express';
/**
 * Get trending data for TikTok
 */
export declare const getTikTokTrends: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get trending data for Instagram
 */
export declare const getInstagramTrends: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get trending videos and topics from YouTube
 */
export declare const getYouTubeTrends: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=trends.controller.d.ts.map