import { Router } from 'express';
import { chatController } from './chat.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

// User endpoints
router.get('/user/messages', (req, res) => chatController.getUserMessages(req, res));
router.post('/user/send', (req, res) => chatController.sendMessage(req, res));

// Admin endpoints
router.get('/admin/conversations', authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]), (req, res) => chatController.getAdminConversations(req, res));
router.get('/admin/messages/:userId', authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]), (req, res) => chatController.getAdminUserMessages(req, res));
router.post('/admin/reply', authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]), (req, res) => chatController.sendAdminReply(req, res));

export default router;
