import process from 'node:process';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log('🧹 Cleaning all mock and test data from database...');

  // Delete all child tables
  await prisma.liveChatMessage.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.enterpriseEnquiry.deleteMany();
  await prisma.webhookDelivery.deleteMany();
  await prisma.webhookEndpoint.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.usageLedger.deleteMany();
  await prisma.processingJob.deleteMany();
  await prisma.extractionResult.deleteMany();
  await prisma.document.deleteMany();
  await prisma.processingBatch.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.session.deleteMany();

  // Keep ONLY the two required accounts:
  // 1. Super Admin: ravikiran.mec666@gmail.com
  // 2. User: user@pdfjson.com
  const keptEmails = ['ravikiran.mec666@gmail.com', 'user@pdfjson.com'];

  await prisma.subscription.deleteMany({
    where: {
      user: {
        email: { notIn: keptEmails }
      }
    }
  });

  const deletedUsers = await prisma.user.deleteMany({
    where: {
      email: { notIn: keptEmails }
    }
  });
  console.log(`Deleted ${deletedUsers.count} mock/test users.`);

  // Ensure Plans exist
  const freePlan = await prisma.plan.upsert({
    where: { slug: 'free' },
    update: { isActive: true },
    create: {
      name: 'Free',
      slug: 'free',
      price: 0,
      currency: 'INR',
      billingPeriod: 'monthly',
      pageQuota: 10,
      ocrQuota: 0,
      maxFileSizeMb: 5,
      features: [
        '10 pages per month',
        'Basic text extraction',
        'JSON live preview & Monaco editor',
        'Direct JSON download',
        'Standard community support',
      ],
    },
  });

  const starterPlan = await prisma.plan.upsert({
    where: { slug: 'starter' },
    update: { isActive: true },
    create: {
      name: 'Starter',
      slug: 'starter',
      price: 299,
      currency: 'INR',
      billingPeriod: 'monthly',
      pageQuota: 500,
      ocrQuota: 50,
      maxFileSizeMb: 15,
      features: [
        '500 pages per month',
        'Full document history & editing',
        'JSON Schema validation',
        'Batch upload (up to 10 files)',
        'Email support',
      ],
    },
  });

  const proPlan = await prisma.plan.upsert({
    where: { slug: 'pro' },
    update: { isActive: true },
    create: {
      name: 'Pro',
      slug: 'pro',
      price: 799,
      currency: 'INR',
      billingPeriod: 'monthly',
      pageQuota: 3000,
      ocrQuota: 500,
      maxFileSizeMb: 30,
      features: [
        '3,000 pages per month',
        'Custom extraction templates',
        'OCR engine for scanned PDFs',
        'REST API access & personal keys',
        'ZIP & combined batch export',
        'Priority support',
      ],
    },
  });

  const businessPlan = await prisma.plan.upsert({
    where: { slug: 'business' },
    update: { isActive: true },
    create: {
      name: 'Business',
      slug: 'business',
      price: 1999,
      currency: 'INR',
      billingPeriod: 'monthly',
      pageQuota: 10000,
      ocrQuota: 2500,
      maxFileSizeMb: 50,
      features: [
        '10,000 pages per month',
        'Unlimited custom templates',
        'Real-time webhooks & event logs',
        'Multi-user workspace & audit trail',
        'High-concurrency queues',
        'Dedicated account manager',
      ],
    },
  });

  // Ensure Admin account exists with fresh active subscription
  const adminPasswordHash = await bcrypt.hash('Admin@12345', 10);
  const userPasswordHash = await bcrypt.hash('User@12345', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'ravikiran.mec666@gmail.com' },
    update: {
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      passwordHash: adminPasswordHash,
      name: 'Ravikiran (Super Admin)',
      company: 'PDF-to-JSON Platform Inc.',
    },
    create: {
      email: 'ravikiran.mec666@gmail.com',
      passwordHash: adminPasswordHash,
      name: 'Ravikiran (Super Admin)',
      role: UserRole.SUPER_ADMIN,
      company: 'PDF-to-JSON Platform Inc.',
      isEmailVerified: true,
    },
  });

  // Refresh admin subscription
  await prisma.subscription.deleteMany({ where: { userId: admin.id } });
  await prisma.subscription.create({
    data: {
      userId: admin.id,
      planId: businessPlan.id,
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  // Ensure User account exists with fresh active subscription
  const user = await prisma.user.upsert({
    where: { email: 'user@pdfjson.com' },
    update: {
      role: UserRole.USER,
      isActive: true,
      passwordHash: userPasswordHash,
      name: 'Workspace User',
      company: 'Digital Solutions Corp',
    },
    create: {
      email: 'user@pdfjson.com',
      passwordHash: userPasswordHash,
      name: 'Workspace User',
      role: UserRole.USER,
      company: 'Digital Solutions Corp',
      isEmailVerified: true,
    },
  });

  // Refresh user subscription (Free plan by default or Starter plan, 0 used)
  await prisma.subscription.deleteMany({ where: { userId: user.id } });
  await prisma.subscription.create({
    data: {
      userId: user.id,
      planId: freePlan.id, // Fresh Free plan (10 pages)
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('✅ Database cleaned successfully!');
  console.log('Retained Accounts:');
  console.log('1. Super Admin: ravikiran.mec666@gmail.com (Admin@12345)');
  console.log('2. User: user@pdfjson.com (User@12345)');
  console.log('Plans retained: Free (10 pages), Starter (500 pages), Pro (3000 pages), Business (10000 pages)');
  console.log('All mock documents, test conversions, fake payments, and junk audit logs removed.');
}

cleanDatabase()
  .catch((e) => {
    console.error('Error cleaning database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
