/**
 * Upload Service
 * Handles file uploads (profile pictures, etc.)
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Allowed image types
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Configure storage
const profilePictureStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'profile-pictures');

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: userId_timestamp_random.ext
    const userId = (req as any).user?.userId || 'unknown';
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);

    cb(null, `${userId}_${timestamp}_${random}${ext}`);
  },
});

// File filter
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
  }
};

// Create multer upload instances
export const uploadProfilePicture = multer({
  storage: profilePictureStorage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

export class UploadService {
  /**
   * Delete old profile picture file
   */
  static deleteProfilePicture(filePath: string): void {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (error) {
      console.error('Error deleting profile picture:', error);
    }
  }

  /**
   * Get profile picture URL
   */
  static getProfilePictureUrl(filename: string): string {
    return `/uploads/profile-pictures/${filename}`;
  }
}
