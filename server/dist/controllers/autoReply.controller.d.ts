/**
 * Auto-Reply Controller
 * Manages auto-reply rules, logs, and statistics
 */
import { Request, Response } from 'express';
/**
 * Get all auto-reply rules for the current user
 */
export declare const getRules: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get a single auto-reply rule
 */
export declare const getRule: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Create a new auto-reply rule
 */
export declare const createRule: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Update an existing auto-reply rule
 */
export declare const updateRule: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Delete an auto-reply rule
 */
export declare const deleteRule: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Toggle rule active status
 */
export declare const toggleRule: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get activity logs
 */
export declare const getLogs: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get statistics
 */
export declare const getStats: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Test endpoint to manually trigger comment polling
 */
export declare const testPoll: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=autoReply.controller.d.ts.map