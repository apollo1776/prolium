/**
 * Auto-Reply Routes
 */

import { Router } from 'express';
import {
  getRules,
  getRule,
  createRule,
  updateRule,
  deleteRule,
  toggleRule,
  getLogs,
  getStats,
  testPoll,
} from '../controllers/autoReply.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Rules management
router.get('/rules', getRules);
router.post('/rules', createRule);
router.get('/rules/:id', getRule);
router.put('/rules/:id', updateRule);
router.delete('/rules/:id', deleteRule);
router.post('/rules/:id/toggle', toggleRule);

// Activity logs
router.get('/logs', getLogs);

// Statistics
router.get('/stats', getStats);

// Test endpoint
router.post('/test/poll', testPoll);

export default router;
