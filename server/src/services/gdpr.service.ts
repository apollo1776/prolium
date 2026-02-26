/**
 * GDPR Compliance Service
 * Handles data export and account deletion per GDPR requirements
 */

import { PrismaClient } from '@prisma/client';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const prisma = new PrismaClient();
const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

export class GDPRService {
  /**
   * Export all user data in JSON format (GDPR Article 20)
   */
  static async exportUserData(userId: string): Promise<string> {
    // Gather all user data from database
    const [user, sessions, platforms, posts, analytics, authAttempts] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.session.findMany({ where: { userId } }),
      prisma.platformConnection.findMany({ where: { userId } }),
      prisma.post.findMany({ where: { userId } }),
      prisma.analytics.findMany({ where: { userId } }),
      prisma.authAttempt.findMany({ where: { email: (await prisma.user.findUnique({ where: { id: userId } }))?.email } }),
    ]);

    if (!user) {
      throw new Error('User not found');
    }

    // Format data in human-readable structure
    const exportData = {
      export_date: new Date().toISOString(),
      export_type: 'GDPR Article 20 - Right to Data Portability',
      user_profile: {
        id: user.id,
        email: user.email,
        name: user.name,
        country: user.country,
        timezone: user.timezone,
        phone: user.phone,
        bio: user.bio,
        email_verified: user.emailVerified,
        two_factor_enabled: user.twoFactorEnabled,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
        last_login: user.lastLogin,
      },
      sessions: sessions.map(s => ({
        id: s.id,
        created_at: s.createdAt,
        expires_at: s.expiresAt,
        // Don't export tokens for security
      })),
      connected_platforms: platforms.map(p => ({
        platform: p.platform,
        username: p.platformUsername,
        connected_at: p.connectedAt,
        last_synced: p.lastSynced,
        is_active: p.isActive,
        scopes_granted: p.scopesGranted,
        // Don't export access tokens for security
      })),
      posts: posts.map(p => ({
        id: p.id,
        platform: p.platform,
        content: p.content,
        scheduled_for: p.scheduledFor,
        published_at: p.publishedAt,
        status: p.status,
        created_at: p.createdAt,
      })),
      analytics: analytics.map(a => ({
        id: a.id,
        platform: a.platform,
        metric_type: a.metricType,
        value: a.value,
        recorded_at: a.recordedAt,
      })),
      authentication_history: authAttempts.map(a => ({
        success: a.success,
        ip_address: a.ipAddress,
        user_agent: a.userAgent,
        timestamp: a.createdAt,
      })),
    };

    // Create exports directory if it doesn't exist
    const exportsDir = path.join(process.cwd(), 'exports');
    try {
      await mkdir(exportsDir, { recursive: true });
    } catch (err) {
      // Directory might already exist
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `user_data_export_${userId}_${timestamp}.json`;
    const zipFilename = `user_data_export_${userId}_${timestamp}.zip`;
    const jsonPath = path.join(exportsDir, filename);
    const zipPath = path.join(exportsDir, zipFilename);

    // Write JSON file
    await writeFile(jsonPath, JSON.stringify(exportData, null, 2));

    // Create ZIP archive
    await new Promise<void>((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => resolve());
      archive.on('error', (err) => reject(err));

      archive.pipe(output);
      archive.file(jsonPath, { name: filename });
      archive.finalize();
    });

    // Delete JSON file (keep only ZIP)
    await unlink(jsonPath);

    // Log the export request (GDPR audit trail)
    await prisma.dataExportLog.create({
      data: {
        userId,
        exportPath: zipPath,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    return zipPath;
  }

  /**
   * Delete user account and all associated data (GDPR Article 17)
   */
  static async deleteUserAccount(userId: string, password: string): Promise<void> {
    // Verify user exists and password is correct
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      throw new Error('User not found');
    }

    const bcrypt = require('bcrypt');
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid password');
    }

    // Log deletion request (GDPR audit - keep for 3 years)
    await prisma.accountDeletionLog.create({
      data: {
        userId,
        email: user.email,
        deletedAt: new Date(),
        reason: 'User requested deletion (GDPR Article 17)',
      },
    });

    // Delete all user data in correct order (foreign key constraints)
    await prisma.$transaction([
      // Delete sessions
      prisma.session.deleteMany({ where: { userId } }),

      // Delete email verification tokens
      prisma.emailVerificationToken.deleteMany({ where: { userId } }),

      // Delete password reset tokens
      prisma.passwordResetToken.deleteMany({ where: { userId } }),

      // Delete platform connections
      prisma.platformConnection.deleteMany({ where: { userId } }),

      // Delete posts
      prisma.post.deleteMany({ where: { userId } }),

      // Delete analytics
      prisma.analytics.deleteMany({ where: { userId } }),

      // Delete data export logs
      prisma.dataExportLog.deleteMany({ where: { userId } }),

      // Delete subscription (if exists)
      prisma.subscription.deleteMany({ where: { userId } }),

      // Delete payment methods (if exist)
      prisma.paymentMethod.deleteMany({ where: { userId } }),

      // Finally, delete user
      prisma.user.delete({ where: { id: userId } }),
    ]);

    // Clean up any export files
    const exportsDir = path.join(process.cwd(), 'exports');
    const files = fs.readdirSync(exportsDir);
    const userFiles = files.filter(f => f.includes(userId));

    for (const file of userFiles) {
      try {
        await unlink(path.join(exportsDir, file));
      } catch (err) {
        // File might not exist
      }
    }
  }

  /**
   * Clean up expired export files (should run as scheduled job)
   */
  static async cleanupExpiredExports(): Promise<void> {
    const expiredExports = await prisma.dataExportLog.findMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    for (const exportLog of expiredExports) {
      try {
        // Delete file
        if (fs.existsSync(exportLog.exportPath)) {
          await unlink(exportLog.exportPath);
        }

        // Delete log entry
        await prisma.dataExportLog.delete({
          where: { id: exportLog.id },
        });
      } catch (err) {
        console.error(`Failed to cleanup export ${exportLog.id}:`, err);
      }
    }
  }
}
