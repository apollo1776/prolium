/**
 * Poll Worker
 * Schedules and executes comment polling for all active users
 */
import { Worker } from 'bullmq';
interface PollJobData {
    userId: string;
}
/**
 * Worker to poll comments for a user
 */
export declare const pollWorker: Worker<PollJobData, any, string>;
export {};
//# sourceMappingURL=poll-worker.d.ts.map