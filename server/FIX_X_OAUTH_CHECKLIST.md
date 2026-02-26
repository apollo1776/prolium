# X OAuth Fix - Step-by-Step Checklist

## Your Current Settings (From Logs):
- **Client ID**: `TDZLN1RUVjN2RUM0WF80ZXhJTzY6MTpjaQ`
- **Redirect URI**: `http://localhost:4000/api/oauth/x/callback`
- **Scopes Requested**: `tweet.read tweet.write users.read offline.access`

---

## STEP 1: Check X Developer Portal App Type

1. Go to: https://developer.twitter.com/en/portal/projects-and-apps
2. Click on your app (find the one with Client ID ending in `...ZXhJTzY6MTpjaQ`)
3. Click on **"App settings"** or **"Settings"**
4. Scroll to **"User authentication settings"**

### What You Should See:
```
✅ Type of App: "Web App, Automated App or Bot"
❌ NOT "Native App"
❌ NOT "Single page App"
```

**If it says "Native App" → This is your problem! Change it to "Web App"**

---

## STEP 2: Verify App Permissions (CRITICAL)

In the **"User authentication settings"** section:

### Required Permissions:
```
✅ Read (must be enabled)
✅ Write (must be enabled) ← CRITICAL - likely missing!
✅ Request email from users (optional)
```

### App Permissions section should show:
```
✅ Read Tweets
✅ Write Tweets  ← Make sure this is checked!
✅ Read users
✅ Read follows (optional)
```

**If "Write" or "Write Tweets" is NOT enabled → Enable it now!**

---

## STEP 3: Verify OAuth 2.0 is Enabled

In **"User authentication settings"**:

```
✅ OAuth 2.0: ON (toggle should be blue/enabled)
✅ OAuth 1.0a: Can be OFF (we don't use it)
```

---

## STEP 4: Check Callback URLs (Must Match EXACTLY)

In the **"Callback URI / Redirect URL"** field:

Must contain EXACTLY (copy-paste this):
```
http://localhost:4000/api/oauth/x/callback
```

**Common mistakes:**
- ❌ `https://localhost:4000/api/oauth/x/callback` (http not https)
- ❌ `http://localhost:4000/api/oauth/x/callback/` (trailing slash)
- ❌ Extra spaces before/after

**After adding the URL, make sure to click the "+" button to add it to the list!**

---

## STEP 5: Website URL (Required by X)

X requires a website URL even for development:

```
Website URL: http://localhost:3000
```

Or use a real domain if you have one.

---

## STEP 6: Save and Regenerate Keys

1. **Save all changes** (scroll down and click "Save")
2. **Wait 2-3 minutes** for X to apply the changes
3. **IMPORTANT**: If you made changes to OAuth 2.0 settings, you may need to:
   - Regenerate your **Client Secret**
   - Update it in your `.env` file
   - Restart your server

---

## STEP 7: Verify Your .env File

Your `.env` should have (with your real values):
```bash
X_CLIENT_ID=TDZLN1RUVjN2RUM0WF80ZXhJTzY6MTpjaQ
X_CLIENT_SECRET=your_real_secret_here
X_REDIRECT_URI=http://localhost:4000/api/oauth/x/callback
X_CALLBACK_URL=http://localhost:4000/api/oauth/x/callback
```

---

## STEP 8: Test Again

1. **Restart your backend server**:
   ```bash
   # Stop current server (Ctrl+C)
   cd /Users/islamhasanov/Desktop/media/server
   npm run dev
   ```

2. **Clear browser cache** or use **Incognito mode**

3. **Try connecting X again**:
   - Go to Account Settings
   - Click "Connect X"
   - Should now work!

---

## If Still Not Working: Screenshot Your Settings

Take screenshots of these sections in X Developer Portal:

1. **User authentication settings** page (whole page)
2. **App permissions** section
3. **Callback URLs** section
4. **OAuth 2.0** toggle

Then I can tell you exactly what's wrong.

---

## Most Likely Issues (90% of cases):

### Issue #1: App Type is "Native App"
- **Fix**: Change to "Web App, Automated App or Bot"

### Issue #2: "Write" Permission NOT Enabled
- **Fix**: Enable "Write" permission in App permissions

### Issue #3: Callback URL not added correctly
- **Fix**: Make sure URL is EXACTLY `http://localhost:4000/api/oauth/x/callback`
- **Fix**: Click the "+" button to add it to the list

### Issue #4: OAuth 2.0 Disabled
- **Fix**: Toggle OAuth 2.0 to ON

---

## Quick Diagnostic:

Run this in your browser console while on the X error page:
```javascript
console.log(window.location.href)
```

If it shows parameters like `error=access_denied` or `error=invalid_request`, send me the full URL (hide your tokens) and I can diagnose further.
