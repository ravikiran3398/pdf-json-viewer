import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  apiUrl: process.env.API_URL || 'http://localhost:5000/api/v1',
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'pdfjson-secret-key-2026',
  sessionSecret: process.env.SESSION_SECRET || 'pdfjson-session-secret-2026',
  storage: {
    driver: (process.env.STORAGE_DRIVER || 'local') as 'local' | 's3',
    localDir: path.resolve(process.env.STORAGE_LOCAL_DIR || './uploads'),
    s3Bucket: process.env.S3_BUCKET_NAME || 'pdf-json-documents-vault',
    awsRegion: process.env.AWS_REGION || 'ap-south-1',
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    keySecret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_placeholder_secret',
  },
};
