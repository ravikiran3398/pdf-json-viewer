import { Router } from 'express';
import { adminController } from './admin.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { UserRole } from '@prisma/client';

const router = Router();

// Protect all admin routes with authentication and role check
router.use(authenticate, authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]));

router.get('/dashboard', (req, res) => adminController.getDashboard(req, res));
router.get('/users', (req, res) => adminController.listUsers(req, res));
router.patch('/users/:id', (req, res) => adminController.updateUser(req, res));
router.get('/documents', (req, res) => adminController.listDocuments(req, res));
router.post('/jobs/:id/retry', (req, res) => adminController.retryJob(req, res));
router.get('/plans', (req, res) => adminController.listPlans(req, res));
router.patch('/plans/:id', (req, res) => adminController.updatePlan(req, res));
router.get('/payments', (req, res) => adminController.listPayments(req, res));
router.post('/payments/:id/refund', (req, res) => adminController.refundPayment(req, res));
router.get('/usage', (req, res) => adminController.getPlatformUsage(req, res));
router.get('/support/tickets', (req, res) => adminController.listSupportTickets(req, res));
router.patch('/support/tickets/:id', (req, res) => adminController.updateSupportTicket(req, res));
router.get('/enquiries', (req, res) => adminController.listEnquiries(req, res));
router.patch('/enquiries/:id', (req, res) => adminController.updateEnquiry(req, res));
router.get('/audit-logs', (req, res) => adminController.listAuditLogs(req, res));
router.get('/settings', (req, res) => adminController.getSettings(req, res));
router.patch('/settings', (req, res) => adminController.updateSettings(req, res));

export default router;
