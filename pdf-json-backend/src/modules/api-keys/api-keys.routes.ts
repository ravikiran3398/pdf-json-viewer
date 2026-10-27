import { Router } from 'express';
import { apiKeysController } from './api-keys.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

router.use(authenticate);
router.get('/', (req, res) => apiKeysController.list(req, res));
router.post('/', (req, res) => apiKeysController.create(req, res));
router.delete('/:id', (req, res) => apiKeysController.revoke(req, res));

export default router;
