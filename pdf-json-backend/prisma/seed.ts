import process from 'node:process';
import { PrismaClient, UserRole, ExtractionMode, ProcessingStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create Plans
  const freePlan = await prisma.plan.upsert({
    where: { slug: 'free' },
    update: {},
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
    update: {},
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
    update: {},
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
    update: {},
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

  console.log('✅ Plans seeded');

  // 2. Create Users
  const adminPasswordHash = await bcrypt.hash('Admin@12345', 10);
  const userPasswordHash = await bcrypt.hash('User@12345', 10);

  // Primary Super Admin requested by user
  const ravikiranAdmin = await prisma.user.upsert({
    where: { email: 'ravikiran.mec666@gmail.com' },
    update: {
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      passwordHash: adminPasswordHash,
    },
    create: {
      email: 'ravikiran.mec666@gmail.com',
      passwordHash: adminPasswordHash,
      name: 'Ravikiran (Super Admin)',
      role: UserRole.SUPER_ADMIN,
      company: 'PDF-to-JSON Platform Inc.',
      isEmailVerified: true,
      subscriptions: {
        create: {
          planId: businessPlan.id,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@pdfjson.com' },
    update: {},
    create: {
      email: 'admin@pdfjson.com',
      passwordHash: adminPasswordHash,
      name: 'Sarah Chen (Super Admin)',
      role: UserRole.SUPER_ADMIN,
      company: 'PDF-to-JSON Platform Inc.',
      isEmailVerified: true,
      subscriptions: {
        create: {
          planId: businessPlan.id,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  const defaultUser = await prisma.user.upsert({
    where: { email: 'user@pdfjson.com' },
    update: {
      passwordHash: userPasswordHash,
      isActive: true,
    },
    create: {
      email: 'user@pdfjson.com',
      passwordHash: userPasswordHash,
      name: 'Default User',
      role: UserRole.USER,
      company: 'Digital Solutions Corp',
      isEmailVerified: true,
      subscriptions: {
        create: {
          planId: starterPlan.id,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@pdfjson.com' },
    update: {
      passwordHash: userPasswordHash,
      isActive: true,
    },
    create: {
      email: 'demo@pdfjson.com',
      passwordHash: userPasswordHash,
      name: 'Alex Rivera',
      role: UserRole.USER,
      company: 'Acme Logistics Pvt Ltd',
      isEmailVerified: true,
      subscriptions: {
        create: {
          planId: proPlan.id,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  console.log('✅ Users seeded: ravikiran.mec666@gmail.com, user@pdfjson.com, demo@pdfjson.com');

  // 3. Create System Templates
  await prisma.extractionTemplate.upsert({
    where: { id: 'tpl_invoice_default' },
    update: {},
    create: {
      id: 'tpl_invoice_default',
      name: 'Standard Commercial Invoice',
      description: 'Extracts invoice number, vendor, customer, line items, taxes and totals.',
      isSystem: true,
      schema: {
        type: 'object',
        required: ['invoiceNumber', 'invoiceDate', 'financialSummary'],
        properties: {
          invoiceNumber: { type: 'string' },
          invoiceDate: { type: 'string' },
          dueDate: { type: 'string' },
          vendor: { type: 'object' },
          customer: { type: 'object' },
          lineItems: { type: 'array' },
          financialSummary: {
            type: 'object',
            required: ['totalAmount'],
            properties: {
              subtotal: { type: 'number' },
              taxAmount: { type: 'number' },
              totalAmount: { type: 'number' },
            },
          },
        },
      },
      sampleFields: {
        invoiceNumber: 'INV-2026-089',
        totalAmount: 12500,
        currency: 'INR',
      },
    },
  });

  await prisma.extractionTemplate.upsert({
    where: { id: 'tpl_receipt_default' },
    update: {},
    create: {
      id: 'tpl_receipt_default',
      name: 'Retail & POS Receipt',
      description: 'Extracts merchant name, receipt number, date, purchase items, and payment method.',
      isSystem: true,
      schema: {
        type: 'object',
        required: ['merchantName', 'totalAmount'],
        properties: {
          merchantName: { type: 'string' },
          date: { type: 'string' },
          totalAmount: { type: 'number' },
          paymentMethod: { type: 'string' },
          items: { type: 'array' },
        },
      },
    },
  });

  console.log('✅ System Templates seeded');

  // 4. Sample Documents & Results for demoUser
  const existingDoc = await prisma.document.findFirst({ where: { userId: demoUser.id } });
  if (!existingDoc) {
    const doc1 = await prisma.document.create({
      data: {
        userId: demoUser.id,
        originalFileName: 'AWS_Cloud_Invoice_Oct2026.pdf',
        mimeType: 'application/pdf',
        fileSize: BigInt(84320),
        pageCount: 3,
        storageKey: 'documents/sample_aws_invoice.pdf',
        status: ProcessingStatus.COMPLETED,
        extractionMode: ExtractionMode.FAST_TEXT,
        processingDurationMs: 340,
        results: {
          create: {
            version: 1,
            data: {
              documentType: 'INVOICE',
              invoiceNumber: 'INV-AWS-88914',
              invoiceDate: '2026-10-20',
              dueDate: '2026-11-04',
              currency: 'INR',
              vendor: {
                name: 'Amazon Web Services India Pvt Ltd',
                taxId: '29AABCA1234F1Z8',
              },
              customer: {
                name: 'Acme Logistics Pvt Ltd',
              },
              lineItems: [
                { description: 'Amazon Elastic Compute Cloud (EC2)', quantity: 1, unitPrice: 4200.0, amount: 4200.0 },
                { description: 'Amazon Relational Database Service (RDS)', quantity: 1, unitPrice: 3800.0, amount: 3800.0 },
                { description: 'Amazon Simple Storage Service (S3)', quantity: 1, unitPrice: 450.0, amount: 450.0 },
              ],
              financialSummary: {
                subtotal: 8450.0,
                taxAmount: 1521.0,
                totalAmount: 9971.0,
              },
              paymentStatus: 'PAID',
            },
            schemaValid: true,
            confidenceScore: 0.98,
          },
        },
      },
    });

    const doc2 = await prisma.document.create({
      data: {
        userId: demoUser.id,
        originalFileName: 'Dell_Hardware_Receipt_Scanned.pdf',
        mimeType: 'application/pdf',
        fileSize: BigInt(142800),
        pageCount: 1,
        storageKey: 'documents/sample_dell_receipt.pdf',
        status: ProcessingStatus.COMPLETED_WITH_WARNINGS,
        extractionMode: ExtractionMode.OCR_SCANNED,
        processingDurationMs: 1250,
        results: {
          create: {
            version: 1,
            data: {
              documentType: 'RECEIPT',
              merchantName: 'Dell Technologies Store Bengaluru',
              date: '2026-10-24',
              totalAmount: 48999.0,
              currency: 'INR',
              paymentMethod: 'UPI / Corporate Card',
              items: [
                { description: 'Dell UltraSharp 27 4K Monitor', quantity: 1, amount: 48999.0 },
              ],
            },
            schemaValid: true,
            warnings: ['Slight text skew detected during OCR phase; verified against barcode checksum.'],
            confidenceScore: 0.92,
          },
        },
      },
    });

    // Record usage
    await prisma.usageLedger.createMany({
      data: [
        { userId: demoUser.id, documentId: doc1.id, pageCount: 3, isOcr: false, actionType: 'SETTLE' },
        { userId: demoUser.id, documentId: doc2.id, pageCount: 1, isOcr: true, actionType: 'SETTLE' },
      ],
    });

    // Sample API Key
    const keyPrefix = 'pk_live_8f3a...d91c';
    const keyHash = crypto.createHash('sha256').update('pk_live_demo_test_key_sample').digest('hex');
    await prisma.apiKey.create({
      data: {
        userId: demoUser.id,
        label: 'Production Webhook Worker',
        keyPrefix,
        keyHash,
        scopes: ['documents.read', 'documents.write', 'extract.read'],
      },
    });

    // Sample Support Ticket
    await prisma.supportTicket.create({
      data: {
        userId: demoUser.id,
        ticketId: 'TCK-2026-1042',
        subject: 'Custom Schema field mapping for German VAT invoices',
        category: 'FEATURE_REQUEST',
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        messages: [
          {
            sender: 'USER',
            senderEmail: demoUser.email,
            message: 'Hello, I want to map specific MwSt tax exemptions for EU invoices. Could you help guide me on configuring the JSON Schema regex?',
            createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
          },
          {
            sender: 'ADMIN',
            senderEmail: admin.email,
            message: 'Hi Alex! You can specify pattern matching under properties.vendor.properties.vatId in your template schema. Here is a sample regex snippet: ^DE[0-9]{9}$.',
            createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          },
        ],
      },
    });

    // Sample Payment
    await prisma.payment.create({
      data: {
        userId: demoUser.id,
        orderId: 'order_oct_pro_2026',
        paymentId: 'pay_rzp_live_891244',
        amount: 799,
        currency: 'INR',
        status: 'SUCCESS',
        receiptNumber: 'INV-2026-1029',
      },
    });

    console.log('✅ Sample documents, ledger, API keys & tickets seeded');
  }

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
