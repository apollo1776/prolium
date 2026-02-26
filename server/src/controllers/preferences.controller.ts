/**
 * Preferences Controller
 * Handles notification, appearance, and push notification preferences
 */

import { Request, Response } from 'express';
import { PreferencesService } from '../services/preferences.service';

export class PreferencesController {
  /**
   * GET /api/preferences/notifications
   * Get notification preferences
   */
  static async getNotificationPreferences(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;

      const preferences = await PreferencesService.getNotificationPreferences(userId);

      res.json({
        success: true,
        preferences,
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'GetPreferencesFailed',
        message: 'Failed to retrieve notification preferences',
      });
    }
  }

  /**
   * PUT /api/preferences/notifications
   * Update notification preferences
   */
  static async updateNotificationPreferences(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const preferences = req.body;

      const updated = await PreferencesService.updateNotificationPreferences(userId, preferences);

      res.json({
        success: true,
        message: 'Notification preferences updated',
        preferences: updated,
      });
    } catch (error: any) {
      res.status(400).json({
        error: 'UpdatePreferencesFailed',
        message: error.message || 'Failed to update notification preferences',
      });
    }
  }

  /**
   * GET /api/preferences/appearance
   * Get appearance preferences
   */
  static async getAppearancePreferences(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;

      const preferences = await PreferencesService.getAppearancePreferences(userId);

      res.json({
        success: true,
        preferences,
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'GetPreferencesFailed',
        message: 'Failed to retrieve appearance preferences',
      });
    }
  }

  /**
   * PUT /api/preferences/appearance
   * Update appearance preferences
   */
  static async updateAppearancePreferences(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const preferences = req.body;

      const updated = await PreferencesService.updateAppearancePreferences(userId, preferences);

      res.json({
        success: true,
        message: 'Appearance preferences updated',
        preferences: updated,
      });
    } catch (error: any) {
      res.status(400).json({
        error: 'UpdatePreferencesFailed',
        message: error.message || 'Failed to update appearance preferences',
      });
    }
  }

  /**
   * GET /api/preferences
   * Get all preferences
   */
  static async getAllPreferences(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;

      const preferences = await PreferencesService.getAllPreferences(userId);

      res.json({
        success: true,
        preferences,
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'GetPreferencesFailed',
        message: 'Failed to retrieve preferences',
      });
    }
  }

  /**
   * POST /api/preferences/push/enable
   * Enable push notifications
   */
  static async enablePushNotifications(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { subscription } = req.body;

      if (!subscription) {
        return res.status(400).json({
          error: 'MissingSubscription',
          message: 'Push subscription is required',
        });
      }

      await PreferencesService.enablePushNotifications(userId, subscription);

      res.json({
        success: true,
        message: 'Push notifications enabled',
      });
    } catch (error: any) {
      res.status(400).json({
        error: 'EnablePushFailed',
        message: error.message || 'Failed to enable push notifications',
      });
    }
  }

  /**
   * POST /api/preferences/push/disable
   * Disable push notifications
   */
  static async disablePushNotifications(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;

      await PreferencesService.disablePushNotifications(userId);

      res.json({
        success: true,
        message: 'Push notifications disabled',
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'DisablePushFailed',
        message: 'Failed to disable push notifications',
      });
    }
  }

  /**
   * GET /api/preferences/push/status
   * Check if push notifications are enabled
   */
  static async getPushStatus(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;

      const enabled = await PreferencesService.isPushEnabled(userId);

      res.json({
        success: true,
        enabled,
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'GetPushStatusFailed',
        message: 'Failed to check push notification status',
      });
    }
  }
}
