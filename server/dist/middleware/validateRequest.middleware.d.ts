/**
 * Request Validation Middleware
 * Validates request body against schemas using Zod
 */
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
declare const schemas: {
    register: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
        name: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        email: string;
        password: string;
        name?: string | undefined;
    }, {
        email: string;
        password: string;
        name?: string | undefined;
    }>;
    login: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
        rememberMe: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        email: string;
        password: string;
        rememberMe?: boolean | undefined;
    }, {
        email: string;
        password: string;
        rememberMe?: boolean | undefined;
    }>;
    forgotPassword: z.ZodObject<{
        email: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
    }, {
        email: string;
    }>;
    resetPassword: z.ZodObject<{
        token: z.ZodString;
        password: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        token: string;
        password: string;
    }, {
        token: string;
        password: string;
    }>;
    refreshToken: z.ZodObject<{
        refreshToken: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        refreshToken?: string | undefined;
    }, {
        refreshToken?: string | undefined;
    }>;
};
export declare const validateRequest: (schemaName: keyof typeof schemas) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export {};
//# sourceMappingURL=validateRequest.middleware.d.ts.map