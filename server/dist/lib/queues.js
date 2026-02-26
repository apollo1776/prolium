"use strict";
/**
 * BullMQ Queue Configuration
 * Defines queues for comment polling, processing, and responding
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connection = exports.closeQueues = exports.responseEvents = exports.commentProcessEvents = exports.commentPollEvents = exports.responseQueue = exports.commentProcessQueue = exports.commentPollQueue = void 0;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
let connection = null;
exports.connection = connection;
// Only initialize Redis if explicitly enabled
const REDIS_ENABLED = process.env.REDIS_ENABLED === 'true';
if (REDIS_ENABLED) {
    try {
        exports.connection = connection = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379', {
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            maxRetriesPerRequest: null,
        });
        connection.on('error', (err) => {
            console.warn('[Redis] Connection error:', err.message);
        });
        connection.on('ready', () => {
            console.log('[Redis] Connected successfully');
        });
    }
    catch (err) {
        console.warn('[Redis] Failed to initialize:', err.message);
        exports.connection = connection = null;
    }
}
else {
    console.log('[Redis] Disabled - auto-reply worker features not available');
    console.log('[Redis] To enable: Install Redis and set REDIS_ENABLED=true in .env');
}
// Queues (will be null if Redis is not available)
exports.commentPollQueue = null;
exports.commentProcessQueue = null;
exports.responseQueue = null;
exports.commentPollEvents = null;
exports.commentProcessEvents = null;
exports.responseEvents = null;
if (connection) {
    // Queue for polling comments from platforms
    exports.commentPollQueue = new bullmq_1.Queue('comment-poll', {
        connection,
        defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
            removeOnComplete: {
                age: 24 * 3600, // Keep for 24 hours
                count: 1000,
            },
            removeOnFail: {
                age: 7 * 24 * 3600, // Keep failures for 7 days
            },
        },
    });
    // Queue for processing comments against rules
    exports.commentProcessQueue = new bullmq_1.Queue('comment-process', {
        connection,
        defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 1000,
            },
            removeOnComplete: {
                age: 24 * 3600,
                count: 1000,
            },
            removeOnFail: {
                age: 7 * 24 * 3600,
            },
        },
    });
    // Queue for sending responses
    exports.responseQueue = new bullmq_1.Queue('response', {
        connection,
        defaultJobOptions: {
            attempts: 5,
            backoff: {
                type: 'exponential',
                delay: 5000,
            },
            removeOnComplete: {
                age: 24 * 3600,
                count: 1000,
            },
            removeOnFail: {
                age: 7 * 24 * 3600,
            },
        },
    });
    // Queue events for monitoring
    exports.commentPollEvents = new bullmq_1.QueueEvents('comment-poll', { connection });
    exports.commentProcessEvents = new bullmq_1.QueueEvents('comment-process', { connection });
    exports.responseEvents = new bullmq_1.QueueEvents('response', { connection });
}
// Graceful shutdown
const closeQueues = async () => {
    if (exports.commentPollQueue)
        await exports.commentPollQueue.close();
    if (exports.commentProcessQueue)
        await exports.commentProcessQueue.close();
    if (exports.responseQueue)
        await exports.responseQueue.close();
    if (exports.commentPollEvents)
        await exports.commentPollEvents.close();
    if (exports.commentProcessEvents)
        await exports.commentProcessEvents.close();
    if (exports.responseEvents)
        await exports.responseEvents.close();
    if (connection)
        await connection.quit();
};
exports.closeQueues = closeQueues;
//# sourceMappingURL=queues.js.map