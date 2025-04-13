/**
 * Validates AWS environment configuration
 */

/**
 * Validates required AWS environment variables
 * @throws Error if any required variables are missing
 */
export function validateS3Config(): void {
  const requiredVars = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_S3_BUCKET',
    'AWS_REGION'
  ];

  const missingVars = requiredVars.filter(v => !process.env[v]);

  if (missingVars.length > 0) {
    throw new Error(`Missing AWS environment variables: ${missingVars.join(', ')}`);
  }

  // Additional validation for AWS credentials format
  if (process.env.AWS_ACCESS_KEY_ID && !/^[A-Z0-9]{20}$/.test(process.env.AWS_ACCESS_KEY_ID)) {
    throw new Error('Invalid AWS_ACCESS_KEY_ID format');
  }

  if (process.env.AWS_SECRET_ACCESS_KEY && !/^[A-Za-z0-9+/]{40}$/.test(process.env.AWS_SECRET_ACCESS_KEY)) {
    throw new Error('Invalid AWS_SECRET_ACCESS_KEY format');
  }
}

/**
 * Validates Firebase environment variables
 * @throws Error if any required variables are missing
 */
export function validateFirebaseConfig(): void {
  const requiredVars = [
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'FIREBASE_ADMIN_CLIENT_EMAIL',
    'FIREBASE_ADMIN_PRIVATE_KEY'
  ];

  const missingVars = requiredVars.filter(v => !process.env[v]);

  if (missingVars.length > 0) {
    throw new Error(`Missing Firebase environment variables: ${missingVars.join(', ')}`);
  }
}

export default {
  validateS3Config,
  validateFirebaseConfig
};