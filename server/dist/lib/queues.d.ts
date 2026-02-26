/**
 * BullMQ Queue Configuration
 * Defines queues for comment polling, processing, and responding
 */
import { Queue, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
declare let connection: Redis | null;
export declare let commentPollQueue: Queue | null;
export declare let commentProcessQueue: Queue | null;
export declare let responseQueue: Queue | null;
export declare let commentPollEvents: QueueEvents | null;
export declare let commentProcessEvents: QueueEvents | null;
export declare let responseEvents: QueueEvents | null;
export declare const closeQueues: () => Promise<void>;
export { connection };
//# sourceMappingURL=queues.d.ts.map