# Instagram Basic Display Setup Guide

## Problem
Error: "Invalid Request: Request parameters are invalid: Invalid platform app"

## Cause
The App ID `906852755169558` is a Facebook App ID, not configured for Instagram Basic Display.

## Solution

### Step 1: Add Instagram Basic Display Product

1. Go to: https://developers.facebook.com/apps/906852755169558/
2. In left sidebar, click **"Add Product"** or find **"Instagram Basic Display"**
3. Click **"Set Up"** next to Instagram Basic Display
4. Follow the setup wizard

### Step 2: Configure Instagram Basic Display

After adding the product:

1. Click **"Basic Display"** in the left menu under Instagram
2. You'll see a section called **"Instagram App ID"** and **"Instagram App Secret"**
3. **COPY THESE VALUES** - they are DIFFERENT from your Facebook App credentials

4. Add **Valid OAuth Redirect URIs**:
   ```
   http://localhost:4000/api/oauth/instagram/callback
   ```

5. Add **Deauthorize Callback URL**:
   ```
   http://localhost:4000/api/oauth/instagram/deauthorize
   ```

6. Add **Data Deletion Request URL**:
   ```
   http://localhost:4000/api/oauth/instagram/data-deletion
   ```

7. Click **"Save Changes"**

### Step 3: Add Instagram Test Users

1. Scroll down to **"User Token Generator"** section
2. Click **"Add or Remove Instagram Testers"**
3. Enter your Instagram username
4. Go to your Instagram app → Settings → Apps and Websites → Tester Invites
5. Accept the tester invitation

### Step 4: Update Credentials in Prolium

You'll see two sets of IDs:
- **Instagram App ID** (looks like: 123456789012345)
- **Instagram App Secret** (looks like: abc123def456)

Copy the **Instagram App ID** and **Instagram App Secret** from the Instagram Basic Display settings page and update your `.env` file.

---

## Alternative: Instagram Graph API (Business Accounts)

If you have an Instagram Business or Creator account connected to a Facebook Page, you can use Instagram Graph API instead:

### Requirements:
- Instagram Business or Creator account
- Connected to a Facebook Page
- Facebook Page admin access

### Benefits:
- More features (insights, publishing, etc.)
- No tester limitations in production
- Better for professional use

Let me know if you want to switch to Instagram Graph API instead!
