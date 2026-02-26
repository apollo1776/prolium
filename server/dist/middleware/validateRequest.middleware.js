"use strict";
/**
 * Request Validation Middleware
 * Validates request body against schemas using Zod
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const zod_1 = require("zod");
// Validation schemas
const schemas = {
    register: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email address'),
        password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
        name: zod_1.z.string().optional(),
    }),
    login: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email address'),
        password: zod_1.z.string().min(1, 'Password is required'),
        rememberMe: zod_1.z.boolean().optional(),
    }),
    forgotPassword: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email address'),
    }),
    resetPassword: zod_1.z.object({
        token: zod_1.z.string().min(1, 'Token is required'),
        password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    }),
    refreshToken: zod_1.z.object({
        refreshToken: zod_1.z.string().optional(),
    }),
};
const validateRequest = (schemaName) => {
    return (req, res, next) => {
        try {
            const schema = schemas[schemaName];
            schema.parse(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    error: 'ValidationError',
                    message: 'Invalid request data',
                    details: error.errors.map((err) => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                });
            }
            next(error);
        }
    };
};
exports.validateRequest = validateRequest;
//# sourceMappingURL=validateRequest.middleware.js.map