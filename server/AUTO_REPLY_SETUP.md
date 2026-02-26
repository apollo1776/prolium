# Auto-Reply System Setup Guide

## Prerequisites

1. **Redis** - Required for BullMQ queue system
2. **OpenAI API Key** - Required for AI matching features
3. **Platform OAuth** - YouTube, Instagram, TikTok connections

---

## Installation

### 1. Install Redis

**macOS (Homebrew):**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**Docker:**
```bash
docker run -d -p 6379:6379 redis:alpine
```

Verify Redis is running:
```bash
redis-cli ping
# Should return: PONG
```

### 2. Configure Environment Variables

Add to `/server/.env`:

```bash
# Redis (for BullMQ)
REDIS_URL=redis://localhost:6379

# OpenAI (for AI matching)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Existing variables (should already be set)
DATABASE_URL=postgresql://...
YOUTUBE_CLIENT_ID=...
INSTAGRAM_CLIENT_ID=...
# ... etc
```

### 3. Install Dependencies

Already installed with previous `npm install`, but verify:
```bash
npm list bullmq ioredis openai
```

---

## Running the System

### Option 1: Development Mode (Recommended for testing)

**Terminal 1 - Main API Server:**
```bash
cd /Users/islamhasanov/Desktop/media/server
npm run dev
```

**Terminal 2 - Worker System:**
```bash
cd /Users/islamhasanov/Desktop/media/server
npm run dev:workers
```

### Option 2: Production Mode

```bash
npm run build
npm start              # Main server
npm run start:workers  # Workers
```

---

## How It Works

### Architecture

```
┌─────────────────┐
│  User Creates   │
│  Auto-Reply     │──┐
│  Rules          │  │
└─────────────────┘  │
                     ├──> Stored in Database
┌─────────────────┐  │
│  Poll Worker    │  │
│  (Every 5 min)  │<─┘
└────────┬────────┘
         │
         │ Fetches new comments
         ▼
┌─────────────────┐
│  Process Worker │
│  (Matches rules)│
└────────┬────────┘
         │
         │ AI Matching via OpenAI
         ▼
┌─────────────────┐
│ Response Worker │
│ (Sends replies) │
└─────────────────┘
```

### Workflow

1. **User creates auto-reply rule** via frontend UI
   - Define trigger (keyword, semantic, sentiment, question, mention)
   - Set response template with variables
   - Configure rate limits and filters

2. **Poll Worker runs every 5 minutes**
   - Fetches new comments from YouTube/Instagram/TikTok
   - Filters out already-processed comments
   - Queues new comments for processing

3. **Process Worker analyzes each comment**
   - Matches against active rules
   - Uses OpenAI for semantic matching, sentiment analysis, spam detection
   - Applies filters (skip spam, skip negative sentiment, etc.)
   - Creates log entry

4. **Response Worker sends replies**
   - Replaces template variables ({{username}}, {{videoTitle}}, etc.)
   - Adds human-like delay (30s-120s random)
   - Checks daily rate limits
   - Posts reply to platform via API
   - Updates log with success/error

---

## Testing

### 1. Create a Test Rule

Go to frontend → AI Replies tab:
- **Name:** "Test Rule"
- **Keywords:** "test", "hello"
- **Platforms:** YouTube (must have connected account)
- **Response Template:** "Hi {{username}}! This is an automated test reply."
- **Max Responses/Day:** 10
- **Filters:** Enable "Skip Spam" and "Skip Negative Sentiment"

### 2. Add Video IDs

In the rule, specify YouTube video IDs to monitor (find in video URL):
```
https://www.youtube.com/watch?v=VIDEO_ID_HERE
```

### 3. Manual Test Trigger

```bash
curl -X POST http://localhost:4000/api/auto-reply/test/poll \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Or use the frontend test button (to be added).

### 4. Check Logs

**Activity Log tab** will show:
- Triggered comments
- Match status (success/filtered)
- Response sent status
- Errors (if any)

**Server logs** show real-time processing:
```
[Poll Worker] Polling comments for user abc123
[Process Worker] Processing comment xyz789
[Response Worker] Sending response for comment xyz789
```

---

## API Endpoints

All endpoints require authentication (`Authorization: Bearer JWT_TOKEN`)

### Rules Management
- `GET /api/auto-reply/rules` - List all rules
- `POST /api/auto-reply/rules` - Create rule
- `GET /api/auto-reply/rules/:id` - Get rule details
- `PUT /api/auto-reply/rules/:id` - Update rule
- `DELETE /api/auto-reply/rules/:id` - Delete rule
- `POST /api/auto-reply/rules/:id/toggle` - Enable/disable rule

### Activity & Stats
- `GET /api/auto-reply/logs?ruleId=X&platform=YOUTUBE&limit=50&offset=0` - Get activity logs
- `GET /api/auto-reply/stats` - Get statistics

### Testing
- `POST /api/auto-reply/test/poll` - Manually trigger comment polling

---

## Trigger Types

### 1. KEYWORD
Matches specific keywords in comments.

**Match Modes:**
- `EXACT` - Comment must exactly match keyword
- `CONTAINS` - Comment contains keyword anywhere
- `STARTS_WITH` - Comment starts with keyword
- `REGEX` - Custom regex pattern
- `AI_SIMILARITY` - OpenAI embedding similarity (threshold: 0.8)

**Example:**
```
Keywords: ["course", "tutorial"]
Match Mode: CONTAINS
Comment: "Where can I get the course?" → ✅ MATCH
```

### 2. SEMANTIC
AI-powered intent matching (requires OpenAI).

**Example:**
```
Keywords: ["asking for discount"]
Comment: "Do you have any promo codes?" → ✅ MATCH (similar intent)
```

### 3. SENTIMENT
Triggers on positive/negative/neutral sentiment.

**Example:**
```
Keywords: ["positive"]
Comment: "This video is amazing!" → ✅ MATCH
```

### 4. QUESTION
Triggers when comment is a question.

**Example:**
```
Comment: "How do I install this?" → ✅ MATCH
Comment: "Great video" → ❌ NO MATCH
```

### 5. MENTION
Triggers when comment mentions creator.

**Example:**
```
Keywords: ["@yourname", "your channel"]
Comment: "Love your channel!" → ✅ MATCH
```

---

## Template Variables

Use these in response templates:

- `{{username}}` - Commenter's name
- `{{videoTitle}}` - Video/post title
- `{{customLink}}` - Custom link from rule config
- `{{commentText}}` - Original comment text
- `{{platform}}` - Platform name (YOUTUBE, INSTAGRAM, TIKTOK)

**Example:**
```
Template: "Hi {{username}}! Check out {{customLink}} for more info about {{videoTitle}}."

Result: "Hi John! Check out https://example.com for more info about My Video Title."
```

---

## Rate Limiting

### Per-Rule Limits
- **maxResponsesPerDay**: Max replies per day per rule (default: 100)
- **minDelaySeconds**: Minimum delay before responding (default: 30s)
- **maxDelaySeconds**: Maximum delay before responding (default: 120s)

Random delay ensures natural behavior and avoids platform spam detection.

### Daily Usage Tracking
Stored in `daily_usage` table:
```sql
SELECT * FROM daily_usage WHERE rule_id = 'YOUR_RULE_ID';
```

### API Rate Limits
- **YouTube Data API:** 10,000 quota units/day
- **Instagram Graph API:** 200 calls/hour/user
- **TikTok API:** Varies by app status

Worker concurrency is configured to respect these limits.

---

## Filters

### Skip Spam
Uses OpenAI to detect:
- Promotional content
- Suspicious links
- Bot-like patterns
- Repeated characters

### Skip Negative Sentiment
Skips comments with negative sentiment (prevents engaging with trolls/haters).

### Only Verified Users
Only respond to verified/badged users (platform-dependent).

### Minimum Follower Count
Only respond to users with X+ followers (reduces spam responses).

---

## Monitoring

### BullMQ Dashboard (Optional)

Install Bull Board for visual queue monitoring:
```bash
npm install @bull-board/express @bull-board/api
```

Access at: `http://localhost:4000/admin/queues`

### Queue Status via Redis CLI

```bash
redis-cli
> KEYS bull:*
> LLEN bull:comment-poll:waiting
> LLEN bull:comment-process:active
```

---

## Troubleshooting

### Workers not processing comments

**Check Redis:**
```bash
redis-cli ping
```

**Check workers are running:**
```bash
ps aux | grep "workers/index"
```

**Check queue status:**
```bash
redis-cli
> KEYS bull:*
```

### OpenAI errors

**Verify API key:**
```bash
echo $OPENAI_API_KEY
```

**Check rate limits:**
- Free tier: 3 requests/minute
- Paid tier: Higher limits

**Fallback:** Disable AI features in rules (use KEYWORD instead of SEMANTIC)

### Platform API errors

**YouTube:**
- Ensure OAuth token is valid (reconnect in Settings)
- Check quota usage: https://console.cloud.google.com/apis/dashboard

**Instagram:**
- Verify long-lived token hasn't expired (60 days)
- Check permissions granted

### No comments detected

**Verify:**
1. Rule is `isActive: true`
2. Platform is connected
3. Video IDs are correct
4. Comments exist on those videos
5. Workers are running

**Manual test:**
```bash
curl -X POST http://localhost:4000/api/auto-reply/test/poll \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Production Deployment

### Environment Setup

1. **Redis:** Use managed Redis (Redis Cloud, AWS ElastiCache)
2. **OpenAI:** Set production API key with higher rate limits
3. **Workers:** Run as separate process/container

### Docker Example

```dockerfile
# Dockerfile.workers
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist ./dist
CMD ["node", "dist/workers/index.js"]
```

### Process Manager (PM2)

```bash
pm2 start dist/server.js --name api
pm2 start dist/workers/index.js --name workers
pm2 save
pm2 startup
```

---

## Security Considerations

1. **Never expose Redis publicly** - Use firewall/VPC
2. **Rotate OpenAI API key** regularly
3. **Monitor usage costs** - OpenAI charges per token
4. **Rate limit aggressively** - Avoid spam accusations
5. **Respect platform TOS** - Don't auto-reply too aggressively

---

## Support

**Logs location:**
- Server: Console output (configure Winston for file logging)
- Database: `auto_reply_logs` table
- Queue: Redis (use Bull Board for visual)

**Common issues:**
- See Troubleshooting section above
- Check server logs: `npm run dev` output
- Check worker logs: `npm run dev:workers` output
