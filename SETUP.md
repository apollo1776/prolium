# CreatorAI Authentication System - Setup Instructions

## Project Structure

The project has been restructured into:
- `/client` - React frontend (existing code)
- `/server` - Express backend (new)
- `/shared` - Shared TypeScript types (ready for use)

## Phase 1 Complete ✓

The backend foundation is now set up with:
- ✅ Express + TypeScript server configuration
- ✅ Prisma ORM with PostgreSQL schema
- ✅ Encryption service (AES-256) for OAuth tokens
- ✅ JWT token service (access + refresh tokens)
- ✅ Email service (SendGrid integration)
- ✅ Secure environment variables with generated secrets

## PostgreSQL Setup Required

PostgreSQL is not installed on your system. Here's how to install it:

### macOS Installation:
```bash
# Install via Homebrew
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Create database
createdb creatorai_db
```

### Alternative: Docker (Recommended for Development)
```bash
# Run PostgreSQL in Docker
docker run --name creatorai-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=creatorai_db \
  -p 5432:5432 \
  -d postgres:15

# Verify it's running
docker ps
```

### Alternative: Use Managed PostgreSQL
Instead of local PostgreSQL, you can use a managed service:

1. **Supabase** (Free tier): https://supabase.com/
   - Create project → Get connection string
   - Update `DATABASE_URL` in `/server/.env`

2. **Railway** (Free tier): https://railway.app/
   - Create project → Add PostgreSQL
   - Copy connection string to `/server/.env`

3. **Neon** (Free tier): https://neon.tech/
   - Create project → Copy connection string
   - Update `DATABASE_URL` in `/server/.env`

## Running Migrations

Once PostgreSQL is set up, run:

```bash
cd server
npm run prisma:migrate
```

This will create all database tables defined in the schema.

## Start the Development Servers

### Terminal 1 - Backend Server:
```bash
cd server
npm run dev

# Server will run on http://localhost:4000
```

### Terminal 2 - Frontend Server:
```bash
cd client
npm run dev

# Frontend will run on http://localhost:3000
```

## Verify Installation

1. **Backend Health Check:**
   ```bash
   curl http://localhost:4000/health
   ```

2. **Check Services:**
   - Encryption: ✓ Configured
   - JWT Tokens: ✓ Configured
   - Email (SendGrid): ⚠️  Needs API key (optional for now)

## Next Steps (Phase 2)

Once PostgreSQL is set up, we'll implement:
1. User registration with email/password
2. Login with JWT authentication
3. Email verification flow
4. Password reset functionality
5. Rate limiting and security features

## Environment Variables

Key variables are already configured in `/server/.env`:
- ✓ JWT secrets generated
- ✓ Encryption key generated
- ⚠️  Database URL (update after PostgreSQL setup)
- ⚠️  SendGrid API key (get from https://sendgrid.com/)
- ⚠️  OAuth credentials (to be set up in later phases)

## Troubleshooting

### Issue: "Port 4000 already in use"
```bash
# Find and kill the process using port 4000
lsof -ti:4000 | xargs kill -9
```

### Issue: "Cannot connect to database"
1. Ensure PostgreSQL is running: `brew services list` or `docker ps`
2. Check DATABASE_URL in `/server/.env`
3. Verify database exists: `psql -l`

### Issue: "Module not found"
```bash
# Reinstall dependencies
cd server && npm install
cd ../client && npm install
```

## Current File Structure

```
/media/
├── client/                   # Frontend
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   ├── services/
│   │   └── types.ts
│   ├── package.json
│   └── vite.config.ts
│
├── server/                   # Backend
│   ├── src/
│   │   ├── app.ts           # Express app setup
│   │   ├── server.ts        # Server entry point
│   │   └── services/
│   │       ├── encryption.service.ts
│   │       ├── token.service.ts
│   │       └── email.service.ts
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   ├── .env                 # Environment variables
│   └── package.json
│
├── shared/                  # Shared types
└── SETUP.md                 # This file
```

## Ready for Phase 2!

Once PostgreSQL is running and migrations are complete, we can proceed to build the authentication system.
