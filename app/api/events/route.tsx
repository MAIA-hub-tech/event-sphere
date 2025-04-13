// app/api/events/route.ts
import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin-init';

export async function POST(request: Request) {
  try {
    console.log('Received event creation request');
    
    // 1. Verify Authorization
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.warn('Missing or invalid Authorization header');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    console.log('Verifying token...');
    
    // 2. Verify Firebase Token
    const decodedToken = await adminAuth.verifyIdToken(token);
    console.log('Token valid for user:', decodedToken.uid);

    // 3. Process and validate Event Data
    const eventData = await request.json();
    console.log('Event data received:', JSON.stringify(eventData, null, 2));
    
    if (!eventData.title || !eventData.startDateTime) {
      console.warn('Missing required fields in event data');
      return NextResponse.json(
        { error: 'Missing required fields (title and startDateTime are required)' },
        { status: 400 }
      );
    }

    // 4. Save to Firestore
    console.log('Creating event document...');
    const docRef = await adminDb.collection('events').add({
      ...eventData,
      creatorId: decodedToken.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log('Event created with ID:', docRef.id);

    return NextResponse.json(
      {
        success: true,
        id: docRef.id
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('❌ Event creation error:', error);
    
    // Handle specific error cases
    let status = 500;
    let errorMessage = 'Event creation failed';
    
    if (error instanceof Error) {
      if (error.message.includes('auth/id-token-expired')) {
        status = 401;
        errorMessage = 'Token expired';
      } else if (error.message.includes('auth/id-token-invalid')) {
        status = 401;
        errorMessage = 'Invalid token';
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { 
          stack: error instanceof Error ? error.stack : undefined 
        })
      },
      { status }
    );
  }
}