/**
 * GDPR Controller
 * Handles data export and account deletion
 */

import { Request, Response } from 'express';
import { GDPRService } from '../services/gdpr.service';

export class GDPRController {
  /**
   * POST /api/gdpr/export
   * Export user data
   */
  static async exportData(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;

      const zipPath = await GDPRService.exportUserData(userId);

      // Stream the ZIP file to user
      res.download(zipPath, `user_data_export_${Date.now()}.zip`, (err) => {
        if (err) {
          console.error('Error downloading file:', err);
        }
        // File will be auto-deleted after 30 days by cleanup job
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'ExportFailed',
        message: error.message || 'Failed to export data',
      });
    }
  }

  /**
   * POST /api/gdpr/delete-account
   * Delete user account
   */
  static async deleteAccount(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({
          error: 'MissingPassword',
          message: 'Password is required to delete account',
        });
      }

      await GDPRService.deleteUserAccount(userId, password);

      // Clear cookies
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      res.json({
        success: true,
        message: 'Account deleted successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        error: 'DeleteAccountFailed',
        message: error.message || 'Failed to delete account',
      });
    }
  }
}
