# Instagram Graph API Setup - Complete Fix Guide

## Current Error
"Invalid app ID: The provided app ID does not look like a valid app ID."

## Root Cause
The Facebook App needs **Facebook Login** product configured (not just Instagram Graph API).

---

## Step-by-Step Fix

### Step 1: Verify Facebook App Setup

1. Go to: https://developers.facebook.com/apps/906852755169558/
2. Look at the **left sidebar** - you should see these products:
   - ✅ Facebook Login
   - ✅ Instagram Graph API

If **Facebook Login** is missing, you need to add it.

---

### Step 2: Add Facebook Login Product

1. In your app dashboard, click **"Add Product"** in the left sidebar
2. Find **"Facebook Login"** and click **"Set Up"**
3. Choose **"Web"** as the platform
4. Skip the quickstart guide (click "Next" through it)

---

### Step 3: Configure Facebook Login Settings

1. In the left sidebar, click **"Facebook Login"** → **"Settings"**
2. Find **"Valid OAuth Redirect URIs"**
3. Add this exact URL:
   ```
   http://localhost:4000/api/oauth/instagram/callback
   ```
4. Click **"Save Changes"**

---

### Step 4: Verify App Mode

1. At the top of the page, check the toggle switch
2. It might say **"Development"** or **"Live"**
3. If it's in Development mode:
   - You need to add yourself as a test user
   - Go to **Roles** → **Test Users** or **Roles** → **Administrators**
   - Make sure your Facebook account is added

---

### Step 5: Verify Instagram Graph API Configuration

1. In left sidebar, click **"Instagram Graph API"** (or "Instagram" → "Graph API")
2. Make sure these permissions are added:
   - ✅ instagram_basic
   - ✅ instagram_manage_insights
   - ✅ instagram_manage_comments
   - ✅ pages_show_list
   - ✅ pages_read_engagement

---

### Step 6: CRITICAL - Verify Your Instagram Account Type

Your Instagram account MUST be:
- ✅ **Business Account** OR **Creator Account** (NOT personal)
- ✅ **Connected to a Facebook Page**

To check:
1. Open Instagram app on your phone
2. Go to Settings → Account → Switch to Professional Account
3. If already professional, go to Settings → Account → Linked Accounts → Facebook
4. Make sure it's connected to a Facebook Page

---

### Step 7: Alternative - Use Correct App Credentials

There are TWO different sets of credentials:

**Option A: Instagram Basic Display** (Limited - no analytics)
- Has separate Instagram App ID/Secret
- Found under: Products → Instagram → Basic Display
- ❌ Doesn't work for analytics

**Option B: Instagram Graph API** (Full analytics) ← THIS IS WHAT WE WANT
- Uses main Facebook App ID/Secret
- Found under: Settings → Basic
- ✅ Works for analytics

**Make sure you're using the RIGHT credentials:**
1. Go to **Settings** → **Basic** (in left sidebar)
2. Copy **App ID** and **App Secret** from there
3. These should be the MAIN Facebook App credentials

---

## Quick Test

After completing the steps above:

1. Restart Prolium backend server
2. Click "Connect Instagram" in Prolium
3. You should see Facebook's blue login screen (NOT Instagram's screen)
4. It should ask for permissions to access your Facebook Pages and Instagram

---

## Still Not Working?

If you still see the "Invalid app ID" error:

### Check 1: Verify App ID Format
The App ID should be a 15-digit number like: `906852755169558`
- Go to Settings → Basic
- Copy the **App ID** shown there

### Check 2: App Status
- Check if the app is "Active" (not deleted or suspended)
- Check the app dashboard for any warnings/errors

### Check 3: Create a New App (Last Resort)
If the app is broken, create a fresh Facebook App:
1. Go to https://developers.facebook.com/apps/create/
2. Choose **"Business"** type
3. Add **Facebook Login** product
4. Add **Instagram Graph API** product
5. Configure redirect URIs
6. Copy the NEW App ID and Secret to .env

---

## What Should Happen (Correct Flow)

1. Click "Connect Instagram" in Prolium
2. Browser opens **Facebook's** OAuth page (blue, Facebook logo)
3. You log in with Facebook (if not already logged in)
4. Facebook asks: "Prolium wants to access your Facebook Pages and Instagram Business Account"
5. You click "Continue"
6. Redirects back to Prolium with success message
7. Dashboard shows your Instagram stats

---

## Need to See Configuration?

Send me a screenshot of:
1. Your Facebook App Dashboard (Products section)
2. Settings → Basic page (hide App Secret)
3. Facebook Login → Settings page

This will help me identify what's misconfigured.
