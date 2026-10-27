import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { storageService } from '../../services/storage/storage.service.js';
import { pdfParserService } from '../../services/pdf/pdf-parser.service.js';
import { extractorService } from '../../services/extraction/extractor.service.js';
import { schemaValidatorService } from '../../services/validation/schema-validator.service.js';
import { ExtractionMode, ProcessingStatus, DocumentSource } from '@prisma/client';

export class DocumentsController {
  async upload(req: Request, res: Response): Promise<void> {
    try {
      const file = req.file;
      const userId = req.user!.id;
      const extractionMode = (req.body.extractionMode as ExtractionMode) || ExtractionMode.AUTO;
      const batchId = req.body.batchId || null;

      if (!file) {
        res.status(400).json({ success: false, error: 'No PDF file provided' });
        return;
      }

      // Validate file signature / header: %PDF
      const header = file.buffer.slice(0, 4).toString('ascii');
      if (!header.startsWith('%PDF')) {
        res.status(400).json({
          success: false,
          error: 'Invalid file format: File header is not a valid PDF document',
        });
        return;
      }

      // Check user active subscription and expiration
      const now = new Date();
      let activeSub = await prisma.subscription.findFirst({
        where: { userId, status: 'ACTIVE' },
        include: { plan: true },
        orderBy: { createdAt: 'desc' },
      });

      // Check if subscription has expired
      if (!activeSub || (activeSub.currentPeriodEnd && activeSub.currentPeriodEnd < now)) {
        if (activeSub && activeSub.currentPeriodEnd < now) {
          await prisma.subscription.update({
            where: { id: activeSub.id },
            data: { status: 'EXPIRED' },
          });
        }
        res.status(403).json({
          success: false,
          code: 'SUBSCRIPTION_EXPIRED',
          error: 'Your subscription has expired or is inactive. Please renew your plan or purchase a new subscription to convert documents.',
        });
        return;
      }

      const plan = activeSub.plan;

      // Check file size against plan limit
      const maxFileSizeMb = plan.maxFileSizeMb || 10;
      if (file.size > maxFileSizeMb * 1024 * 1024) {
        res.status(400).json({
          success: false,
          error: `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds your ${plan.name} plan limit of ${maxFileSizeMb}MB.`,
        });
        return;
      }

      // Check monthly quota usage in the current billing cycle
      const periodStart = activeSub.currentPeriodStart || new Date(now.getFullYear(), now.getMonth(), 1);
      const usageAgg = await prisma.usageLedger.aggregate({
        where: {
          userId,
          createdAt: { gte: periodStart },
          actionType: { in: ['SETTLE', 'RESERVE'] },
        },
        _sum: { pageCount: true },
      });

      const pagesUsed = usageAgg._sum.pageCount || 0;
      const pageQuota = plan.pageQuota;

      // If user has already exhausted their monthly quota
      if (pagesUsed >= pageQuota) {
        res.status(403).json({
          success: false,
          code: 'QUOTA_EXCEEDED',
          error: `Monthly page quota of ${pageQuota} pages reached (${pagesUsed}/${pageQuota} used). Please upgrade your plan to convert more documents.`,
          quota: {
            used: pagesUsed,
            total: pageQuota,
            remaining: 0,
            planName: plan.name,
          },
        });
        return;
      }

      // Check OCR mode permission
      if (extractionMode === ExtractionMode.OCR_SCANNED) {
        if (plan.ocrQuota <= 0) {
          res.status(403).json({
            success: false,
            code: 'OCR_NOT_ALLOWED',
            error: `OCR mode is not supported on the ${plan.name} plan. Please upgrade to Pro or Business to enable OCR for scanned documents.`,
          });
          return;
        }

        const ocrUsageAgg = await prisma.usageLedger.aggregate({
          where: {
            userId,
            isOcr: true,
            createdAt: { gte: periodStart },
          },
          _sum: { pageCount: true },
        });
        const ocrPagesUsed = ocrUsageAgg._sum.pageCount || 0;
        if (ocrPagesUsed >= plan.ocrQuota) {
          res.status(403).json({
            success: false,
            code: 'OCR_QUOTA_EXCEEDED',
            error: `OCR quota of ${plan.ocrQuota} pages reached (${ocrPagesUsed}/${plan.ocrQuota} used). Please upgrade your plan for additional OCR capacity.`,
          });
          return;
        }
      }

      // Parse PDF first to inspect page count before saving
      const startTime = Date.now();
      const parsedPdf = await pdfParserService.parseBuffer(file.buffer);

      // Verify that this PDF's pages will not exceed remaining quota
      if (pagesUsed + parsedPdf.pageCount > pageQuota) {
        res.status(403).json({
          success: false,
          code: 'QUOTA_EXCEEDED',
          error: `This document has ${parsedPdf.pageCount} page(s), but you only have ${Math.max(0, pageQuota - pagesUsed)} page(s) remaining in your ${plan.name} plan (${pagesUsed}/${pageQuota} used). Please upgrade your plan to process this file.`,
          quota: {
            used: pagesUsed,
            total: pageQuota,
            remaining: Math.max(0, pageQuota - pagesUsed),
            requested: parsedPdf.pageCount,
            planName: plan.name,
          },
        });
        return;
      }

      // Save file to storage
      const storageResult = await storageService.saveFile(file.buffer, file.originalname);

      // Create document record
      const document = await prisma.document.create({
        data: {
          userId,
          batchId,
          sourceType: DocumentSource.MANUAL_UPLOAD,
          originalFileName: file.originalname,
          mimeType: 'application/pdf',
          fileSize: BigInt(file.size),
          pageCount: parsedPdf.pageCount,
          storageKey: storageResult.key,
          extractionMode,
          status: ProcessingStatus.PROCESSING,
        },
      });

      // Run extraction
      const extraction = extractorService.extract(parsedPdf, extractionMode);
      const validation = schemaValidatorService.validate(extraction.data);

      const durationMs = Date.now() - startTime;
      const finalStatus =
        extraction.warnings.length > 0
          ? ProcessingStatus.COMPLETED_WITH_WARNINGS
          : ProcessingStatus.COMPLETED;

      // Update document
      await prisma.document.update({
        where: { id: document.id },
        data: {
          status: finalStatus,
          processingDurationMs: durationMs,
        },
      });

      // Save extraction result
      const result = await prisma.extractionResult.create({
        data: {
          documentId: document.id,
          version: 1,
          data: extraction.data,
          schemaValid: validation.isValid,
          warnings: extraction.warnings.length > 0 ? extraction.warnings : undefined,
          confidenceScore: extraction.confidenceScore,
        },
      });

      // Record usage ledger
      await prisma.usageLedger.create({
        data: {
          userId,
          documentId: document.id,
          pageCount: parsedPdf.pageCount,
          isOcr: extraction.extractionMode === ExtractionMode.OCR_SCANNED,
          actionType: 'SETTLE',
        },
      });

      // Audit log document conversion
      const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const clientAgent = (req.headers['user-agent'] as string) || 'Browser';
      await prisma.auditLog.create({
        data: {
          actorId: userId,
          actorEmail: req.user!.email,
          action: 'DOCUMENT_CONVERT',
          resource: 'Document',
          details: {
            fileName: file.originalname,
            pageCount: parsedPdf.pageCount,
            extractionMode,
            durationMs,
            status: finalStatus,
          },
          ipAddress: clientIp,
          userAgent: clientAgent,
        },
      }).catch(() => {});

      // Update batch if applicable
      if (batchId) {
        await prisma.processingBatch.update({
          where: { id: batchId },
          data: { completedCount: { increment: 1 } },
        }).catch(() => {});
      }

      res.status(201).json({
        success: true,
        message: 'PDF processed successfully',
        document: {
          ...document,
          fileSize: Number(document.fileSize),
          downloadUrl: storageResult.url,
          status: finalStatus,
          processingDurationMs: durationMs,
        },
        result: {
          id: result.id,
          version: result.version,
          data: result.data,
          schemaValid: result.schemaValid,
          warnings: result.warnings,
          confidenceScore: result.confidenceScore,
          validationErrors: validation.errors,
        },
      });
    } catch (err: any) {
      console.error('[Document Upload Error]', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const status = req.query.status as ProcessingStatus | undefined;
      const search = req.query.search as string | undefined;
      const page = parseInt((req.query.page as string) || '1', 10);
      const limit = parseInt((req.query.limit as string) || '20', 10);

      const where: any = { userId };
      if (status) where.status = status;
      if (search) {
        where.originalFileName = { contains: search, mode: 'insensitive' };
      }

      const [total, documents] = await Promise.all([
        prisma.document.count({ where }),
        prisma.document.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            results: {
              orderBy: { version: 'desc' },
              take: 1,
            },
          },
        }),
      ]);

      const formatted = documents.map((doc) => ({
        ...doc,
        fileSize: Number(doc.fileSize),
        downloadUrl: `/uploads/${doc.storageKey}`,
        latestResult: doc.results[0] || null,
      }));

      res.json({
        success: true,
        documents: formatted,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const document = await prisma.document.findFirst({
        where: { id, userId },
        include: {
          results: {
            orderBy: { version: 'desc' },
          },
        },
      });

      if (!document) {
        res.status(404).json({ success: false, error: 'Document not found' });
        return;
      }

      const downloadUrl = await storageService.getDownloadUrl(document.storageKey);

      res.json({
        success: true,
        document: {
          ...document,
          fileSize: Number(document.fileSize),
          downloadUrl,
          latestResult: document.results[0] || null,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getResult(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const document = await prisma.document.findFirst({
        where: { id, userId },
      });

      if (!document) {
        res.status(404).json({ success: false, error: 'Document not found' });
        return;
      }

      const latestResult = await prisma.extractionResult.findFirst({
        where: { documentId: id },
        orderBy: { version: 'desc' },
      });

      if (!latestResult) {
        res.status(404).json({ success: false, error: 'No extraction result found for this document' });
        return;
      }

      res.json({
        success: true,
        result: latestResult,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async updateResult(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { data, schema } = req.body;
      const userId = req.user!.id;

      const document = await prisma.document.findFirst({
        where: { id, userId },
      });

      if (!document) {
        res.status(404).json({ success: false, error: 'Document not found' });
        return;
      }

      const latestResult = await prisma.extractionResult.findFirst({
        where: { documentId: id },
        orderBy: { version: 'desc' },
      });

      const nextVersion = (latestResult?.version || 0) + 1;
      const validation = schemaValidatorService.validate(data, schema);

      const newResult = await prisma.extractionResult.create({
        data: {
          documentId: id,
          version: nextVersion,
          data,
          schemaValid: validation.isValid,
          warnings: validation.isValid ? undefined : ['Edited JSON contains schema validation issues'],
        },
      });

      // Audit log JSON modification
      const editIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const editAgent = (req.headers['user-agent'] as string) || 'Browser';
      await prisma.auditLog.create({
        data: {
          actorId: req.user!.id,
          actorEmail: req.user!.email,
          action: 'JSON_SCHEMA_EDIT',
          resource: 'ExtractionResult',
          details: { documentId: id, version: nextVersion, schemaValid: validation.isValid },
          ipAddress: editIp,
          userAgent: editAgent,
        },
      }).catch(() => {});

      res.json({
        success: true,
        message: `Saved as version ${nextVersion}`,
        result: newResult,
        validation,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async validateResult(req: Request, res: Response): Promise<void> {
    try {
      const { data, schema } = req.body;
      if (!data) {
        res.status(400).json({ success: false, error: 'Data payload is required for validation' });
        return;
      }

      const validation = schemaValidatorService.validate(data, schema);
      res.json({ success: true, validation });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async exportResult(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const format = (req.query.format as string) || 'json';
      const userId = req.user!.id;

      const document = await prisma.document.findFirst({
        where: { id, userId },
      });

      if (!document) {
        res.status(404).json({ success: false, error: 'Document not found' });
        return;
      }

      const latestResult = await prisma.extractionResult.findFirst({
        where: { documentId: id },
        orderBy: { version: 'desc' },
      });

      if (!latestResult) {
        res.status(404).json({ success: false, error: 'Extraction result not found' });
        return;
      }

      const safeBaseName = document.originalFileName.replace(/\.pdf$/i, '');

      // Audit log document export
      const expIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const expAgent = (req.headers['user-agent'] as string) || 'Browser';
      await prisma.auditLog.create({
        data: {
          actorId: req.user!.id,
          actorEmail: req.user!.email,
          action: 'DOCUMENT_EXPORT',
          resource: 'Document',
          details: { documentId: id, fileName: document.originalFileName, format },
          ipAddress: expIp,
          userAgent: expAgent,
        },
      }).catch(() => {});

      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${safeBaseName}.json"`);
        res.send(JSON.stringify(latestResult.data, null, 2));
        return;
      }

      res.status(400).json({ success: false, error: `Unsupported export format: ${format}` });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async reprocess(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const document = await prisma.document.findFirst({
        where: { id, ...(req.user!.role === 'ADMIN' || req.user!.role === 'SUPER_ADMIN' ? {} : { userId }) },
      });

      if (!document) {
        res.status(404).json({ success: false, error: 'Document not found' });
        return;
      }

      const buffer = await storageService.getFileBuffer(document.storageKey);
      const parsedPdf = await pdfParserService.parseBuffer(buffer);
      const extraction = extractorService.extract(parsedPdf, document.extractionMode);
      const validation = schemaValidatorService.validate(extraction.data);

      const latestResult = await prisma.extractionResult.findFirst({
        where: { documentId: id },
        orderBy: { version: 'desc' },
      });
      const nextVersion = (latestResult?.version || 1) + 1;

      const result = await prisma.extractionResult.create({
        data: {
          documentId: id,
          version: nextVersion,
          data: extraction.data,
          schemaValid: validation.isValid,
          warnings: extraction.warnings.length > 0 ? extraction.warnings : undefined,
          confidenceScore: extraction.confidenceScore,
        },
      });

      await prisma.document.update({
        where: { id },
        data: {
          pageCount: parsedPdf.pageCount,
          status: extraction.warnings.length > 0 ? ProcessingStatus.COMPLETED_WITH_WARNINGS : ProcessingStatus.COMPLETED,
        },
      });

      res.json({
        success: true,
        message: 'Document re-extracted successfully with all pages',
        result: {
          id: result.id,
          version: result.version,
          data: result.data,
          schemaValid: result.schemaValid,
          warnings: result.warnings,
          confidenceScore: result.confidenceScore,
          validationErrors: validation.errors,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const document = await prisma.document.findFirst({
        where: { id, userId },
      });

      if (!document) {
        res.status(404).json({ success: false, error: 'Document not found' });
        return;
      }

      // Delete physical file
      await storageService.deleteFile(document.storageKey).catch(() => {});

      // Audit log document deletion
      const delIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const delAgent = (req.headers['user-agent'] as string) || 'Browser';
      await prisma.auditLog.create({
        data: {
          actorId: req.user!.id,
          actorEmail: req.user!.email,
          action: 'DOCUMENT_DELETE',
          resource: 'Document',
          details: { documentId: id, fileName: document.originalFileName },
          ipAddress: delIp,
          userAgent: delAgent,
        },
      }).catch(() => {});

      // Delete from DB (cascades to results)
      await prisma.document.delete({ where: { id } });

      res.json({ success: true, message: 'Document deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const documentsController = new DocumentsController();
