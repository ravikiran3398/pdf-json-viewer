import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';

export class EnquiryController {
  async submitEnterprise(req: Request, res: Response): Promise<void> {
    try {
      const { companyName, contactName, email, phone, estimatedVolume, requirements } = req.body;

      if (!companyName || !contactName || !email) {
        res.status(400).json({ success: false, error: 'Company name, contact name, and email are required' });
        return;
      }

      const enquiry = await prisma.enterpriseEnquiry.create({
        data: {
          companyName,
          contactName,
          email,
          phone: phone || null,
          estimatedVolume: estimatedVolume || '5,000 - 25,000 pages/mo',
          requirements: requirements || 'Custom enterprise integration',
        },
      });

      res.status(201).json({
        success: true,
        message: 'Thank you for reaching out! Our enterprise engineering team will contact you within 24 hours.',
        enquiryId: enquiry.id,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async submitContact(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, subject, message } = req.body;
      if (!name || !email || !message) {
        res.status(400).json({ success: false, error: 'Name, email, and message are required' });
        return;
      }

      res.status(201).json({
        success: true,
        message: 'Your message has been received. Our support team will get back to you shortly.',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const enquiryController = new EnquiryController();
