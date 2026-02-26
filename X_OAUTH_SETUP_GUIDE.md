# X (Twitter) OAuth Setup Guide

## Overview
X platform has been added to Prolium. To enable X connections, you need to set up a developer account and configure OAuth 2.0 credentials.

---

## Step 1: Create X Developer Account

1. Go to: https://developer.twitter.com/
2. Sign in with your X account
3. Apply for a developer account (if you don't have one)
4. Choose **"Free"** tier for development/testing

---

## Step 2: Create a Project and App

1. Once approved, go to the **Developer Portal**: https://developer.twitter.com/en/portal/dashboard
2. Click **"Create Project"**
3. Fill in project details:
   - **Project Name**: "Prolium" (or your choice)
   - **Use Case**: "Making a bot" or "Exploring the API"
   - **Project Description**: Brief description of Prolium
4. Click **"Next"** and create your project

---

## Step 3: Create an App within the Project

1. After creating the project, you'll be prompted to create an app
2. **App Name**: "Prolium App" (must be unique across all of X)
3. You'll receive **API Key** and **API Secret** - save these!

---

## Step 4: Configure OAuth 2.0 Settings

1. In your app dashboard, click **"App settings"**
2. Scroll to **"User authentication settings"**
3. Click **"Set up"**

### OAuth 2.0 Configuration:
- **App permissions**:
  - ✅ Read
  - ⬜ Write (optional for future features)
  - ⬜ Direct Messages (optional)

- **Type of App**:
  - Select **"Web App, Automated App or Bot"**

- **App info**:
  - **Callback URI / Redirect URL**:
    ```
    http://localhost:4000/api/oauth/x/callback
    ```
  - **Website URL**:
    ```
    http://localhost:3000
    ```
    (Can be any valid URL for development)

4. Click **"Save"**

---

## Step 5: Get Your OAuth 2.0 Client Credentials

1. After saving OAuth settings, X will show:
   - **Client ID** (different from API Key)
   - **Client Secret** (different from API Secret)
2. **Copy both values** - you'll need them for the `.env` file

---

## Step 6: Update Prolium `.env` File

1. Open `/Users/islamhasanov/Desktop/media/server/.env`
2. Find the X OAuth section and update:

```bash
# X (Twitter) OAuth
X_CLIENT_ID=your_x_client_id_here
X_CLIENT_SECRET=your_x_client_secret_here
X_REDIRECT_URI=http://localhost:4000/api/oauth/x/callback
```

3. Save the file
4. Restart the backend server:
   ```bash
   cd /Users/islamhasanov/Desktop/media/server
   npm run dev
   ```

---

## Step 7: Test the Connection

1. Open Prolium in your browser: http://localhost:3000
2. Go to **Account Settings** → **Connected Accounts**
3. Click **"Connect"** on the **X** card
4. You'll be redirected to X's authorization page
5. Approve the permissions
6. You should be redirected back to Prolium with success message

---

## Available Scopes

Prolium requests these permissions from X:
- `tweet.read` - Read tweets and user profile
- `users.read` - Read user information
- `follows.read` - Read followers and following lists
- `offline.access` - Get refresh token for long-term access

---

## Data Prolium Can Access

Once connected, Prolium can fetch:
- ✅ Follower count
- ✅ Following count
- ✅ Total tweets
- ✅ Basic profile information
- ✅ Account impressions (with additional API access)

---

## Troubleshooting

### Error: "Invalid redirect URI"
- Make sure the callback URL in X Developer Portal exactly matches:
  ```
  http://localhost:4000/api/oauth/x/callback
  ```
- No trailing slash
- Must be http (not https) for localhost

### Error: "Invalid client credentials"
- Verify you're using the **OAuth 2.0 Client ID/Secret** (not API Key/Secret)
- Check for extra spaces in `.env` file values

### Error: "App does not have access to this endpoint"
- Make sure OAuth 2.0 is enabled in User Authentication Settings
- Check that "Read" permissions are enabled

---

## Production Deployment

When deploying to production:

1. Update callback URL in X Developer Portal:
   ```
   https://yourdomain.com/api/oauth/x/callback
   ```

2. Update `.env` production variables:
   ```bash
   X_REDIRECT_URI=https://yourdomain.com/api/oauth/x/callback
   ```

3. Add production URL to "Website URL" in app settings

---

## Rate Limits

X API v2 Free Tier limits:
- **User lookup**: 25 requests per 24 hours
- **Tweet lookup**: 1,500 requests per month

For higher limits, consider upgrading to X API Pro or Enterprise.

---

## Useful Links

- X Developer Portal: https://developer.twitter.com/en/portal/dashboard
- OAuth 2.0 Documentation: https://developer.twitter.com/en/docs/authentication/oauth-2-0
- X API Reference: https://developer.twitter.com/en/docs/twitter-api

---

## Summary

You should now have:
- ✅ X Developer Account
- ✅ X App with OAuth 2.0 enabled
- ✅ Client ID and Secret in `.env` file
- ✅ Callback URL configured
- ✅ X platform visible in Prolium

Click "Connect" on X in Account Settings to test!
