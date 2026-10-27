import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { PaymentStatus, SubscriptionStatus } from '@prisma/client';

export class BillingController {
  async getPlans(req: Request, res: Response): Promise<void> {
    try {
      const plans = await prisma.plan.findMany({
        where: { isActive: true },
        orderBy: { price: 'asc' },
      });
      res.json({ success: true, plans });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getCurrentSubscription(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const now = new Date();
      let subscription = await prisma.subscription.findFirst({
        where: { userId },
        include: { plan: true },
        orderBy: { createdAt: 'desc' },
      });

      let isExpired = false;
      if (subscription) {
        if (subscription.status === SubscriptionStatus.EXPIRED || (subscription.currentPeriodEnd && subscription.currentPeriodEnd < now)) {
          if (subscription.status !== SubscriptionStatus.EXPIRED) {
            subscription = await prisma.subscription.update({
              where: { id: subscription.id },
              data: { status: SubscriptionStatus.EXPIRED },
              include: { plan: true },
            });
          }
          isExpired = true;
        }
      }

      res.json({
        success: true,
        subscription,
        isExpired,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async createCheckout(req: Request, res: Response): Promise<void> {
    try {
      const { planId } = req.body;
      const userId = req.user!.id;

      const plan = await prisma.plan.findUnique({ where: { id: planId } });
      if (!plan) {
        res.status(404).json({ success: false, error: 'Plan not found' });
        return;
      }

      // Generate order ID (Razorpay format)
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      res.json({
        success: true,
        orderId,
        amount: plan.price * 100, // in paise
        currency: plan.currency,
        planName: plan.name,
        key: 'rzp_test_public_key',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async verifyPayment(req: Request, res: Response): Promise<void> {
    try {
      const { planId, orderId, paymentId } = req.body;
      const userId = req.user!.id;

      const plan = await prisma.plan.findUnique({ where: { id: planId } });
      if (!plan) {
        res.status(404).json({ success: false, error: 'Plan not found' });
        return;
      }

      const activePaymentId = paymentId || `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const activeOrderId = orderId || `order_${Date.now()}_sim`;

      // Cancel previous active subscriptions
      await prisma.subscription.updateMany({
        where: { userId, status: SubscriptionStatus.ACTIVE },
        data: { status: SubscriptionStatus.EXPIRED },
      });

      // Create new active subscription
      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + 30);

      const subscription = await prisma.subscription.create({
        data: {
          userId,
          planId: plan.id,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date(),
          currentPeriodEnd: periodEnd,
        },
      });

      // Record payment
      const payment = await prisma.payment.create({
        data: {
          userId,
          subscriptionId: subscription.id,
          provider: 'RAZORPAY',
          orderId: activeOrderId,
          paymentId: activePaymentId,
          amount: plan.price,
          currency: plan.currency,
          status: PaymentStatus.SUCCESS,
          receiptNumber: `INV-${Date.now().toString().slice(-6)}`,
        },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          actorId: userId,
          actorEmail: req.user!.email,
          action: 'BILLING_UPGRADE',
          resource: 'Subscription',
          details: { plan: plan.name, amount: plan.price, paymentId: activePaymentId },
        },
      }).catch(() => {});

      res.json({
        success: true,
        message: `Upgraded to ${plan.name} successfully`,
        subscription,
        payment,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const payments = await prisma.payment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          subscription: {
            include: { plan: true },
          },
        },
      });

      res.json({ success: true, payments });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async cancelSubscription(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      await prisma.subscription.updateMany({
        where: { userId, status: SubscriptionStatus.ACTIVE },
        data: { cancelAtPeriodEnd: true },
      });

      res.json({
        success: true,
        message: 'Your subscription renewal has been cancelled. You retain access until the end of your billing cycle.',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const billingController = new BillingController();
