import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env.js';

export const s3VoiceBucket = env.s3VoiceBucket;

export const s3Client = new S3Client({
  region: env.awsRegion
});
