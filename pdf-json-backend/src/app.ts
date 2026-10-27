import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from './config/index.js';
import { errorHandler } from './middleware/error-handler.js';

import authRoutes from './modules/auth/auth.routes.js';
import documentsRoutes from './modules/documents/documents.routes.js';
import driveRoutes from './modules/drive/drive.routes.js';
import batchesRoutes from './modules/batches/batches.routes.js';
import templatesRoutes from './modules/templates/templates.routes.js';
import usageRoutes from './modules/usage/usage.routes.js';
import billingRoutes from './modules/billing/billing.routes.js';
import apiKeysRoutes from './modules/api-keys/api-keys.routes.js';
import webhooksRoutes from './modules/webhooks/webhooks.routes.js';
import supportRoutes from './modules/support/support.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import enquiryRoutes from './modules/enquiry/enquiry.routes.js';
import chatRoutes from './modules/chat/chat.routes.js';

import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';

export const app = express();

// Security Middleware (Disable CSP restriction specifically for Swagger UI asset rendering)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  })
);

app.use(
  cors({
    origin: [config.appUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);

// Body Parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting (generous for dev/normal usage)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// Serve static uploaded files locally
app.use('/uploads', express.static(config.storage.localDir));

// Health Checks
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'pdf-json-backend', timestamp: new Date().toISOString() });
});
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', service: 'pdf-json-backend', timestamp: new Date().toISOString() });
});

// Swagger OpenAPI Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'DocuParse JSON — Swagger API Docs',
  customCss: '.swagger-ui .topbar { display: none }',
}));
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'DocuParse JSON — Swagger API Docs',
  customCss: '.swagger-ui .topbar { display: none }',
}));
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/documents', documentsRoutes);
app.use('/api/v1/drive', driveRoutes);
app.use('/api/v1/batches', batchesRoutes);
app.use('/api/v1/templates', templatesRoutes);
app.use('/api/v1/usage', usageRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/api-keys', apiKeysRoutes);
app.use('/api/v1/webhooks', webhooksRoutes);
app.use('/api/v1/support', supportRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/enquiry', enquiryRoutes);
app.use('/api/v1/chat', chatRoutes);

// Global Error Handler
app.use(errorHandler);
