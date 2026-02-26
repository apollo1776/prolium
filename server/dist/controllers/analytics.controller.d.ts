/**
 * Analytics Controller
 * Handles AI-powered analytics and insights
 */
import { Request, Response } from 'express';
/**
 * Get AI-powered YouTube analysis
 */
export declare const getYouTubeAnalysis: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get YouTube statistics
 */
export declare const getYouTubeStats: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Analyze YouTube comments for sentiment and themes
 */
export declare const analyzeYouTubeComments: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get YouTube historical analytics
 * Returns REAL view data from YouTube Analytics API
 */
export declare const getYouTubeHistoricalData: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get cross-platform insights
 */
export declare const getCrossPlatformInsights: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=analytics.controller.d.ts.map