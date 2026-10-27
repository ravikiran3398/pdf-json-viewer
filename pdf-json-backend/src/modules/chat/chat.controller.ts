import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';

export class ChatController {
  // User gets their own chat history
  async getUserMessages(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      let messages = await prisma.liveChatMessage.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      });

      // If user has no messages, initialize with automated welcome message
      if (messages.length === 0) {
        const welcome = await prisma.liveChatMessage.create({
          data: {
            userId,
            userEmail: req.user!.email,
            userName: req.user!.email.split('@')[0],
            sender: 'BOT',
            message: 'Hello! Welcome to DocuParse Customer Care. Need help with PDF conversions, quota resets, or custom schema mapping? Send us a message and our support engineers will assist you.',
          },
        });
        messages = [welcome];
      }

      res.json({ success: true, messages });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // User sends a message
  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { message } = req.body;

      if (!message || !message.trim()) {
        res.status(400).json({ success: false, error: 'Message cannot be empty' });
        return;
      }

      const userMsg = await prisma.liveChatMessage.create({
        data: {
          userId,
          userEmail: req.user!.email,
          userName: req.user!.email.split('@')[0],
          sender: 'USER',
          message: message.trim(),
        },
      });

      // Log in audit trail
      await prisma.auditLog.create({
        data: {
          actorId: userId,
          actorEmail: req.user!.email,
          action: 'SUPPORT_CHAT_SENT',
          resource: 'LiveChat',
          details: { messagePreview: message.slice(0, 80) },
          ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
          userAgent: req.headers['user-agent'] || 'Browser',
        },
      }).catch(() => {});

      // Intelligent Bot Auto-Responder for common queries
      const lower = message.toLowerCase();
      let autoReply: string | null = null;

      if (lower.includes('quota') || lower.includes('10 pages') || lower.includes('limit')) {
        autoReply = 'Free accounts include 10 pages per month. If you need more capacity, you can upgrade to Starter (500 pages) or Pro (3,000 pages) from the Billing section. Our support engineers have also received your message.';
      } else if (lower.includes('expire') || lower.includes('buy again') || lower.includes('renew')) {
        autoReply = 'If your plan is expired, you can click "Buy Again" in the Billing page to immediately restore conversion capacity with a fresh 30-day quota.';
      } else if (lower.includes('ocr') || lower.includes('scanned') || lower.includes('image')) {
        autoReply = 'Scanned and image-based PDFs require OCR mode, which is enabled on Pro and Business tiers. Vector text PDFs convert instantly under 400ms on all plans.';
      }

      if (autoReply) {
        await prisma.liveChatMessage.create({
          data: {
            userId,
            userEmail: req.user!.email,
            userName: 'Customer Support Bot',
            sender: 'BOT',
            message: autoReply,
          },
        });
      }

      const allMessages = await prisma.liveChatMessage.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      });

      res.json({ success: true, messages: allMessages });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // Admin gets all user conversations
  async getAdminConversations(req: Request, res: Response): Promise<void> {
    try {
      const messages = await prisma.liveChatMessage.findMany({
        orderBy: { createdAt: 'desc' },
      });

      const convMap = new Map<string, {
        userId: string;
        userEmail: string;
        userName: string | null;
        lastMessage: string;
        lastMessageAt: Date;
        unreadCount: number;
        totalMessages: number;
      }>();

      for (const m of messages) {
        if (!convMap.has(m.userId)) {
          convMap.set(m.userId, {
            userId: m.userId,
            userEmail: m.userEmail,
            userName: m.userName,
            lastMessage: m.message,
            lastMessageAt: m.createdAt,
            unreadCount: m.sender === 'USER' && !m.isRead ? 1 : 0,
            totalMessages: 1,
          });
        } else {
          const c = convMap.get(m.userId)!;
          c.totalMessages += 1;
          if (m.sender === 'USER' && !m.isRead) {
            c.unreadCount += 1;
          }
        }
      }

      res.json({
        success: true,
        conversations: Array.from(convMap.values()),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // Admin gets messages for a specific user
  async getAdminUserMessages(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const messages = await prisma.liveChatMessage.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      });

      // Mark user messages as read
      await prisma.liveChatMessage.updateMany({
        where: { userId, sender: 'USER', isRead: false },
        data: { isRead: true },
      });

      res.json({ success: true, messages });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // Admin sends reply to user
  async sendAdminReply(req: Request, res: Response): Promise<void> {
    try {
      const { userId, message } = req.body;
      const adminEmail = req.user!.email;

      if (!userId || !message || !message.trim()) {
        res.status(400).json({ success: false, error: 'User ID and message are required' });
        return;
      }

      const targetUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!targetUser) {
        res.status(404).json({ success: false, error: 'Target user not found' });
        return;
      }

      const adminMsg = await prisma.liveChatMessage.create({
        data: {
          userId,
          userEmail: targetUser.email,
          userName: `Support (${adminEmail})`,
          sender: 'ADMIN',
          message: message.trim(),
        },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          actorId: req.user!.id,
          actorEmail: adminEmail,
          action: 'ADMIN_CHAT_REPLY',
          resource: 'LiveChat',
          details: { targetUserId: userId, targetEmail: targetUser.email, message: message.slice(0, 80) },
          ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
          userAgent: req.headers['user-agent'] || 'Browser',
        },
      }).catch(() => {});

      const messages = await prisma.liveChatMessage.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      });

      res.json({ success: true, message: adminMsg, messages });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const chatController = new ChatController();
