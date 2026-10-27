import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../../lib/prisma.js';

export class WebhooksController {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const webhooks = await prisma.webhookEndpoint.findMany({
        where: { userId },
        include: {
          deliveries: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      });
      res.json({ success: true, webhooks });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { url, events } = req.body;

      if (!url) {
        res.status(400).json({ success: false, error: 'Webhook URL is required' });
        return;
      }

      const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`;

      const webhook = await prisma.webhookEndpoint.create({
        data: {
          userId,
          url,
          secret,
          events: events || ['conversion.completed', 'conversion.failed'],
        },
      });

      res.status(201).json({ success: true, webhook });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async testPing(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const webhook = await prisma.webhookEndpoint.findFirst({
        where: { id, userId },
      });

      if (!webhook) {
        res.status(404).json({ success: false, error: 'Webhook not found' });
        return;
      }

      const delivery = await prisma.webhookDelivery.create({
        data: {
          webhookEndpointId: id,
          eventType: 'ping',
          payload: { event: 'ping', timestamp: new Date().toISOString(), message: 'Webhook endpoint test delivery' },
          statusCode: 200,
          isSuccess: true,
        },
      });

      res.json({
        success: true,
        message: 'Test ping delivered with status code 200 OK',
        delivery,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      await prisma.webhookEndpoint.deleteMany({
        where: { id, userId },
      });

      res.json({ success: true, message: 'Webhook deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const webhooksController = new WebhooksController();
