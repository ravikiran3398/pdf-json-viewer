import { Router } from 'express';
import { enquiryController } from './enquiry.controller.js';

const router = Router();

router.post('/enterprise', (req, res) => enquiryController.submitEnterprise(req, res));
router.post('/contact', (req, res) => enquiryController.submitContact(req, res));

export default router;
