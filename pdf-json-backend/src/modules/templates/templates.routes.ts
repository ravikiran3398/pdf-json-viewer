import { Router } from 'express';
import { templatesController } from './templates.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

router.use(authenticate);
router.get('/', (req, res) => templatesController.list(req, res));
router.post('/', (req, res) => templatesController.create(req, res));
router.get('/:id', (req, res) => templatesController.getById(req, res));
router.patch('/:id', (req, res) => templatesController.update(req, res));
router.delete('/:id', (req, res) => templatesController.delete(req, res));

export default router;
