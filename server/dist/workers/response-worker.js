"use strict";
/**
 * Response Worker
 * Sends auto-replies to matched comments with rate limiting
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.responseWorker = void 0;
const bullmq_1 = require("bullmq");
const queues_1 = require("../lib/queues");
const response_sender_service_1 = require("../services/response-sender.service");
/**
 * Worker to send responses
 */
exports.responseWorker = new bullmq_1.Worker('response', async (job) => {
    const { comment, rule, matchedKeyword, aiConfidenceScore } = job.data;
    console.log(`[Response Worker] Sending response for comment ${comment.id} using rule ${rule.id}`);
    try {
        const result = await (0, response_sender_service_1.sendResponse)(comment, rule, rule.userId, matchedKeyword, aiConfidenceScore);
        if (!result.success) {
            throw new Error(result.errorMessage || 'Failed to send response');
        }
        console.log(`[Response Worker] Successfully sent response to comment ${comment.id}`);
    }
    catch (error) {
        console.error(`[Response Worker] Error sending response to comment ${comment.id}:`, error);
        throw error; // Will trigger retry
    }
}, {
    connection: queues_1.connection,
    concurrency: 3, // Send 3 responses at a time (to avoid rate limits)
    limiter: {
        max: 20, // Max 20 responses
        duration: 60000, // Per minute
    },
});
exports.responseWorker.on('completed', (job) => {
    console.log(`[Response Worker] Job ${job.id} completed`);
});
exports.responseWorker.on('failed', (job, err) => {
    console.error(`[Response Worker] Job ${job?.id} failed:`, err);
});
console.log('[Response Worker] Started and waiting for jobs');
//# sourceMappingURL=response-worker.js.map