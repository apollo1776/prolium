/**
 * Platforms Controller
 * Manages platform connections and data retrieval
 */
import { Request, Response } from 'express';
export declare class PlatformsController {
    /**
     * GET /api/platforms/connected
     * Get all connected platforms for user
     */
    static getConnectedPlatforms(req: Request, res: Response): Promise<void>;
    /**
     * DELETE /api/platforms/:platform/disconnect
     * Disconnect a platform
     */
    static disconnectPlatform(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/platforms/:platform/refresh
     * Manually refresh platform token
     */
    static refreshPlatformToken(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/platforms/:platform/sync-status
     * Get sync status for a platform
     */
    static getSyncStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=platforms.controller.d.ts.map