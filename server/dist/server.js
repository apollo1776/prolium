"use strict";
/**
 * Server Entry Point
 * Starts the Express server and handles graceful shutdown
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const client_1 = require("@prisma/client");
const PORT = process.env.PORT || 4000;
const prisma = new client_1.PrismaClient();
// Test database connection
async function connectDatabase() {
    try {
        await prisma.$connect();
        console.log('✓ Database connected successfully');
    }
    catch (error) {
        console.error('✗ Database connection failed:', error);
        console.error('\nPlease ensure:');
        console.error('1. PostgreSQL is running');
        console.error('2. DATABASE_URL is correctly configured in .env');
        console.error('3. Database "proliumai_db" exists');
        console.error('\nTo create the database, run:');
        console.error('   createdb proliumai_db');
        console.error('\nThen run migrations:');
        console.error('   npm run prisma:migrate');
        process.exit(1);
    }
}
// Start server
async function startServer() {
    await connectDatabase();
    const server = app_1.default.listen(PORT, () => {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🚀 ProliumAI Backend Server');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`✓ Server running on: http://localhost:${PORT}`);
        console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`✓ Frontend URL: ${process.env.FRONTEND_URL}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Available endpoints:');
        console.log(`  Health check: http://localhost:${PORT}/health`);
        console.log(`  Auth API:     http://localhost:${PORT}/api/auth`);
        console.log(`  OAuth API:    http://localhost:${PORT}/api/oauth`);
        console.log(`  Platforms:    http://localhost:${PORT}/api/platforms`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    });
    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
        console.log(`\n${signal} received. Starting graceful shutdown...`);
        server.close(async () => {
            console.log('✓ HTTP server closed');
            await prisma.$disconnect();
            console.log('✓ Database disconnected');
            console.log('✓ Shutdown complete');
            process.exit(0);
        });
        // Force shutdown after 10 seconds
        setTimeout(() => {
            console.error('⚠️  Forced shutdown after timeout');
            process.exit(1);
        }, 10000);
    };
    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    // Handle unhandled rejections
    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:', error);
        gracefulShutdown('UNCAUGHT_EXCEPTION');
    });
}
// Start the server
startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
//# sourceMappingURL=server.js.map