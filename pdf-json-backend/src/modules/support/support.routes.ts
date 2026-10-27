import { Router } from 'express';
import { supportController } from './support.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

router.use(authenticate);
router.get('/tickets', (req, res) => supportController.list(req, res));
router.post('/tickets', (req, res) => supportController.create(req, res));
router.get('/tickets/:id', (req, res) => supportController.getById(req, res));
router.post('/tickets/:id/reply', (req, res) => supportController.addReply(req, res));

export default router;
