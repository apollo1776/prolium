/**
 * Agent Controller
 * Handles HTTP requests for the conversational AI agent.
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { agentService } from '../services/agent.service';

const prisma = new PrismaClient();

export const agentController = {

  // ── Sessions ──────────────────────────────────────────────────

  async createSession(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const { sessionName } = req.body;
      const session = await agentService.createSession(userId, sessionName);
      res.json({ session });
    } catch (err: any) {
      console.error('[Agent] createSession error:', err);
      res.status(500).json({ error: 'Failed to create session' });
    }
  },

  async getSessions(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const sessions = await agentService.getSessions(userId);
      res.json({ sessions });
    } catch (err: any) {
      console.error('[Agent] getSessions error:', err);
      res.status(500).json({ error: 'Failed to get sessions' });
    }
  },

  async getSession(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const { id } = req.params;
      const session = await agentService.getSession(userId, id);
      if (!session) return res.status(404).json({ error: 'Session not found' });
      res.json({ session });
    } catch (err: any) {
      console.error('[Agent] getSession error:', err);
      res.status(500).json({ error: 'Failed to get session' });
    }
  },

  async deleteSession(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const { id } = req.params;
      await agentService.deleteSession(userId, id);
      res.json({ success: true });
    } catch (err: any) {
      console.error('[Agent] deleteSession error:', err);
      res.status(500).json({ error: 'Failed to delete session' });
    }
  },

  // ── Messages ──────────────────────────────────────────────────

  async sendMessage(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const { sessionId, message } = req.body;

      if (!sessionId || !message?.trim()) {
        return res.status(400).json({ error: 'sessionId and message are required' });
      }

      // Verify session belongs to user
      const session = await prisma.chatSession.findFirst({
        where: { id: sessionId, userId },
      });
      if (!session) return res.status(404).json({ error: 'Session not found' });

      // Get connected platforms for context
      const connections = await prisma.platformConnection.findMany({
        where: { userId, isActive: true },
        select: { platform: true, platformUsername: true },
      });
      const connectedPlatforms = connections.map(c => ({
        platform: c.platform,
        username: c.platformUsername || undefined,
      }));

      const result = await agentService.processMessage(
        userId,
        sessionId,
        message.trim(),
        connectedPlatforms
      );

      res.json(result);
    } catch (err: any) {
      console.error('[Agent] sendMessage error:', err);
      res.status(500).json({ error: 'Failed to process message' });
    }
  },

  // ── Tasks ─────────────────────────────────────────────────────

  async getTasks(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const tasks = await agentService.getTasks(userId);
      res.json({ tasks });
    } catch (err: any) {
      console.error('[Agent] getTasks error:', err);
      res.status(500).json({ error: 'Failed to get tasks' });
    }
  },

  // ── Brand Memory ──────────────────────────────────────────────

  async getBrandMemory(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const memory = await agentService.getBrandMemory(userId);
      res.json({ memory });
    } catch (err: any) {
      console.error('[Agent] getBrandMemory error:', err);
      res.status(500).json({ error: 'Failed to get brand memory' });
    }
  },

  async updateBrandMemory(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const data = req.body;
      await agentService.saveBrandMemory(userId, data);
      res.json({ success: true });
    } catch (err: any) {
      console.error('[Agent] updateBrandMemory error:', err);
      res.status(500).json({ error: 'Failed to update brand memory' });
    }
  },

  // ── Content Generation ────────────────────────────────────────

  async generateContent(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const { topic, platforms, quantity, contentType, additionalInstructions } = req.body;

      if (!topic || !platforms?.length) {
        return res.status(400).json({ error: 'topic and platforms are required' });
      }

      const content = await agentService.generateContentBatch(userId, {
        topic,
        platforms,
        quantity: Math.min(quantity || 3, 10),
        contentType,
        additionalInstructions,
      });

      res.json({ content });
    } catch (err: any) {
      console.error('[Agent] generateContent error:', err);
      res.status(500).json({ error: 'Failed to generate content' });
    }
  },

  // ── Agent Status ──────────────────────────────────────────────

  async getStatus(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const [pendingTasks, totalSessions, brandMemory] = await Promise.all([
        prisma.agentTask.count({ where: { userId, status: { in: ['planned', 'in_progress'] } } }),
        prisma.chatSession.count({ where: { userId, isActive: true } }),
        agentService.getBrandMemory(userId),
      ]);

      res.json({
        status: 'active',
        pendingTasks,
        totalSessions,
        hasBrandMemory: !!brandMemory?.brandName,
        brandName: brandMemory?.brandName || null,
      });
    } catch (err: any) {
      console.error('[Agent] getStatus error:', err);
      res.status(500).json({ error: 'Failed to get status' });
    }
  },
};
