import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Create validateS3Config directly in this file since it's only used here
function validateS3Config() {
  const requiredEnvVars = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_S3_BUCKET',
    'AWS_REGION'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing AWS configuration: ${missingVars.join(', ')}. ` +
      'Please check your environment variables.'
    );
  }

  return {
    bucketName: process.env.AWS_S3_BUCKET!,
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
    }
  };
}

export async function POST(request: Request) {
  try {
    // Validate config first
    const { bucketName, region, credentials } = validateS3Config();
    
    const s3Client = new S3Client({
      region,
      credentials,
      maxAttempts: 3
    });

    const contentType = request.headers.get('content-type');

    // Handle direct file upload
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        );
      }

      const eventId = formData.get('eventId')?.toString() || 'temp';
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin';
      const safeFileName = file.name
        .replace(/[^a-zA-Z0-9-_.]/g, '')
        .replace(/\s+/g, '_');
      
      const s3Key = `uploads/${eventId}/${Date.now()}_${safeFileName}`;

      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
        Body: Buffer.from(await file.arrayBuffer()),
        ContentType: file.type,
        ACL: 'private',
        Metadata: {
          originalName: file.name,
          uploadedBy: 'event-sphere'
        }
      });

      await s3Client.send(putCommand);

      return NextResponse.json({
        success: true,
        key: s3Key,
        url: `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}`
      });
    }

    // Handle signed URL request
    const { fileName, fileType, eventId } = await request.json();
    
    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: 'fileName and fileType are required' },
        { status: 400 }
      );
    }

    const fileExt = fileName.split('.').pop()?.toLowerCase() || 'bin';
    const safeFileName = fileName
      .replace(/[^a-zA-Z0-9-_.]/g, '')
      .replace(/\s+/g, '_');

    const s3Key = `uploads/${eventId || 'temp'}/${Date.now()}_${safeFileName}`;

    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      ContentType: fileType,
      ACL: 'private',
      Metadata: {
        originalName: fileName,
        uploadedBy: 'event-sphere'
      }
    });

    const uploadUrl = await getSignedUrl(s3Client, putCommand, {
      expiresIn: 300 // 5 minutes
    });

    return NextResponse.json({
      success: true,
      uploadUrl,
      key: s3Key,
      expiresAt: new Date(Date.now() + 300000).toISOString()
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Upload failed',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}