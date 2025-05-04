'use server';

import { S3_CONFIG } from '@/constants';

export function validateS3Config() {
  const requiredVars = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_S3_BUCKET_NAME',
    'AWS_REGION'
  ];

  const missingVars = requiredVars.filter(
    varName => !process.env[varName] && !S3_CONFIG[varName as keyof typeof S3_CONFIG]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing AWS S3 configuration: ${missingVars.join(', ')}. ` +
      'Please check your environment variables.'
    );
  }

  return {
    bucketName: S3_CONFIG.BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME!,
    region: S3_CONFIG.REGION || process.env.AWS_REGION!,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  };
}