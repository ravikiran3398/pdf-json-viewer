import { Router } from 'express';
import { billingController } from './billing.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

// Public plan endpoint
router.get('/plans', (req, res) => billingController.getPlans(req, res));

// Authenticated billing endpoints
router.use(authenticate);
router.get('/subscription', (req, res) => billingController.getCurrentSubscription(req, res));
router.get('/current', (req, res) => billingController.getCurrentSubscription(req, res));
router.post('/checkout', (req, res) => billingController.createCheckout(req, res));
router.post('/verify', (req, res) => billingController.verifyPayment(req, res));
router.get('/history', (req, res) => billingController.getHistory(req, res));
router.post('/cancel', (req, res) => billingController.cancelSubscription(req, res));

export default router;
