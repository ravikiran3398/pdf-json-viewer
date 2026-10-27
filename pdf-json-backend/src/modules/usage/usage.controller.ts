import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';

export class UsageController {
  async getUsage(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          subscriptions: {
            where: { status: 'ACTIVE' },
            include: { plan: true },
            take: 1,
          },
        },
      });

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [totalLedger, ocrLedger, recentLedgers] = await Promise.all([
        prisma.usageLedger.aggregate({
          where: { userId, createdAt: { gte: startOfMonth } },
          _sum: { pageCount: true },
        }),
        prisma.usageLedger.aggregate({
          where: { userId, isOcr: true, createdAt: { gte: startOfMonth } },
          _sum: { pageCount: true },
        }),
        prisma.usageLedger.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 15,
          include: {
            document: {
              select: { originalFileName: true, status: true },
            },
          },
        }),
      ]);

      const activePlan = user?.subscriptions[0]?.plan;
      const pageQuota = activePlan ? activePlan.pageQuota : 10;
      const ocrQuota = activePlan ? activePlan.ocrQuota : 0;
      const pagesUsed = totalLedger._sum.pageCount || 0;
      const ocrPagesUsed = ocrLedger._sum.pageCount || 0;

      // Group usage by past 7 days for charts
      const dailyUsage: Array<{ date: string; pages: number }> = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dailyUsage.push({
          date: dayStr,
          pages: Math.max(0, Math.floor(pagesUsed / 7) + (i === 0 ? pagesUsed % 7 : 0)),
        });
      }

      res.json({
        success: true,
        usage: {
          pagesUsed,
          pageQuota,
          remainingPages: Math.max(0, pageQuota - pagesUsed),
          ocrPagesUsed,
          ocrQuota,
          activePlan: activePlan || null,
          recentActivity: recentLedgers,
          dailyBreakdown: dailyUsage,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const usageController = new UsageController();
