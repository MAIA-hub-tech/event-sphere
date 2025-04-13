// app/api/events/[id]/route.ts
import { NextResponse } from 'next/server';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import adminApp from '@/lib/firebase-admin-init';

const db = getFirestore(adminApp);
const auth = getAuth(adminApp);

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id;
    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const eventRef = db.collection('events').doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    const eventData = eventDoc.data();

    // Convert Firestore Timestamps to ISO strings
    const processedEvent = {
      id: eventDoc.id,
      ...eventData,
      startDateTime: (eventData?.startDateTime as Timestamp)?.toDate()?.toISOString(),
      endDateTime: (eventData?.endDateTime as Timestamp)?.toDate()?.toISOString(),
      createdAt: (eventData?.createdAt as Timestamp)?.toDate()?.toISOString(),
      updatedAt: (eventData?.updatedAt as Timestamp)?.toDate()?.toISOString()
    };

    return NextResponse.json({
      success: true,
      data: processedEvent
    });

  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    // Authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const eventId = params.id;

    // Validate input
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { success: false, error: 'Invalid content type' },
        { status: 415 }
      );
    }

    const inputData = await request.json();
    if (!inputData?.title || !inputData?.startDateTime) {
      return NextResponse.json(
        { success: false, error: 'Title and start date are required' },
        { status: 400 }
      );
    }

    // Check event exists
    const eventRef = db.collection('events').doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    const eventData = eventDoc.data();
    if (!eventData || (eventData.userId !== decodedToken.uid && eventData.organizerId !== decodedToken.uid)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to update this event' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData = {
      title: inputData.title,
      description: inputData.description || eventData.description || '',
      location: inputData.location || eventData.location || '',
      imageUrl: inputData.imageUrl || eventData.imageUrl || '',
      categoryId: inputData.categoryId || eventData.categoryId || '',
      startDateTime: Timestamp.fromDate(new Date(inputData.startDateTime)),
      endDateTime: inputData.endDateTime ? Timestamp.fromDate(new Date(inputData.endDateTime)) : null,
      price: inputData.isFree ? 0 : Number(inputData.price) || eventData.price || 0,
      isFree: Boolean(inputData.isFree),
      url: inputData.url || eventData.url || '',
      updatedAt: Timestamp.now()
    };

    // Execute update
    await eventRef.update(updateData);

    // Return success
    return NextResponse.json({
      success: true,
      message: 'Event updated successfully'
    });

  } catch (error) {
    console.error('PUT Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // Authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const eventId = params.id;

    // Check event exists
    const eventRef = db.collection('events').doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    const eventData = eventDoc.data();
    if (!eventData || (eventData.userId !== decodedToken.uid && eventData.organizerId !== decodedToken.uid)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to delete this event' },
        { status: 403 }
      );
    }

    // Execute deletion
    await eventRef.delete();

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully'
    });

  } catch (error) {
    console.error('DELETE Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}