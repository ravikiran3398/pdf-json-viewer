import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../../config/index.js';

export interface StorageResult {
  key: string;
  url: string;
  size: number;
}

export class StorageService {
  private s3Client?: S3Client;

  constructor() {
    if (!fs.existsSync(config.storage.localDir)) {
      fs.mkdirSync(config.storage.localDir, { recursive: true });
    }

    if (config.storage.driver === 's3') {
      this.s3Client = new S3Client({
        region: config.storage.awsRegion,
      });
    }
  }

  async saveFile(buffer: Buffer, originalFileName: string, subfolder = 'documents'): Promise<StorageResult> {
    const timestamp = Date.now();
    const cleanFileName = originalFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageKey = `${subfolder}/${timestamp}_${cleanFileName}`;

    if (config.storage.driver === 's3' && this.s3Client) {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: config.storage.s3Bucket,
          Key: storageKey,
          Body: buffer,
          ContentType: 'application/pdf',
        })
      );
      return {
        key: storageKey,
        url: `https://${config.storage.s3Bucket}.s3.${config.storage.awsRegion}.amazonaws.com/${storageKey}`,
        size: buffer.length,
      };
    }

    // Local filesystem storage
    const targetPath = path.join(config.storage.localDir, storageKey);
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    await fs.promises.writeFile(targetPath, buffer);

    return {
      key: storageKey,
      url: `/uploads/${storageKey}`,
      size: buffer.length,
    };
  }

  async getFileBuffer(storageKey: string): Promise<Buffer> {
    if (config.storage.driver === 's3' && this.s3Client) {
      const response = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: config.storage.s3Bucket,
          Key: storageKey,
        })
      );
      const streamToBuffer = async (stream: any): Promise<Buffer> => {
        return new Promise((resolve, reject) => {
          const chunks: any[] = [];
          stream.on('data', (chunk: any) => chunks.push(chunk));
          stream.on('error', reject);
          stream.on('end', () => resolve(Buffer.concat(chunks)));
        });
      };
      return await streamToBuffer(response.Body);
    }

    const localPath = path.join(config.storage.localDir, storageKey);
    if (!fs.existsSync(localPath)) {
      throw new Error(`File not found: ${storageKey}`);
    }
    return await fs.promises.readFile(localPath);
  }

  async deleteFile(storageKey: string): Promise<void> {
    if (config.storage.driver === 's3' && this.s3Client) {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: config.storage.s3Bucket,
          Key: storageKey,
        })
      );
      return;
    }

    const localPath = path.join(config.storage.localDir, storageKey);
    if (fs.existsSync(localPath)) {
      await fs.promises.unlink(localPath);
    }
  }

  async getDownloadUrl(storageKey: string, expiresInSeconds = 3600): Promise<string> {
    if (config.storage.driver === 's3' && this.s3Client) {
      const command = new GetObjectCommand({
        Bucket: config.storage.s3Bucket,
        Key: storageKey,
      });
      return await getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
    }

    return `/uploads/${storageKey}`;
  }
}

export const storageService = new StorageService();
