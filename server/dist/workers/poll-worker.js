"use strict";
/**
 * Poll Worker
 * Schedules and executes comment polling for all active users
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.pollWorker = void 0;
const bullmq_1 = require("bullmq");
const client_1 = require("@prisma/client");
const queues_1 = require("../lib/queues");
const comment_poller_service_1 = require("../services/comment-poller.service");
const prisma = new client_1.PrismaClient();
/**
 * Worker to poll comments for a user
 */
exports.pollWorker = new bullmq_1.Worker('comment-poll', async (job) => {
    const { userId } = job.data;
    console.log(`[Poll Worker] Polling comments for user ${userId}`);
    try {
        await (0, comment_poller_service_1.pollAllPlatforms)(userId);
        console.log(`[Poll Worker] Successfully polled comments for user ${userId}`);
    }
    catch (error) {
        console.error(`[Poll Worker] Error polling for user ${userId}:`, error);
        throw error; // Will trigger retry
    }
}, {
    connection: queues_1.connection,
    concurrency: 5, // Process 5 users at a time
    limiter: {
        max: 10, // Max 10 jobs
        duration: 60000, // Per minute
    },
});
exports.pollWorker.on('completed', (job) => {
    console.log(`[Poll Worker] Job ${job.id} completed`);
});
exports.pollWorker.on('failed', (job, err) => {
    console.error(`[Poll Worker] Job ${job?.id} failed:`, err);
});
console.log('[Poll Worker] Started and waiting for jobs');
//# sourceMappingURL=poll-worker.js.map