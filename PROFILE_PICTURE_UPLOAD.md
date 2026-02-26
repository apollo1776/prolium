# Profile Picture Upload - Implementation Guide

## Backend Status: ✅ COMPLETE

Profile picture upload is now fully functional on the backend.

---

## New API Endpoints

### 1. Upload Profile Picture
```
POST /api/auth/upload-profile-picture
```

**Authentication**: Required (JWT cookie)

**Content-Type**: `multipart/form-data`

**Form Field**: `profilePicture` (file)

**Allowed Types**: JPEG, JPG, PNG, GIF, WebP

**Max Size**: 5MB

**Response**:
```json
{
  "success": true,
  "message": "Profile picture uploaded successfully",
  "profilePicture": "/uploads/profile-pictures/userId_timestamp_random.jpg",
  "user": {
    "id": "...",
    "email": "...",
    "name": "...",
    "profilePicture": "/uploads/profile-pictures/userId_timestamp_random.jpg",
    ...
  }
}
```

**Error Responses**:
- 400: No file provided
- 400: Invalid file type
- 413: File too large (>5MB)
- 500: Upload failed

---

### 2. Remove Profile Picture
```
DELETE /api/auth/profile-picture
```

**Authentication**: Required (JWT cookie)

**Response**:
```json
{
  "success": true,
  "message": "Profile picture removed successfully",
  "user": {
    "id": "...",
    "profilePicture": null,
    ...
  }
}
```

---

### 3. Access Profile Pictures
Profile pictures are served as static files:

```
GET http://localhost:4000/uploads/profile-pictures/filename.jpg
```

In production, this would be:
```
GET https://yourdomain.com/uploads/profile-pictures/filename.jpg
```

---

## Frontend Implementation

### 1. Basic Upload with Fetch API

```typescript
const handleProfilePictureUpload = async (file: File) => {
  try {
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Maximum size is 5MB.');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
      return;
    }

    // Create form data
    const formData = new FormData();
    formData.append('profilePicture', file);

    // Upload
    const response = await fetch('/api/auth/upload-profile-picture', {
      method: 'POST',
      credentials: 'include', // Include cookies
      body: formData, // Don't set Content-Type header - browser will set it automatically
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Upload failed');
    }

    // Update user state with new profile picture
    setUser(data.user);
    alert('Profile picture uploaded successfully!');

    // The profile picture URL is: data.profilePicture
    // Full URL: http://localhost:4000${data.profilePicture}
  } catch (error: any) {
    console.error('Upload error:', error);
    alert(error.message || 'Failed to upload profile picture');
  }
};
```

---

### 2. File Input Component

```tsx
import { useState } from 'react';
import { Upload, X } from 'lucide-react';

const ProfilePictureUpload = ({ currentPicture, onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentPicture);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Maximum size is 5MB.');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await fetch('/api/auth/upload-profile-picture', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      // Success callback
      onUploadSuccess(data.user);
      alert('Profile picture updated!');
    } catch (error: any) {
      alert(error.message || 'Upload failed');
      setPreview(currentPicture); // Restore previous picture
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm('Remove profile picture?')) return;

    try {
      const response = await fetch('/api/auth/profile-picture', {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setPreview(null);
      onUploadSuccess(data.user);
      alert('Profile picture removed');
    } catch (error: any) {
      alert(error.message || 'Failed to remove picture');
    }
  };

  return (
    <div className="flex items-center gap-4">
      {/* Profile Picture Preview */}
      <div className="relative">
        {preview ? (
          <img
            src={preview.startsWith('/uploads')
              ? `http://localhost:4000${preview}`
              : preview}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
            <Upload className="w-8 h-8 text-gray-400" />
          </div>
        )}

        {/* Remove button */}
        {preview && (
          <button
            onClick={handleRemove}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Upload button */}
      <div>
        <label
          htmlFor="profile-picture-input"
          className="px-4 py-2 bg-blue-500 text-white rounded-md cursor-pointer hover:bg-blue-600 inline-block"
        >
          {uploading ? 'Uploading...' : 'Upload Photo'}
        </label>
        <input
          id="profile-picture-input"
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
        />
        <p className="text-xs text-gray-500 mt-1">
          JPEG, PNG, GIF, or WebP. Max 5MB.
        </p>
      </div>
    </div>
  );
};

export default ProfilePictureUpload;
```

---

### 3. Integration in AccountSettings.tsx

Update your AccountSettings component to include the profile picture upload:

```tsx
import { useState, useEffect } from 'react';
import ProfilePictureUpload from './ProfilePictureUpload';

const AccountSettings = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Fetch current user
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setUser(data.user))
      .catch(err => console.error('Failed to fetch user:', err));
  }, []);

  const handleUploadSuccess = (updatedUser) => {
    setUser(updatedUser);
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div>
      {/* Profile Information Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Profile Information</h3>

        {/* Profile Picture Upload */}
        <ProfilePictureUpload
          currentPicture={user.profilePicture}
          onUploadSuccess={handleUploadSuccess}
        />

        {/* Rest of your profile form fields */}
        <div className="mt-6">
          {/* Name, Email, Country, etc. */}
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
```

---

### 4. Display Profile Picture Throughout App

```tsx
const ProfilePicture = ({ user }) => {
  const getProfilePictureUrl = (picture) => {
    if (!picture) return null;

    // If it's a relative URL, prepend the API base URL
    if (picture.startsWith('/uploads')) {
      return `http://localhost:4000${picture}`;
      // In production: return `https://yourdomain.com${picture}`;
    }

    return picture;
  };

  const pictureUrl = getProfilePictureUrl(user.profilePicture);

  return (
    <div>
      {pictureUrl ? (
        <img
          src={pictureUrl}
          alt={user.name || 'Profile'}
          className="w-10 h-10 rounded-full object-cover"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
          <span className="text-gray-600 font-semibold">
            {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
};
```

---

## Backend Implementation Details

### Files Created:
- `/server/src/services/upload.service.ts` - Multer configuration and upload logic
- `/server/uploads/profile-pictures/` - Storage directory for uploaded pictures

### Files Modified:
- `/server/src/controllers/auth.controller.ts` - Added upload and remove endpoints
- `/server/src/routes/auth.routes.ts` - Registered upload routes
- `/server/src/services/auth.service.ts` - Added profilePicture field to responses
- `/server/src/app.ts` - Serves uploaded files as static assets
- `/server/prisma/schema.prisma` - Added profilePicture field (already done)

### Features:
✅ File type validation (JPEG, PNG, GIF, WebP only)
✅ File size validation (5MB max)
✅ Unique filename generation (prevents conflicts)
✅ Automatic deletion of old profile picture when uploading new one
✅ Remove profile picture endpoint
✅ Static file serving for uploaded images
✅ Secure (requires authentication)

---

## Security Considerations

1. **File Type Validation**: Only allows image files (JPEG, PNG, GIF, WebP)
2. **File Size Limit**: 5MB maximum to prevent abuse
3. **Authentication Required**: Both upload and remove require valid JWT
4. **Unique Filenames**: Generated with userId + timestamp + random hex
5. **Old File Cleanup**: Previous profile picture is deleted when uploading new one
6. **No Direct File Path Exposure**: Users can't specify where files are saved

---

## Testing

### Test Upload:
```bash
# With curl (replace YOUR_ACCESS_TOKEN and path/to/image.jpg)
curl -X POST http://localhost:4000/api/auth/upload-profile-picture \
  -H "Cookie: accessToken=YOUR_ACCESS_TOKEN" \
  -F "profilePicture=@path/to/image.jpg"
```

### Test Remove:
```bash
curl -X DELETE http://localhost:4000/api/auth/profile-picture \
  -H "Cookie: accessToken=YOUR_ACCESS_TOKEN"
```

### Test Access:
```bash
# After uploading, access the image directly
curl http://localhost:4000/uploads/profile-pictures/filename.jpg
```

---

## Production Considerations

### For Production Deployment:

1. **Use Cloud Storage** (Recommended):
   - AWS S3
   - Cloudinary
   - Google Cloud Storage
   - Replace local file storage with cloud storage API

2. **CDN** (Optional):
   - Serve images through CloudFlare or similar CDN
   - Faster delivery worldwide
   - Better caching

3. **Image Optimization** (Optional):
   - Add Sharp library for image resizing/compression
   - Generate thumbnails
   - Convert to WebP for better compression

4. **HTTPS Only**:
   - Ensure all uploads happen over HTTPS in production

---

## Summary

✅ **Backend Complete**: Profile picture upload and removal fully functional
✅ **API Endpoints**: Upload and remove endpoints created
✅ **Static File Serving**: Uploaded images accessible via URL
✅ **Security**: File validation, size limits, authentication required
✅ **Automatic Cleanup**: Old pictures deleted when uploading new ones

**Ready to use!** Just integrate the frontend code examples above into your AccountSettings component.
