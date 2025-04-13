import {
  S3Client,
  DeleteObjectCommand,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
  ObjectCannedACL
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

// Validate AWS configuration at module level
const validateS3Config = () => {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS credentials not configured');
  }
  if (!process.env.AWS_S3_BUCKET || !process.env.AWS_REGION) {
    throw new Error('AWS S3 bucket configuration missing');
  }
};

// Initialize S3 client with enhanced configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  maxAttempts: 3,
  retryMode: 'standard'
});

/**
 * Uploads a file to S3 with enhanced options
 * @param file The file to upload
 * @param path The destination path in S3 (without filename)
 * @param options Additional upload options
 * @returns Public URL of the uploaded file
 */
export const uploadFileToS3 = async (
  file: File,
  path: string,
  options?: {
    isPublic?: boolean;
    contentType?: string;
    metadata?: Record<string, string>;
  }
): Promise<string> => {
  validateS3Config();

  const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const sanitizedFileName = file.name
    .replace(/[^a-zA-Z0-9-_.]/g, '')
    .replace(/\s+/g, '_');
  const fileName = `${uuidv4()}_${sanitizedFileName}`;
  const key = `${path.replace(/\/+$/, '')}/${fileName}`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  const uploadParams = {
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    Body: fileBuffer,
    ACL: options?.isPublic !== false ? 'public-read' as ObjectCannedACL : undefined,
    ContentType: options?.contentType || file.type,
    CacheControl: 'max-age=31536000', // 1 year cache
    Metadata: options?.metadata || {}
  };

  await s3Client.send(new PutObjectCommand(uploadParams));
  return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

/**
 * Deletes a file from S3
 * @param fileUrl The full public URL of the file to delete
 */
export const deleteFileFromS3 = async (fileUrl: string): Promise<void> => {
  validateS3Config();

  try {
    const url = new URL(fileUrl);
    const key = decodeURIComponent(url.pathname.slice(1));

    await s3Client.send(new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key
    }));
  } catch (error) {
    console.error('Failed to delete file from S3:', error);
    throw new Error('Failed to delete file');
  }
};

/**
 * Generates a presigned URL for accessing a private S3 object
 * @param key The S3 object key
 * @param expiresIn Time in seconds until URL expires (default: 1 hour)
 */
export const getPresignedUrl = async (key: string, expiresIn: number = 3600): Promise<string> => {
  validateS3Config();

  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
  });
  return await getSignedUrl(s3Client, command, { expiresIn });
};

/**
 * Checks if a file exists in S3
 * @param key The S3 object key to check
 */
export const fileExistsInS3 = async (key: string): Promise<boolean> => {
  validateS3Config();

  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: key,
      })
    );
    return true;
  } catch (error) {
    if (error instanceof Error && 'name' in error && error.name === 'NotFound') {
      return false;
    }
    throw error;
  }
};

/**
 * Lists files in a specific S3 directory
 * @param prefix The directory prefix to list
 */
export const listFilesInDirectory = async (prefix: string): Promise<string[]> => {
  validateS3Config();

  try {
    const response = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: process.env.AWS_S3_BUCKET!,
        Prefix: prefix,
      })
    );
    return response.Contents?.map(item => item.Key || '').filter(Boolean) || [];
  } catch (error) {
    console.error('Failed to list S3 directory:', error);
    throw new Error('Failed to list directory contents');
  }
};

/**
 * Copies a file within S3
 * @param sourceKey Original object key
 * @param destinationKey New object key
 */
export const copyFileInS3 = async (sourceKey: string, destinationKey: string): Promise<void> => {
  validateS3Config();

  try {
    await s3Client.send(
      new CopyObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        CopySource: `${process.env.AWS_S3_BUCKET}/${encodeURIComponent(sourceKey)}`,
        Key: destinationKey,
      })
    );
  } catch (error) {
    console.error('Failed to copy S3 object:', error);
    throw new Error('Failed to copy file');
  }
};

/**
 * Generates a public S3 URL from a key
 * @param key The S3 object key
 */
export const generateS3Url = (key: string): string => {
  validateS3Config();
  return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

export default {
  uploadFileToS3,
  deleteFileFromS3,
  getPresignedUrl,
  fileExistsInS3,
  listFilesInDirectory,
  copyFileInS3,
  generateS3Url
};