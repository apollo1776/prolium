"use strict";
/**
 * Process Worker
 * Processes comments against auto-reply rules
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.processWorker = void 0;
const bullmq_1 = require("bullmq");
const queues_1 = require("../lib/queues");
const comment_processor_service_1 = require("../services/comment-processor.service");
/**
 * Worker to process comments against rules
 */
exports.processWorker = new bullmq_1.Worker('comment-process', async (job) => {
    const { comment, userId } = job.data;
    console.log(`[Process Worker] Processing comment ${comment.id} for user ${userId}`);
    try {
        await (0, comment_processor_service_1.processComment)(comment, userId);
        console.log(`[Process Worker] Successfully processed comment ${comment.id}`);
    }
    catch (error) {
        console.error(`[Process Worker] Error processing comment ${comment.id}:`, error);
        throw error; // Will trigger retry
    }
}, {
    connection: queues_1.connection,
    concurrency: 10, // Process 10 comments at a time
    limiter: {
        max: 50, // Max 50 jobs
        duration: 60000, // Per minute (rate limit for OpenAI API)
    },
});
exports.processWorker.on('completed', (job) => {
    console.log(`[Process Worker] Job ${job.id} completed`);
});
exports.processWorker.on('failed', (job, err) => {
    console.error(`[Process Worker] Job ${job?.id} failed:`, err);
});
console.log('[Process Worker] Started and waiting for jobs');
//# sourceMappingURL=process-worker.js.map