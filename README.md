# CreatorAI - Authentication & Multi-Platform OAuth System

A production-ready authentication system with OAuth2 integrations for YouTube, TikTok, and Instagram.

## 🚀 Features

### Authentication
- ✅ Email/password registration with bcrypt hashing
- ✅ Email verification via SendGrid
- ✅ JWT-based authentication (access + refresh tokens)
- ✅ Password reset flow
- ✅ Remember me functionality (7 days vs 24 hours sessions)
- ✅ Rate limiting (5 attempts per 15 minutes)
- ✅ CSRF protection
- ✅ Secure HTTP-only cookies

### OAuth2 Integrations
- ✅ **YouTube** - Channel data, comments, analytics
- ✅ **TikTok** - User info, videos, insights (24-hour auto-refresh)
- ✅ **Instagram** - Media, comments, insights (60-day long-lived tokens)

### Security
- ✅ AES-256-GCM encryption for OAuth tokens
- ✅ PKCE (Proof Key for Code Exchange) for OAuth flows
- ✅ Automatic token refresh
- ✅ Audit logging (auth attempts, OAuth connections)
- ✅ State parameter validation (CSRF prevention)

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+ (or managed DB service)
- SendGrid account (for emails)
- OAuth credentials for YouTube, TikTok, Instagram

## 🛠️ Installation

### 1. Install Dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Set Up PostgreSQL

**Option A: Docker (Recommended)**
```bash
docker run --name creatorai-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=creatorai_db \
  -p 5432:5432 \
  -d postgres:15
```

**Option B: Managed Service**
- [Supabase](https://supabase.com) - Free tier
- [Railway](https://railway.app) - Easy setup
- [Neon](https://neon.tech) - Serverless PostgreSQL

### 3. Configure Environment

Update `/server/.env` with your database and API keys:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/creatorai_db
SENDGRID_API_KEY=SG.your_key_here
EMAIL_FROM=noreply@yourdomain.com

# See OAuth Setup section below for getting these credentials
YOUTUBE_CLIENT_ID=your_youtube_id
YOUTUBE_CLIENT_SECRET=your_youtube_secret

TIKTOK_CLIENT_KEY=your_tiktok_key
TIKTOK_CLIENT_SECRET=your_tiktok_secret

INSTAGRAM_CLIENT_ID=your_instagram_id
INSTAGRAM_CLIENT_SECRET=your_instagram_secret
```

### 4. Run Migrations

```bash
cd server
npm run prisma:migrate
```

### 5. Start Servers

**Terminal 1 - Backend:**
```bash
cd server
npm run dev  # http://localhost:4000
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev  # http://localhost:3000
```

## 📚 OAuth Setup Guides

### YouTube/Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com/)
2. Create project → Enable "YouTube Data API v3"
3. Create OAuth 2.0 Client ID (Web application)
4. Add redirect URI: `http://localhost:4000/api/oauth/youtube/callback`
5. Copy Client ID & Secret to `.env`

### TikTok OAuth

1. [TikTok Developers](https://developers.tiktok.com/)
2. Register → Create app → Add Login Kit
3. Add redirect URI: `http://localhost:4000/api/oauth/tiktok/callback`
4. Request scopes: `user.info.basic`, `video.list`, `video.insights`
5. Submit for review (1-2 weeks)
6. Copy Client Key & Secret to `.env`

### Instagram OAuth

1. [Meta for Developers](https://developers.facebook.com/)
2. Create Business app → Add "Instagram Basic Display"
3. Add redirect URI: `http://localhost:4000/api/oauth/instagram/callback`
4. Request permissions: `instagram_basic`, `instagram_manage_comments`, `instagram_manage_insights`
5. Add test Instagram accounts
6. Copy App ID & Secret to `.env`

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh-token` - Refresh token
- `GET /api/auth/me` - Get current user

### OAuth
- `GET /api/oauth/{platform}/authorize` - Start OAuth flow
- `GET /api/oauth/{platform}/callback` - OAuth callback

### Platforms
- `GET /api/platforms/connected` - Get connected platforms
- `DELETE /api/platforms/{platform}/disconnect` - Disconnect
- `POST /api/platforms/{platform}/refresh` - Refresh token

## 📁 Project Structure

```
/media/
├── client/           # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── contexts/    # AuthContext
│   │   ├── utils/       # API client
│   │   └── App.tsx
│   └── vite.config.ts
│
├── server/          # Express backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   │   └── oauth/   # YouTube, TikTok, Instagram
│   │   └── utils/       # PKCE, encryption
│   ├── prisma/schema.prisma
│   └── .env
│
└── shared/types/    # Shared TypeScript types
```

## 🧪 Testing Checklist

- [ ] Register → Receive email → Verify → Login
- [ ] Rate limiting (5 failed attempts)
- [ ] Connect YouTube → See channel name
- [ ] Connect TikTok → Auto-refresh every 22 hours
- [ ] Connect Instagram → Long-lived token (60 days)
- [ ] Disconnect platform
- [ ] Token auto-refresh on 401

## 🚢 Deployment

### Backend (Railway/Render)
1. Deploy `/server` folder
2. Add environment variables from `.env`
3. Update OAuth redirect URIs to production:
   - `https://your-api.com/api/oauth/youtube/callback`
   - `https://your-api.com/api/oauth/tiktok/callback`
   - `https://your-api.com/api/oauth/instagram/callback`

### Frontend (Vercel)
1. Deploy `/client` folder
2. Build command: `npm run build`
3. Output: `dist`

## 🐛 Troubleshooting

**Port in use:** `lsof -ti:4000 | xargs kill -9`

**DB connection:** Check `DATABASE_URL` and verify PostgreSQL is running

**OAuth errors:** Verify redirect URIs match exactly (http vs https)

## 📄 License

MIT

---

Built with [Claude Code](https://claude.com/claude-code)
