/**
 * User Preferences Service
 * Handles notification preferences, theme, language, and accessibility settings
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface NotificationPreferences {
    marketing: boolean;
    productUpdates: boolean;
    weeklyDigest: boolean;
    collaborationRequests: boolean;
    commentReplies: boolean;
    newFollowers: boolean;
    analyticsAlerts: boolean;
}

interface AppearancePreferences {
    theme: 'light' | 'dark' | 'system';
    language: string;
    dateFormat: string;
    timeFormat: '12h' | '24h';
    highContrast: boolean;
    reduceMotion: boolean;
    textSize: number; // 12-20
}

export class PreferencesService {
    /**
     * Get user notification preferences
     */
  static async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
        const prefs = await prisma.userPreferences.findUnique({
                where: { userId },
        });

      if (!prefs) {
              // Return defaults
          return {
                    marketing: false,
                    productUpdates: true,
                    weeklyDigest: true,
                    collaborationRequests: true,
                    commentReplies: true,
                    newFollowers: true,
                    analyticsAlerts: true,
          };
      }

      return prefs.notificationPreferences as unknown as NotificationPreferences;
  }

  /**
     * Update notification preferences
     */
  static async updateNotificationPreferences(
        userId: string,
        preferences: Partial<NotificationPreferences>
      ) {
        const current = await this.getNotificationPreferences(userId);
        const updated = { ...current, ...preferences };

      await prisma.userPreferences.upsert({
              where: { userId },
              update: {
                        notificationPreferences: updated as any,
              },
              create: {
                        userId,
                        notificationPreferences: updated as any,
                        appearancePreferences: await this.getAppearancePreferences(userId) as any,
              },
      });

      return updated;
  }

  /**
     * Get appearance preferences
     */
  static async getAppearancePreferences(userId: string): Promise<AppearancePreferences> {
        const prefs = await prisma.userPreferences.findUnique({
                where: { userId },
        });

      if (!prefs) {
              // Return defaults
          return {
                    theme: 'dark',
                    language: 'en',
                    dateFormat: 'US',
                    timeFormat: '12h',
                    highContrast: false,
                    reduceMotion: false,
                    textSize: 16,
          };
      }

      return prefs.appearancePreferences as unknown as AppearancePreferences;
  }

  /**
     * Update appearance preferences
     */
  static async updateAppearancePreferences(
        userId: string,
        preferences: Partial<AppearancePreferences>
      ) {
        const current = await this.getAppearancePreferences(userId);
        const updated = { ...current, ...preferences };

      // Validate text size
      if (updated.textSize < 12 || updated.textSize > 20) {
              throw new Error('Text size must be between 12 and 20');
      }

      await prisma.userPreferences.upsert({
              where: { userId },
              update: {
                        appearancePreferences: updated as any,
              },
              create: {
                        userId,
                        notificationPreferences: await this.getNotificationPreferences(userId) as any,
                        appearancePreferences: updated as any,
              },
      });

      return updated;
  }

  /**
     * Get all preferences
     */
  static async getAllPreferences(userId: string) {
        const [notifications, appearance] = await Promise.all([
                this.getNotificationPreferences(userId),
                this.getAppearancePreferences(userId),
              ]);

      return {
              notifications,
              appearance,
      };
  }

  /**
     * Enable push notifications
     */
  static async enablePushNotifications(userId: string, subscription: any) {
        // Store push subscription
      await prisma.pushSubscription.create({
              data: {
                        userId,
                        endpoint: subscription.endpoint,
                        keys: subscription.keys,
              },
      });
        return { success: true };
  }

  /**
     * Disable push notifications
     */
  static async disablePushNotifications(userId: string) {
        await prisma.pushSubscription.deleteMany({
                where: { userId },
        });
        return { success: true };
  }

  /**
     * Check if push notifications are enabled
     */
  static async isPushEnabled(userId: string): Promise<boolean> {
        const count = await prisma.pushSubscription.count({
                where: { userId },
        });
        return count > 0;
  }

  /**
     * Send push notification to user
     */
  static async sendPushNotification(userId: string, title: string, body: string, data?: any) {
        const subscriptions = await prisma.pushSubscription.findMany({
                where: { userId },
        });

      if (subscriptions.length === 0) {
              return { sent: false, reason: 'No subscriptions' };
      }

      const webpush = require('web-push');

      // Configure web-push (keys should be in .env)
      webpush.setVapidDetails(
              'mailto:' + process.env.EMAIL_FROM,
              process.env.VAPID_PUBLIC_KEY,
              process.env.VAPID_PRIVATE_KEY
            );

      const payload = JSON.stringify({
              title,
              body,
              data: data || {},
              timestamp: Date.now(),
      });

      const results = await Promise.allSettled(
              subscriptions.map(sub =>
                        webpush.sendNotification(
                          {
                                        endpoint: sub.endpoint,
                                        keys: sub.keys,
                          },
                                    payload
                                  )
                                      )
            );

      // Remove invalid subscriptions (410 Gone)
      const invalidSubscriptions = results
          .map((result, index) => ({ result, subscription: subscriptions[index] }))
          .filter(({ result }) => result.status === 'rejected' && (result as any).reason?.statusCode === 410)
          .map(({ subscription }) => subscription.id);

      if (invalidSubscriptions.length > 0) {
              await prisma.pushSubscription.deleteMany({
                        where: { id: { in: invalidSubscriptions } },
              });
      }

      return {
              sent: true,
              successCount: results.filter(r => r.status === 'fulfilled').length,
              failureCount: results.filter(r => r.status === 'rejected').length,
      };
  }
}
