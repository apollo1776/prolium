# X (Twitter) OAuth Setup - Fix "Something Went Wrong" Error

## Problem
When trying to connect X account, you get: "Something went wrong. You weren't able to give access to the App."

## Root Cause
The X Developer Portal app configuration doesn't match the OAuth request parameters.

## Required Fixes in X Developer Portal

### 1. Go to X Developer Portal
Visit: https://developer.twitter.com/en/portal/dashboard

### 2. Select Your App
Click on your app (the one with Client ID: `TDZLN1RUVjN2RUM0WF80ZXhJTzY6MTpjaQ`)

### 3. Configure App Settings

#### A. App Type Must Be "Web App"
- Go to **Settings** → **User authentication settings**
- **Type of App**: Must be set to **"Web App, Automated App or Bot"**
- NOT "Native App" (Native apps don't support all scopes)

#### B. Callback URLs (CRITICAL - Must Match Exactly)
- In **Callback URI / Redirect URL** section:
- Add EXACTLY: `http://localhost:4000/api/oauth/x/callback`
- No trailing slash
- No extra spaces
- Must match your .env `X_REDIRECT_URI` exactly

#### C. Required Permissions/Scopes
Enable these permissions in your app:
- ✅ **Read** (for tweet.read, users.read)
- ✅ **Write** (for tweet.write)
- ✅ **Offline access** (for refresh tokens)

The app must have at minimum:
- `tweet.read`
- `tweet.write`
- `users.read`
- `offline.access`

#### D. OAuth 2.0 Settings
- **OAuth 2.0** must be ENABLED
- **OAuth 1.0a** can be disabled (we don't use it)

### 4. Website URL
- Set a valid website URL (required by X): `http://localhost:3000`

### 5. Save Changes
- Click **Save** at the bottom
- X may take a few minutes to apply changes

---

## After Fixing X Developer Portal Settings

### 1. Restart Your Server
```bash
cd /Users/islamhasanov/Desktop/media/server
npm run dev
```

### 2. Try Connecting Again
- Log in to your app
- Go to Account Settings → Connected Platforms
- Click "Connect X"
- Should now work!

---

## Debugging Tips

### Check If Scopes Match
The scopes requested by your app MUST match what's approved in X Developer Portal.

Current scopes requested:
- `tweet.read`
- `tweet.write`
- `users.read`
- `offline.access`

### Verify Redirect URI
The redirect URI in your .env:
```
X_REDIRECT_URI=http://localhost:4000/api/oauth/x/callback
```

MUST EXACTLY match what's in X Developer Portal settings.

### Common Issues
1. **"Something went wrong"** = Scopes mismatch or app type wrong
2. **"Invalid redirect_uri"** = Callback URL doesn't match
3. **"Invalid client"** = Client ID/Secret wrong or app not approved

---

## If Still Not Working

1. **Regenerate Keys**: In X Developer Portal, regenerate Client ID and Client Secret
2. **Update .env**: Update `X_CLIENT_ID` and `X_CLIENT_SECRET` with new values
3. **Clear Browser Cache**: Clear cookies and try again
4. **Use Incognito**: Try OAuth flow in incognito window

---

## Updated Configuration Summary

✅ **Fixed scopes** in code (tweet.write added)
✅ **Debug logging** added to see OAuth URL
✅ Need to **fix X Developer Portal settings** (see above)

The code changes are complete. You just need to configure the X app correctly in the Developer Portal!
