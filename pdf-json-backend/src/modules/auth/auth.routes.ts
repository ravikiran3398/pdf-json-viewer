import { Router } from 'express';
import { authController } from './auth.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

router.post('/register', (req, res) => authController.register(req, res));
router.post('/login', (req, res) => authController.login(req, res));
router.post('/admin/login', (req, res) => authController.login(req, res));
router.get('/me', authenticate, (req, res) => authController.me(req, res));
router.post('/forgot-password', (req, res) => authController.forgotPassword(req, res));
router.post('/reset-password', (req, res) => authController.resetPassword(req, res));
router.get('/sessions', authenticate, (req, res) => authController.getSessions(req, res));
router.delete('/sessions/:id', authenticate, (req, res) => authController.revokeSession(req, res));
router.post('/logout', authenticate, (req, res) => authController.logout(req, res));
router.get('/activity', authenticate, (req, res) => authController.getUserActivity(req, res));

export default router;
