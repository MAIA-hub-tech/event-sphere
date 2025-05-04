import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { createEvent, updateEvent } from '@/lib/actions/event.actions';
import { uploadFileToS3 } from '@/lib/aws/s3';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  try {
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      throw new Error('Missing Firebase Admin SDK environment variables: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    throw new Error('Failed to initialize Firebase Admin SDK');
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get the ID token from headers
    const idToken = req.headers.get('Authorization')?.split('Bearer ')[1];
    console.log('Received ID token:', idToken ? 'Present' : 'Missing');

    if (!idToken) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing token' },
        { status: 401 }
      );
    }

    // Validate the token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
      console.log('Decoded token:', decodedToken);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during token verification';
      console.error('Token verification failed:', errorMessage);
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token', details: errorMessage },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid user' },
        { status: 401 }
      );
    }

    // Fetch user details for organizer info
    const userRecord = await admin.auth().getUser(userId);
    const currentUser = {
      uid: userId,
      firstName: userRecord.displayName ? userRecord.displayName.split(' ')[0] : 'Unknown',
      lastName: userRecord.displayName ? userRecord.displayName.split(' ').slice(1).join(' ') : 'Organizer',
      photoURL: userRecord.photoURL || undefined,
    };

    // Parse the FormData
    const formData = await req.formData();
    console.log('FormData entries:', Array.from(formData.entries()).map(([key, value]) => ({ key, value })));

    // Extract fields
    const imageFile = formData.get('imageFile');
    let imageUrl = '';
    
    // Handle file upload if provided
    if (imageFile && imageFile instanceof Blob) {
      const fileName = `${userId}/${Date.now()}_${(imageFile as any).name || 'image'}`;
      const uploadResult = await uploadFileToS3(imageFile, `events/${fileName}`, { isPublic: true });
      imageUrl = typeof uploadResult === 'string' ? uploadResult : uploadResult.url;
      console.log('Image uploaded successfully:', imageUrl);
    }

    const payload = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      location: formData.get('location') as string,
      imageUrl, // Pass the URL instead of the File
      isFree: formData.get('isFree') === 'true',
      price: parseFloat(formData.get('price') as string) || 0,
      categoryId: formData.get('categoryId') as string,
      startDateTime: formData.get('startDateTime') as string,
      endDateTime: formData.get('endDateTime') as string,
      url: formData.get('url') as string | undefined,
      userId: userId,
      isOnline: formData.get('isOnline') === 'true' ? true : formData.get('isOnline') === 'false' ? false : undefined,
    };

    // Validate required fields
    if (!payload.title || !payload.startDateTime) {
      return NextResponse.json(
        { error: 'Title and start date are required' },
        { status: 400 }
      );
    }

    // Create the event using the server action
    const newEvent = await createEvent(payload, currentUser);

    return NextResponse.json(
      { 
        id: newEvent.id,
        message: 'Event created successfully' 
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Event creation error:', errorMessage);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Get the ID token from headers
    const idToken = req.headers.get('Authorization')?.split('Bearer ')[1];
    console.log('Received ID token:', idToken ? 'Present' : 'Missing');

    if (!idToken) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing token' },
        { status: 401 }
      );
    }

    // Validate the token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
      console.log('Decoded token:', decodedToken);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during token verification';
      console.error('Token verification failed:', errorMessage);
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token', details: errorMessage },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid user' },
        { status: 401 }
      );
    }

    // Parse the FormData
    const formData = await req.formData();
    console.log('FormData entries:', Array.from(formData.entries()).map(([key, value]) => ({ key, value })));

    // Extract fields, keeping dates as strings to match ClientEvent
    const eventId = formData.get('eventId') as string;
    let imageUrl = '';
    const imageFile = formData.get('imageFile');
    
    // Handle file upload if provided
    if (imageFile && imageFile instanceof Blob) {
      const fileName = `${userId}/${eventId}/${Date.now()}_${(imageFile as any).name || 'image'}`;
      const uploadResult = await uploadFileToS3(imageFile, `events/${fileName}`, { isPublic: true });
      imageUrl = typeof uploadResult === 'string' ? uploadResult : uploadResult.url;
      console.log('Image uploaded successfully:', imageUrl);
    }

    const eventData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      location: formData.get('location') as string,
      imageUrl: imageUrl || undefined, // Pass the URL if a new file was uploaded
      isFree: formData.get('isFree') === 'true',
      price: parseFloat(formData.get('price') as string) || 0,
      categoryId: formData.get('categoryId') as string,
      startDateTime: formData.get('startDateTime') as string,
      endDateTime: formData.get('endDateTime') as string,
      url: formData.get('url') as string | undefined,
      isOnline: formData.get('isOnline') === 'true' ? true : formData.get('isOnline') === 'false' ? false : undefined,
    };

    // Validate required fields
    if (!eventId || !eventData.title || !eventData.startDateTime) {
      return NextResponse.json(
        { error: 'Event ID, title, and start date are required' },
        { status: 400 }
      );
    }

    // Update the event using the server action
    const updatedEvent = await updateEvent({ eventId, eventData, userId });

    return NextResponse.json(updatedEvent, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Event update error:', errorMessage);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}