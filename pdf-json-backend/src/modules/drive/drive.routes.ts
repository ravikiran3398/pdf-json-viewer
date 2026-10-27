import { Router } from 'express';
import { driveController } from './drive.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

router.get('/callback', (req, res) => driveController.callback(req, res));

// Authenticated Drive endpoints
router.use(authenticate);
router.post('/authorize', (req, res) => driveController.authorize(req, res));
router.get('/files', (req, res) => driveController.listFiles(req, res));
router.post('/import', (req, res) => driveController.importFile(req, res));
router.post('/validate-link', (req, res) => driveController.validateLink(req, res));

export default router;
