import { Router } from 'express';
import { usageController } from './usage.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

router.use(authenticate);
router.get('/', (req, res) => usageController.getUsage(req, res));

export default router;
