/**
 * Preferences Routes
 * Notification, appearance, and push notification preference endpoints
 */

import { Router } from 'express';
import { PreferencesController } from '../controllers/preferences.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication

// Get all preferences
router.get('/', authMiddleware, PreferencesController.getAllPreferences);

// Notification preferences
router.get('/notifications', authMiddleware, PreferencesController.getNotificationPreferences);

router.put('/notifications', authMiddleware, PreferencesController.updateNotificationPreferences);

// Appearance preferences
router.get('/appearance', authMiddleware, PreferencesController.getAppearancePreferences);

router.put('/appearance', authMiddleware, PreferencesController.updateAppearancePreferences);

// Push notifications
router.post('/push/enable', authMiddleware, PreferencesController.enablePushNotifications);

router.post('/push/disable', authMiddleware, PreferencesController.disablePushNotifications);

router.get('/push/status', authMiddleware, PreferencesController.getPushStatus);

export default router;
