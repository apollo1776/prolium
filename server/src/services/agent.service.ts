/**
 * Agent Service
 * Core intelligence for the Prolium conversational AI agent.
 * Processes natural language instructions, manages brand memory,
 * creates tasks, and generates content using OpenAI.
 */

import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface BrandContext {
    brandName: string;
    industry: string;
    targetAudience: string;
    brandVoice: string;
    keyMessages: string[];
    prohibitedTopics: string[];
    platforms: string[];
    extraContext: string;
}

interface ConnectedPlatform {
    platform: string;
    username?: string;
}

export class AgentService {
    private openai: OpenAI | null = null;

  constructor() {
        if (process.env.OPENAI_API_KEY) {
                this.openai = new OpenAI({
                          apiKey: process.env.OPENAI_API_KEY,
                });
        } else {
                console.warn('[AgentService] OPENAI_API_KEY not set. AI features will be disabled.');
        }
  }

  private getOpenAI(): OpenAI {
        if (!this.openai) {
                throw new Error('OpenAI is not configured. Please add OPENAI_API_KEY to .env');
        }
        return this.openai;
  }

  // -- Brand Memory ----------------------------------------------------
  async getBrandMemory(userId: string): Promise<BrandContext | null> {
        const memory = await prisma.brandMemory.findUnique({ where: { userId } });
        if (!memory) return null;
        return {
                brandName: memory.brandName,
                industry: memory.industry,
                targetAudience: memory.targetAudience,
                brandVoice: memory.brandVoice,
                keyMessages: memory.keyMessages,
                prohibitedTopics: memory.prohibitedTopics,
                platforms: memory.platforms,
                extraContext: memory.extraContext,
        };
  }

  async saveBrandMemory(userId: string, data: Partial<BrandContext>): Promise<void> {
        await prisma.brandMemory.upsert({
                where: { userId },
                create: {
                          userId,
                          brandName: data.brandName || '',
                          industry: data.industry || '',
                          targetAudience: data.targetAudience || '',
                          brandVoice: data.brandVoice || '',
                          keyMessages: data.keyMessages || [],
                          prohibitedTopics: data.prohibitedTopics || [],
                          platforms: data.platforms || [],
                          extraContext: data.extraContext || '',
                },
                update: {
                          ...(data.brandName !== undefined && { brandName: data.brandName }),
                          ...(data.industry !== undefined && { industry: data.industry }),
                          ...(data.targetAudience !== undefined && { targetAudience: data.targetAudience }),
                          ...(data.brandVoice !== undefined && { brandVoice: data.brandVoice }),
                          ...(data.keyMessages !== undefined && { keyMessages: data.keyMessages }),
                          ...(data.prohibitedTopics !== undefined && { prohibitedTopics: data.prohibitedTopics }),
                          ...(data.platforms !== undefined && { platforms: data.platforms }),
                          ...(data.extraContext !== undefined && { extraContext: data.extraContext }),
                },
        });
  }

  // -- Chat Sessions ---------------------------------------------------
  async createSession(userId: string, sessionName?: string): Promise<{ id: string; sessionName: string | null }> {
        const session = await prisma.chatSession.create({
                data: {
                          userId,
                          sessionName: sessionName || null,
                          context: {},
                },
        });
        return { id: session.id, sessionName: session.sessionName };
  }

  async getSessions(userId: string): Promise<any[]> {
        return prisma.chatSession.findMany({
                where: { userId, isActive: true },
                orderBy: { lastActivityAt: 'desc' },
                select: {
                          id: true,
                          sessionName: true,
                          lastActivityAt: true,
                          createdAt: true,
                          _count: { select: { messages: true } },
                          messages: {
                                      orderBy: { timestamp: 'desc' },
                                      take: 1,
                                      select: { content: true, role: true },
                          },
                },
        });
  }

  async getSession(userId: string, sessionId: string): Promise<any> {
        return prisma.chatSession.findFirst({
                where: { id: sessionId, userId },
                include: {
                          messages: {
                                      orderBy: { timestamp: 'asc' },
                          },
                },
        });
  }

  async deleteSession(userId: string, sessionId: string): Promise<void> {
        await prisma.chatSession.updateMany({
                where: { id: sessionId, userId },
                data: { isActive: false },
        });
  }

  // -- Message Processing ----------------------------------------------
  async processMessage(
        userId: string,
        sessionId: string,
        userMessage: string,
        connectedPlatforms: ConnectedPlatform[]
      ): Promise<{ reply: string; tasks: any[]; generatedContent: any[] }> {
        const openai = this.getOpenAI();

      // Fetch brand memory
      const brandMemory = await this.getBrandMemory(userId);

      // Fetch recent messages for context (last 12)
      const recentMessages = await prisma.chatMessage.findMany({
              where: { sessionId },
              orderBy: { timestamp: 'desc' },
              take: 12,
      });
        const history = recentMessages.reverse();

      // Save user message
      await prisma.chatMessage.create({
              data: {
                        sessionId,
                        role: 'user',
                        content: userMessage,
                        messageType: 'instruction',
              },
      });

      // Build system prompt
      const platformList = connectedPlatforms
          .map(p => `${p.platform}${p.username ? ` (@${p.username})` : ''}`)
          .join(', ') || 'none connected yet';

      const hasBrand = brandMemory && brandMemory.brandName;

      const systemPrompt = `You are Prolium, an expert AI social media manager. You help creators grow their audience through intelligent content strategy, post creation, and engagement.

      ${hasBrand ? `BRAND CONTEXT:
      - Brand: ${brandMemory.brandName}
      - Industry: ${brandMemory.industry}
      - Target Audience: ${brandMemory.targetAudience}
      - Voice: ${brandMemory.brandVoice}
      - Key Messages: ${brandMemory.keyMessages.join(', ') || 'not set'}
      - Avoid: ${brandMemory.prohibitedTopics.join(', ') || 'nothing specified'}
      ${brandMemory.extraContext ? `- Additional Context: ${brandMemory.extraContext}` : ''}` : 'No brand profile set up yet. If the user describes their brand, extract and remember it.'}

      CONNECTED PLATFORMS: ${platformList}

      YOUR CAPABILITIES:
      - Generate platform-optimized social media posts (Instagram, TikTok, YouTube, X)
      - Create content calendars and posting strategies
      - Analyze performance and suggest improvements
      - Provide platform-specific advice (hashtags, best times, formats)
      - Help with brand voice and audience targeting
      - Create auto-reply rules and engagement strategies

      RESPONSE RULES:
      - Be conversational and proactive -- you're a smart assistant, not a form
      - When asked to create content, generate actual ready-to-use posts
      - Always confirm understanding before taking big actions
      - Keep responses concise but complete
      - If the user mentions their brand for the first time, acknowledge and remember it
      - When generating content, format posts clearly with platform labels

      Respond in this JSON format:
      {
        "message": "Your conversational response to the user",
          "brandUpdate": null or { "brandName": "...", "industry": "...", "targetAudience": "...", "brandVoice": "...", "keyMessages": [], "prohibitedTopics": [], "platforms": [], "extraContext": "..." },
            "tasks": [],
              "generatedContent": []
              }

              For generatedContent, use this format per post:
              { "platform": "instagram|tiktok|youtube|x", "caption": "...", "hashtags": ["..."], "bestTime": "9:00 AM", "contentType": "post|reel|story|thread", "notes": "..." }`;

      // Build conversation history for OpenAI
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
            ];

      for (const msg of history) {
              if (msg.role === 'user' || msg.role === 'assistant') {
                        messages.push({
                                    role: msg.role as 'user' | 'assistant',
                                    content: msg.content,
                        });
              }
      }

      messages.push({ role: 'user', content: userMessage });

      // Call OpenAI
      let parsed: any = null;
        let rawReply = '';

      try {
              const completion = await openai.chat.completions.create({
                        model: 'gpt-4o-mini',
                        messages,
                        response_format: { type: 'json_object' },
                        temperature: 0.7,
                        max_tokens: 2000,
              });
              rawReply = completion.choices[0]?.message?.content || '{}';
              parsed = JSON.parse(rawReply);
      } catch (err) {
              console.error('[Agent] OpenAI error:', err);
              parsed = {
                        message: "I'm having trouble connecting right now. Please try again in a moment.",
                        brandUpdate: null,
                        tasks: [],
                        generatedContent: [],
              };
      }

      const replyText = parsed.message || 'I processed your request.';
        const tasks = parsed.tasks || [];
        const generatedContent = parsed.generatedContent || [];

      // Auto-save brand memory if detected
      if (parsed.brandUpdate) {
              try {
                        await this.saveBrandMemory(userId, parsed.brandUpdate);
              } catch (err) {
                        console.error('[Agent] Failed to save brand memory:', err);
              }
      }

      // Save tasks to DB
      const savedTasks: any[] = [];
        for (const task of tasks) {
                try {
                          const saved = await prisma.agentTask.create({
                                      data: {
                                                    userId,
                                                    sessionId,
                                                    type: task.type || 'general',
                                                    status: 'planned',
                                                    instruction: userMessage,
                                                    description: task.description || task.type || 'Agent task',
                                                    assignedModule: task.module || 'content',
                                                    moduleInput: task,
                                      },
                          });
                          savedTasks.push(saved);
                } catch (err) {
                          console.error('[Agent] Failed to save task:', err);
                }
        }

      // Save agent reply to DB
      await prisma.chatMessage.create({
              data: {
                        sessionId,
                        role: 'agent',
                        content: replyText,
                        messageType: 'text',
                        agentContext: {
                                    tasks: savedTasks.map(t => t.id),
                                    generatedContent: generatedContent.length,
                                    brandUpdated: !!parsed.brandUpdate,
                        },
              },
      });

      // Update session activity + name if first message
      const messageCount = await prisma.chatMessage.count({ where: { sessionId } });
        const sessionUpdate: any = { lastActivityAt: new Date() };
        if (messageCount <= 2) {
                const name = userMessage.length > 40 ? userMessage.substring(0, 40) + '...' : userMessage;
                sessionUpdate.sessionName = name;
        }
        await prisma.chatSession.update({ where: { id: sessionId }, data: sessionUpdate });

      return { reply: replyText, tasks: savedTasks, generatedContent };
  }

  // -- Agent Tasks -----------------------------------------------------
  async getTasks(userId: string): Promise<any[]> {
        return prisma.agentTask.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 50,
        });
  }

  async updateTaskStatus(userId: string, taskId: string, status: string, output?: any): Promise<void> {
        await prisma.agentTask.updateMany({
                where: { id: taskId, userId },
                data: {
                          status,
                          ...(output && { moduleOutput: output }),
                          ...(status === 'completed' && { completedAt: new Date() }),
                },
        });
  }

  // -- Content Generation ----------------------------------------------
  async generateContentBatch(
        userId: string,
        request: {
                topic: string;
                platforms: string[];
                quantity: number;
                contentType?: string;
                additionalInstructions?: string;
        }
      ): Promise<any[]> {
        const openai = this.getOpenAI();
        const brandMemory = await this.getBrandMemory(userId);
        const brandContext = brandMemory
          ? `Brand: ${brandMemory.brandName}, Industry: ${brandMemory.industry}, Audience: ${brandMemory.targetAudience}, Voice: ${brandMemory.brandVoice}`
                : 'No brand profile set.';

      const prompt = `Create ${request.quantity} social media posts about "${request.topic}" for these platforms: ${request.platforms.join(', ')}.

      Brand context: ${brandContext}
      ${request.additionalInstructions ? `Additional instructions: ${request.additionalInstructions}` : ''}

      Return a JSON array of posts with this structure:
      [{ "platform": "instagram|tiktok|youtube|x", "caption": "Full post caption", "hashtags": ["tag1", "tag2"], "bestTime": "e.g. 9:00 AM", "contentType": "post|reel|story|thread|video", "notes": "Visual/production notes", "estimatedEngagement": "high|medium|low" }]

      Make the content authentic, platform-native, and aligned with the brand voice. Include emojis naturally.`;

      try {
              const completion = await openai.chat.completions.create({
                        model: 'gpt-4o-mini',
                        messages: [
                          { role: 'system', content: 'You are an expert social media content creator. Respond only with valid JSON.' },
                          { role: 'user', content: prompt },
                                  ],
                        response_format: { type: 'json_object' },
                        temperature: 0.8,
                        max_tokens: 3000,
              });
              const raw = completion.choices[0]?.message?.content || '{"posts":[]}';
              const parsed = JSON.parse(raw);
              return Array.isArray(parsed) ? parsed : (parsed.posts || parsed.content || []);
      } catch (err) {
              console.error('[Agent] Content generation error:', err);
              return [];
      }
  }
}

export const agentService = new AgentService();
