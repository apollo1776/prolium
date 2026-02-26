-- CreateEnum
CREATE TYPE "TriggerType" AS ENUM ('KEYWORD', 'SEMANTIC', 'SENTIMENT', 'QUESTION', 'MENTION');

-- CreateEnum
CREATE TYPE "MatchMode" AS ENUM ('EXACT', 'CONTAINS', 'STARTS_WITH', 'REGEX', 'AI_SIMILARITY');

-- CreateEnum
CREATE TYPE "ResponseAction" AS ENUM ('REPLY_COMMENT', 'SEND_DM', 'SEND_LINK', 'LOG_ONLY', 'WEBHOOK');

-- CreateTable
CREATE TABLE "auto_reply_rules" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "triggerType" "TriggerType" NOT NULL DEFAULT 'KEYWORD',
    "keywords" TEXT[],
    "matchMode" "MatchMode" NOT NULL DEFAULT 'CONTAINS',
    "caseSensitive" BOOLEAN NOT NULL DEFAULT false,
    "aiSimilarityThreshold" DOUBLE PRECISION DEFAULT 0.8,
    "platforms" "Platform"[],
    "videoIds" TEXT[],
    "responseAction" "ResponseAction" NOT NULL DEFAULT 'REPLY_COMMENT',
    "responseTemplate" TEXT NOT NULL,
    "customLink" TEXT,
    "attachmentUrl" TEXT,
    "maxResponsesPerDay" INTEGER NOT NULL DEFAULT 100,
    "minDelaySeconds" INTEGER NOT NULL DEFAULT 30,
    "maxDelaySeconds" INTEGER NOT NULL DEFAULT 120,
    "skipNegativeSentiment" BOOLEAN NOT NULL DEFAULT true,
    "skipSpam" BOOLEAN NOT NULL DEFAULT true,
    "onlyVerifiedUsers" BOOLEAN NOT NULL DEFAULT false,
    "minFollowerCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auto_reply_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auto_reply_logs" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "videoId" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "commentText" TEXT NOT NULL,
    "commentAuthor" TEXT NOT NULL,
    "commentAuthorId" TEXT NOT NULL,
    "matchedKeyword" TEXT,
    "aiConfidenceScore" DOUBLE PRECISION,
    "sentimentScore" DOUBLE PRECISION,
    "responseAction" "ResponseAction" NOT NULL,
    "responseSent" BOOLEAN NOT NULL DEFAULT false,
    "responseText" TEXT,
    "responseId" TEXT,
    "errorMessage" TEXT,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "auto_reply_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processed_comments" (
    "id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "commentId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_usage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "responsesCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "daily_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auto_reply_rules_userId_isActive_idx" ON "auto_reply_rules"("userId", "isActive");

-- CreateIndex
CREATE INDEX "auto_reply_logs_ruleId_triggeredAt_idx" ON "auto_reply_logs"("ruleId", "triggeredAt");

-- CreateIndex
CREATE INDEX "auto_reply_logs_platform_videoId_idx" ON "auto_reply_logs"("platform", "videoId");

-- CreateIndex
CREATE UNIQUE INDEX "processed_comments_commentId_key" ON "processed_comments"("commentId");

-- CreateIndex
CREATE INDEX "processed_comments_platform_videoId_idx" ON "processed_comments"("platform", "videoId");

-- CreateIndex
CREATE INDEX "daily_usage_userId_date_idx" ON "daily_usage"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_usage_ruleId_date_key" ON "daily_usage"("ruleId", "date");

-- AddForeignKey
ALTER TABLE "auto_reply_rules" ADD CONSTRAINT "auto_reply_rules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auto_reply_logs" ADD CONSTRAINT "auto_reply_logs_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "auto_reply_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
