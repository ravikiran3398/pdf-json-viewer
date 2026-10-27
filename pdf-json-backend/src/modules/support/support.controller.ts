import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { TicketPriority, TicketStatus } from '@prisma/client';

export class SupportController {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const tickets = await prisma.supportTicket.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });
      res.json({ success: true, tickets });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { subject, category, priority, message } = req.body;

      if (!subject || !message) {
        res.status(400).json({ success: false, error: 'Subject and message are required' });
        return;
      }

      const ticket = await prisma.supportTicket.create({
        data: {
          userId,
          subject,
          category: category || 'TECHNICAL',
          priority: (priority as TicketPriority) || TicketPriority.MEDIUM,
          status: TicketStatus.OPEN,
          messages: [
            {
              sender: 'USER',
              senderEmail: req.user!.email,
              message,
              createdAt: new Date().toISOString(),
            },
          ],
        },
      });

      res.status(201).json({ success: true, ticket });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const ticket = await prisma.supportTicket.findFirst({
        where: { id, userId },
      });

      if (!ticket) {
        res.status(404).json({ success: false, error: 'Ticket not found' });
        return;
      }

      res.json({ success: true, ticket });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async addReply(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { message } = req.body;
      const userId = req.user!.id;

      if (!message) {
        res.status(400).json({ success: false, error: 'Message is required' });
        return;
      }

      const ticket = await prisma.supportTicket.findFirst({
        where: { id, userId },
      });

      if (!ticket) {
        res.status(404).json({ success: false, error: 'Ticket not found' });
        return;
      }

      const existingMessages = (ticket.messages as any[]) || [];
      const updatedMessages = [
        ...existingMessages,
        {
          sender: 'USER',
          senderEmail: req.user!.email,
          message,
          createdAt: new Date().toISOString(),
        },
      ];

      const updated = await prisma.supportTicket.update({
        where: { id },
        data: {
          messages: updatedMessages,
          status: TicketStatus.OPEN,
        },
      });

      res.json({ success: true, ticket: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const supportController = new SupportController();
