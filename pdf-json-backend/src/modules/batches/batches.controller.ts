import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { ProcessingStatus } from '@prisma/client';

export class BatchesController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, totalDocuments } = req.body;
      const userId = req.user!.id;

      const batch = await prisma.processingBatch.create({
        data: {
          userId,
          name: name || `Batch ${new Date().toLocaleDateString()}`,
          totalDocuments: totalDocuments || 0,
          status: ProcessingStatus.PROCESSING,
        },
      });

      res.status(201).json({ success: true, batch });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const batches = await prisma.processingBatch.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          documents: {
            select: {
              id: true,
              originalFileName: true,
              status: true,
              pageCount: true,
            },
          },
        },
      });

      res.json({ success: true, batches });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const batch = await prisma.processingBatch.findFirst({
        where: { id, userId },
        include: {
          documents: {
            include: {
              results: {
                orderBy: { version: 'desc' },
                take: 1,
              },
            },
          },
        },
      });

      if (!batch) {
        res.status(404).json({ success: false, error: 'Batch not found' });
        return;
      }

      const formatted = {
        ...batch,
        documents: batch.documents.map((d) => ({
          ...d,
          fileSize: Number(d.fileSize),
          latestResult: d.results[0] || null,
        })),
      };

      res.json({ success: true, batch: formatted });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async exportBatch(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const batch = await prisma.processingBatch.findFirst({
        where: { id, userId },
        include: {
          documents: {
            include: {
              results: {
                orderBy: { version: 'desc' },
                take: 1,
              },
            },
          },
        },
      });

      if (!batch) {
        res.status(404).json({ success: false, error: 'Batch not found' });
        return;
      }

      const combinedResults = batch.documents.map((doc) => ({
        documentId: doc.id,
        fileName: doc.originalFileName,
        status: doc.status,
        data: doc.results[0]?.data || null,
      }));

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="batch_${batch.id}_export.json"`);
      res.send(JSON.stringify(combinedResults, null, 2));
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const batchesController = new BatchesController();
