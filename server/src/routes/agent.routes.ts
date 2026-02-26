/**
 * Agent Routes
 */

import { Router } from 'express';
import { agentController } from '../controllers/agent.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All agent routes require authentication
router.use(authMiddleware);

// Status
router.get('/status', agentController.getStatus);

// Chat sessions
router.get('/chat/sessions', agentController.getSessions);
router.post('/chat/sessions', agentController.createSession);
router.get('/chat/sessions/:id', agentController.getSession);
router.delete('/chat/sessions/:id', agentController.deleteSession);

// Messages
router.post('/chat/message', agentController.sendMessage);

// Tasks
router.get('/tasks', agentController.getTasks);

// Brand memory
router.get('/memory/brand', agentController.getBrandMemory);
router.put('/memory/brand', agentController.updateBrandMemory);

// Content generation
router.post('/content/generate', agentController.generateContent);

export default router;
