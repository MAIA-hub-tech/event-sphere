import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client with enhanced configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  maxAttempts: 3, // Retry up to 3 times on failures
  retryMode: 'standard'
});

// Validate AWS configuration
const validateAWSConfig = () => {
  const requiredEnvVars = {
    'AWS_ACCESS_KEY_ID': process.env.AWS_ACCESS_KEY_ID,
    'AWS_SECRET_ACCESS_KEY': process.env.AWS_SECRET_ACCESS_KEY,
    'AWS_S3_BUCKET': process.env.AWS_S3_BUCKET,
    'AWS_REGION': process.env.AWS_REGION
  };

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(`Missing AWS configuration: ${missingVars.join(', ')}`);
  }
};

export async function POST(request: Request) {
  try {
    // Validate AWS configuration first
    validateAWSConfig();

    // Parse and validate request body
    const body = await request.json();
    const { fileName, fileType, eventId, pathPrefix: requestedPath } = body;

    if (!fileName || typeof fileName !== 'string') {
      return NextResponse.json(
        { error: 'Valid fileName (string) is required' },
        { status: 400 }
      );
    }

    if (!fileType || typeof fileType !== 'string') {
      return NextResponse.json(
        { error: 'Valid fileType (string) is required' },
        { status: 400 }
      );
    }

    // Generate safe filename and path
    const fileExt = fileName.split('.').pop()?.toLowerCase() || 'bin';
    const sanitizedFileName = fileName
      .replace(/[^a-zA-Z0-9-_.]/g, '') // Remove special chars
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .slice(0, 255); // Limit filename length

    // Single declaration with fallback logic  
    const pathPrefix = requestedPath || (eventId ? `events/${eventId}` : 'temp');
    const s3Key = `uploads/${pathPrefix}/${Date.now()}_${sanitizedFileName}.${fileExt}`;

    // Create signed URL command with enhanced settings
    const putCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: s3Key,
      ContentType: fileType,
      Metadata: {
        uploadedBy: 'event-sphere-app',
        originalFileName: fileName,
        ...(eventId && { eventId: eventId })
      }
    });

    // Generate signed URL with explicitly signed headers (valid for 5 minutes)
    const uploadUrl = await getSignedUrl(s3Client, putCommand, {
      expiresIn: 300, // 5 minutes
      signableHeaders: new Set(['content-type']) // Explicitly sign content-type
    });

    return NextResponse.json({
      success: true,
      uploadUrl,
      key: s3Key,
      publicUrl: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`,
      expiresAt: new Date(Date.now() + 300 * 1000).toISOString()
    });

  } catch (error) {
    console.error('S3 URL generation error:', error);
    
    // Special handling for specific error types
    const statusCode = error instanceof Error && error.message.includes('AWS configuration') 
      ? 500 
      : 400;

    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate upload URL',
        ...(process.env.NODE_ENV === 'development' && { 
          stack: error instanceof Error ? error.stack : undefined 
        })
      },
      { status: statusCode }
    );
  }
}

// Add CORS support for preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400' // 24 hours
    }
  });
}