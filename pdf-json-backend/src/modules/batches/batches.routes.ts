import { Router } from 'express';
import { batchesController } from './batches.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

router.use(authenticate);
router.post('/', (req, res) => batchesController.create(req, res));
router.get('/', (req, res) => batchesController.list(req, res));
router.get('/:id', (req, res) => batchesController.getById(req, res));
router.get('/:id/export', (req, res) => batchesController.exportBatch(req, res));

export default router;
