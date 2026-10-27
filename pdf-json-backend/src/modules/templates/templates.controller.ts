import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';

export class TemplatesController {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const templates = await prisma.extractionTemplate.findMany({
        where: {
          OR: [{ isSystem: true }, { userId }],
        },
        orderBy: [{ isSystem: 'desc' }, { createdAt: 'desc' }],
      });
      res.json({ success: true, templates });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { name, description, schema, sampleFields } = req.body;

      if (!name || !schema) {
        res.status(400).json({ success: false, error: 'Name and schema are required' });
        return;
      }

      const template = await prisma.extractionTemplate.create({
        data: {
          userId,
          name,
          description,
          schema,
          sampleFields,
          isSystem: false,
        },
      });

      res.status(201).json({ success: true, template });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const template = await prisma.extractionTemplate.findFirst({
        where: {
          id,
          OR: [{ isSystem: true }, { userId }],
        },
      });

      if (!template) {
        res.status(404).json({ success: false, error: 'Template not found' });
        return;
      }

      res.json({ success: true, template });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { name, description, schema, sampleFields } = req.body;

      const existing = await prisma.extractionTemplate.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        res.status(404).json({ success: false, error: 'Template not found or not editable' });
        return;
      }

      const updated = await prisma.extractionTemplate.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(schema && { schema }),
          ...(sampleFields !== undefined && { sampleFields }),
        },
      });

      res.json({ success: true, template: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const existing = await prisma.extractionTemplate.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        res.status(404).json({ success: false, error: 'Template not found or cannot be deleted' });
        return;
      }

      await prisma.extractionTemplate.delete({ where: { id } });
      res.json({ success: true, message: 'Template deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const templatesController = new TemplatesController();
