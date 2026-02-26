"use strict";
/**
 * Express Application Setup
 * Configures middleware, routes, and error handling
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
// Initialize services
const encryption_service_1 = require("./services/encryption.service");
const token_service_1 = require("./services/token.service");
const email_service_1 = require("./services/email.service");
// Import routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const oauth_routes_1 = __importDefault(require("./routes/oauth.routes"));
const platforms_routes_1 = __importDefault(require("./routes/platforms.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
const trends_routes_1 = __importDefault(require("./routes/trends.routes"));
const autoReply_routes_1 = __importDefault(require("./routes/autoReply.routes"));
encryption_service_1.EncryptionService.initialize();
token_service_1.TokenService.initialize();
email_service_1.EmailService.initialize();
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: process.env.NODE_ENV === 'production',
}));
// CORS configuration
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true, // Allow cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use((0, cors_1.default)(corsOptions));
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Cookie parser
app.use((0, cookie_parser_1.default)(process.env.COOKIE_SECRET));
// Request logging (development only)
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
    });
}
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
    });
});
// API Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/oauth', oauth_routes_1.default);
app.use('/api/platforms', platforms_routes_1.default);
app.use('/api/analytics', analytics_routes_1.default);
app.use('/api/trends', trends_routes_1.default);
app.use('/api/auto-reply', autoReply_routes_1.default);
// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'ProliumAI Backend API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            auth: '/api/auth',
            oauth: '/api/oauth',
            platforms: '/api/platforms',
        },
    });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.path}`,
    });
});
// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    // Don't expose error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    res.status(500).json({
        error: 'Internal Server Error',
        message: isDevelopment ? err.message : 'An unexpected error occurred',
        ...(isDevelopment && { stack: err.stack }),
    });
});
exports.default = app;
//# sourceMappingURL=app.js.map