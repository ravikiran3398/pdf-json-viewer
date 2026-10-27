import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../../lib/prisma.js';

export class ApiKeysController {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const keys = await prisma.apiKey.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          label: true,
          keyPrefix: true,
          scopes: true,
          lastUsedAt: true,
          isRevoked: true,
          createdAt: true,
        },
      });
      res.json({ success: true, keys });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { label, scopes } = req.body;

      if (!label) {
        res.status(400).json({ success: false, error: 'Label is required' });
        return;
      }

      const randomBytes = crypto.randomBytes(24).toString('hex');
      const plainKey = `pk_live_${randomBytes}`;
      const keyPrefix = `pk_live_${randomBytes.substring(0, 4)}...${randomBytes.substring(randomBytes.length - 4)}`;
      const keyHash = crypto.createHash('sha256').update(plainKey).digest('hex');

      const apiKey = await prisma.apiKey.create({
        data: {
          userId,
          label,
          keyPrefix,
          keyHash,
          scopes: scopes || ['documents.read', 'documents.write', 'extract.read'],
        },
      });

      res.status(201).json({
        success: true,
        message: 'API Key generated. Copy this key now as it will never be displayed again.',
        apiKey: {
          id: apiKey.id,
          label: apiKey.label,
          keyPrefix: apiKey.keyPrefix,
          plainKey,
          scopes: apiKey.scopes,
          createdAt: apiKey.createdAt,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async revoke(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      await prisma.apiKey.updateMany({
        where: { id, userId },
        data: { isRevoked: true },
      });

      res.json({ success: true, message: 'API key revoked successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const apiKeysController = new ApiKeysController();
