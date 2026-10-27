import { Router } from 'express';
import multer from 'multer';
import { documentsController } from './documents.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max limit
  },
});

const router = Router();

router.use(authenticate);

router.post('/upload', upload.single('file'), (req, res) => documentsController.upload(req, res));
router.get('/', (req, res) => documentsController.list(req, res));
router.get('/:id', (req, res) => documentsController.getById(req, res));
router.get('/:id/result', (req, res) => documentsController.getResult(req, res));
router.patch('/:id/result', (req, res) => documentsController.updateResult(req, res));
router.post('/:id/validate', (req, res) => documentsController.validateResult(req, res));
router.post('/:id/reprocess', (req, res) => documentsController.reprocess(req, res));
router.get('/:id/export', (req, res) => documentsController.exportResult(req, res));
router.delete('/:id', (req, res) => documentsController.delete(req, res));

export default router;
