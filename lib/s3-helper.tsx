/**
 * Helper functions for S3 operations
 */

import { validateS3Config } from './aws/validateEnv';

/**
 * Generates a public S3 URL from an object key
 * @param key The S3 object key
 * @returns Full public URL to the object
 * @throws Error if S3 configuration is invalid
 */
export const generateS3Url = (key: string): string => {
  if (!process.env.NEXT_PUBLIC_AWS_BUCKET_NAME || !process.env.NEXT_PUBLIC_AWS_REGION) {
    throw new Error('AWS configuration missing');
  }
  
  if (!key) {
    throw new Error('S3 object key is required');
  }

  // Remove leading slash if present
  const normalizedKey = key.startsWith('/') ? key.slice(1) : key;

  return `https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${normalizedKey}`;
};

/**
 * Extracts the S3 object key from a public URL
 * @param url The public S3 URL
 * @returns The object key
 * @throws Error if URL is invalid
 */
export const extractS3Key = (url: string): string => {
  try {
    const parsedUrl = new URL(url);
    return decodeURIComponent(parsedUrl.pathname.slice(1));
  } catch (error) {
    throw new Error(`Invalid S3 URL: ${url}`);
  }
};

/**
 * Validates if a URL is a valid S3 URL from our bucket
 * @param url The URL to validate
 * @returns boolean indicating validity
 */
export const isValidS3Url = (url: string): boolean => {
  try {
    if (!url) return false;
    const parsedUrl = new URL(url);
    const expectedHost = `${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com`;
    return parsedUrl.host === expectedHost;
  } catch {
    return false;
  }
};

export default {
  generateS3Url,
  extractS3Key,
  isValidS3Url
};