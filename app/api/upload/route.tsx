import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { validateS3Config } from '@/lib/aws/validateEnv';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  maxAttempts: 3
});

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type');

    // Handle direct multipart/form-data file upload
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as Blob | null;

      if (!file || typeof file !== 'object' || typeof (file as any).arrayBuffer !== 'function') {
        return NextResponse.json(
          { success: false, error: 'Invalid file format received' },
          { status: 400 }
        );
      }

      // Safe filename handling
      const originalName = (formData.get('filename') || 'upload.bin').toString();
      const fileExt = originalName.split('.').pop()?.toLowerCase() || 'bin';
      const sanitizedFileName = originalName
        .replace(/[^a-zA-Z0-9-_.]/g, '')
        .replace(/\s+/g, '_');

      const eventId = formData.get('eventId')?.toString() || 'temp';
      const s3Key = `uploads/${eventId}/${Date.now()}_${sanitizedFileName}`;

      // Upload to S3
      const putCommand = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: s3Key,
        Body: Buffer.from(await file.arrayBuffer()),
        ContentType: (file as any).type || 'application/octet-stream',
        ACL: 'private',
        Metadata: {
          originalFileName: originalName,
          uploadedBy: 'event-sphere-app',
          ...(eventId && { eventId })
        },
        CacheControl: 'max-age=31536000'
      });

      await s3Client.send(putCommand);

      const publicUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

      return NextResponse.json({
        success: true,
        url: publicUrl,
        key: s3Key,
        publicUrl
      });
    }

    // Handle signed URL generation (JSON body expected)
    validateS3Config();
    const { fileName, fileType, eventId } = await request.json();

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: 'fileName and fileType are required' },
        { status: 400 }
      );
    }

    const fileExt = fileName.split('.').pop()?.toLowerCase() || 'bin';
    const sanitizedFileName = fileName
      .replace(/[^a-zA-Z0-9-_.]/g, '')
      .replace(/\s+/g, '_');

    const s3Key = `uploads/${eventId || 'temp'}/${Date.now()}_${sanitizedFileName}`;

    const putCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: s3Key,
      ContentType: fileType,
      ACL: 'private',
      Metadata: {
        originalFileName: fileName,
        uploadedBy: 'event-sphere-app',
        ...(eventId && { eventId })
      },
      CacheControl: 'max-age=31536000'
    });

    const uploadUrl = await getSignedUrl(s3Client, putCommand, {
      expiresIn: 300 // 5 minutes
    });

    return NextResponse.json({
      success: true,
      uploadUrl,
      key: s3Key,
      publicUrl: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`,
      expiresAt: new Date(Date.now() + 300 * 1000).toISOString()
    });

  } catch (error: any) {
    console.error('S3 operation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Operation failed',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      },
      { status: 500 }
    );
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
