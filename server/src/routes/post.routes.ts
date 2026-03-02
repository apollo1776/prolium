/**
 * Post Routes
 */
import { Router } from 'express';
import { postController } from '../controllers/post.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

// Publish content to a platform
router.post('/publish', postController.publishPost);

// Get post history
router.get('/history', postController.getHistory);

export default router;
