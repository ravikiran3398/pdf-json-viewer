import { Router } from 'express';
import { webhooksController } from './webhooks.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

router.use(authenticate);
router.get('/', (req, res) => webhooksController.list(req, res));
router.post('/', (req, res) => webhooksController.create(req, res));
router.post('/:id/test', (req, res) => webhooksController.testPing(req, res));
router.delete('/:id', (req, res) => webhooksController.delete(req, res));

export default router;
