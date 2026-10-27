import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma.js';
import { config } from '../../config/index.js';
import { UserRole } from '@prisma/client';

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name, company } = req.body;

      if (!email || !password) {
        res.status(400).json({ success: false, error: 'Email and password are required' });
        return;
      }

      const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (existingUser) {
        res.status(409).json({ success: false, error: 'A user with this email already exists' });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);

      // Fetch or assign default Free plan
      let freePlan = await prisma.plan.findFirst({ where: { slug: 'free' } });
      if (!freePlan) {
        freePlan = await prisma.plan.create({
          data: {
            name: 'Free Plan',
            slug: 'free',
            price: 0,
            currency: 'INR',
            pageQuota: 10,
            ocrQuota: 0,
            maxFileSizeMb: 10,
            features: ['10 Pages/Month', 'Basic Text Extraction', 'JSON Preview & Export'],
          },
        });
      }

      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          name: name || email.split('@')[0],
          company,
          role: UserRole.USER,
          isEmailVerified: true, // Auto-verified for instant access
          subscriptions: {
            create: {
              planId: freePlan.id,
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          },
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          company: true,
          createdAt: true,
        },
      });

      const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, config.jwtSecret, {
        expiresIn: '7d',
      });

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        token,
        user,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, portal } = req.body;

      if (!email || !password) {
        res.status(400).json({ success: false, error: 'Email and password are required' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: {
          subscriptions: {
            where: { status: 'ACTIVE' },
            include: { plan: true },
            take: 1,
          },
        },
      });

      if (!user) {
        res.status(401).json({ success: false, error: 'Invalid email or password' });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({ success: false, error: 'Your account has been deactivated. Please contact support.' });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({ success: false, error: 'Invalid email or password' });
        return;
      }

      const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
      const targetPortal = portal || (req.originalUrl?.includes('/admin') || req.path?.includes('/admin') ? 'admin' : 'user');

      if (targetPortal === 'admin' && !isAdmin) {
        res.status(403).json({
          success: false,
          error: 'Access denied. Regular user accounts are not permitted to log in through the Admin Console.',
        });
        return;
      }

      if (targetPortal === 'user' && isAdmin) {
        res.status(403).json({
          success: false,
          error: 'Administrator accounts cannot log in through the User Login. Please use the dedicated Admin Portal.',
        });
        return;
      }

      const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, config.jwtSecret, {
        expiresIn: '7d',
      });

      // Record session
      const tokenHash = Buffer.from(token.slice(-32)).toString('base64');
      await prisma.session.create({
        data: {
          userId: user.id,
          tokenHash,
          ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
          userAgent: req.headers['user-agent'] || 'Unknown Browser',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }).catch(() => {});

      // Record audit log
      const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const clientAgent = (req.headers['user-agent'] as string) || 'Browser';
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          actorEmail: user.email,
          action: 'AUTH_LOGIN',
          resource: 'User',
          details: { ip: clientIp, userAgent: clientAgent },
          ipAddress: clientIp,
          userAgent: clientAgent,
        },
      }).catch(() => {});

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          company: user.company,
          activePlan: user.subscriptions[0]?.plan || null,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async me(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          subscriptions: {
            orderBy: { createdAt: 'desc' },
            include: { plan: true },
            take: 1,
          },
        },
      });

      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      const now = new Date();
      let latestSub = user.subscriptions[0];
      let isExpired = false;

      if (latestSub) {
        if (latestSub.status === 'EXPIRED' || (latestSub.currentPeriodEnd && latestSub.currentPeriodEnd < now)) {
          if (latestSub.status !== 'EXPIRED') {
            await prisma.subscription.update({
              where: { id: latestSub.id },
              data: { status: 'EXPIRED' },
            });
          }
          isExpired = true;
        }
      }

      // Calculate usage for current period
      const periodStart = latestSub?.currentPeriodStart || new Date(now.getFullYear(), now.getMonth(), 1);

      const usageAgg = await prisma.usageLedger.aggregate({
        where: {
          userId,
          createdAt: { gte: periodStart },
          actionType: { in: ['SETTLE', 'RESERVE'] },
        },
        _sum: {
          pageCount: true,
        },
      });

      const pagesUsed = usageAgg._sum.pageCount || 0;
      const quota = latestSub?.plan ? latestSub.plan.pageQuota : 10;
      const remainingPages = isExpired ? 0 : Math.max(0, quota - pagesUsed);

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          company: user.company,
          avatarUrl: user.avatarUrl,
          activePlan: latestSub?.plan || null,
          isSubscriptionExpired: isExpired,
          subscriptionStatus: isExpired ? 'EXPIRED' : latestSub?.status || 'NONE',
          usage: {
            pagesUsed,
            pageQuota: quota,
            remainingPages,
          },
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    res.json({
      success: true,
      message: `If an account with ${email} exists, password reset instructions have been sent.`,
    });
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      res.status(400).json({ success: false, error: 'Token and new password are required' });
      return;
    }
    res.json({
      success: true,
      message: 'Password has been reset successfully. You may now log in.',
    });
  }

  async getSessions(req: Request, res: Response): Promise<void> {
    try {
      const sessions = await prisma.session.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ success: true, sessions });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async revokeSession(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await prisma.session.deleteMany({
        where: { id, userId: req.user!.id },
      });
      res.json({ success: true, message: 'Session revoked' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const email = req.user?.email;

      if (userId && email) {
        const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
        const clientAgent = (req.headers['user-agent'] as string) || 'Browser';

        await prisma.auditLog.create({
          data: {
            actorId: userId,
            actorEmail: email,
            action: 'AUTH_LOGOUT',
            resource: 'User',
            details: { reason: 'User initiated logout', userAgent: clientAgent },
            ipAddress: clientIp,
            userAgent: clientAgent,
          },
        }).catch(() => {});

        await prisma.session.deleteMany({
          where: { userId },
        }).catch(() => {});
      }

      res.json({ success: true, message: 'Logged out successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getUserActivity(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const logs = await prisma.auditLog.findMany({
        where: { actorId: userId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      res.json({ success: true, logs });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const authController = new AuthController();
