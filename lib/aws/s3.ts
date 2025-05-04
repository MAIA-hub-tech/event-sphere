'use server'; // For server-side operations

import { 
  PutObjectCommand, 
  DeleteObjectCommand, 
  GetObjectCommand, 
  S3Client 
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { StandardRetryStrategy } from '@aws-sdk/middleware-retry';

// Configure AWS S3 Client with custom retry strategy
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  retryStrategy: new StandardRetryStrategy(async () => 5, {
    delayDecider: (delayBase: number, attempts: number) => {
      return 1000 * Math.pow(2, attempts - 1); // Exponential backoff starting at 1000ms
    },
  }),
});

/**
 * Uploads a file to AWS S3
 * @param file - The file to upload (File-like object from FormData or Buffer)
 * @param folder - Destination folder in S3 (e.g., 'uploads/events')
 * @param options - Optional upload options
 * @returns Promise<{url: string, key: string}>
 */
export const uploadFileToS3 = async (
  file: any, // Use 'any' for flexibility with Next.js FormData File objects
  folder: string = 'uploads',
  options: { isPublic?: boolean } = {}
) => {
  try {
    const key = `${folder}/${uuidv4()}-${file.name || 'file'}`; // Use file.name if available

    // Convert the file to a Buffer
    let body: Buffer;
    if (typeof file.arrayBuffer === 'function') {
      const arrayBuffer = await file.arrayBuffer();
      body = Buffer.from(arrayBuffer);
    } else if (Buffer.isBuffer(file)) {
      body = file;
    } else {
      throw new Error('Unsupported file type: Unable to convert to Buffer');
    }

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!, // Use AWS_S3_BUCKET to match .env.local
      Key: key,
      Body: body,
      ContentType: file.type || 'application/octet-stream',
    });

    console.log(`Attempting to upload to S3: ${key}`);
    await s3Client.send(command);
    console.log(`Upload successful for: ${key}`);

    // Generate the public URL if isPublic is true (assumes bucket policy allows public read)
    const url = options.isPublic
      ? `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
      : '';

    return { url, key };
  } catch (error: unknown) {
    console.error('S3 upload error details:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
    throw new Error('Failed to upload file to S3 due to an unknown error');
  }
};

/**
 * Deletes a file from AWS S3 by its URL
 * @param fileUrl - Full S3 URL or key of the file to delete
 */
export const deleteFileFromS3 = async (fileUrl: string) => {
  try {
    const key = fileUrl.includes('amazonaws.com/')
      ? fileUrl.split('amazonaws.com/')[1]
      : fileUrl;

    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!, // Use AWS_S3_BUCKET to match .env.local
      Key: key,
    });

    await s3Client.send(command);
    console.log('S3 file deleted successfully:', key);
  } catch (error: unknown) {
    console.error('S3 deletion error:', error);
    throw new Error('Failed to delete file from S3');
  }
};

/**
 * Generates a pre-signed URL for temporary access
 */
export const getSignedS3Url = async (key: string, expiresIn: number = 3600) => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!, // Use AWS_S3_BUCKET to match .env.local
    Key: key,
  });
  return getSignedUrl(s3Client, command, { expiresIn });
};