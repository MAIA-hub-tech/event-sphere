import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin-init';

export async function POST(request: Request) {
  try {
    const { userId, eventId, orderId, eventTitle } = await request.json();
    
    if (!userId || !eventId || !orderId || !eventTitle) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("Creating notification for:", {
      userId: userId.slice(0, 6) + '...',
      eventId,
      orderId: orderId.slice(0, 8) + '...'
    });

    await adminDb.collection(`users/${userId}/notifications`).add({
      type: "event_booking",
      eventId,
      orderId,
      title: "🎟️ Booking Confirmed!",
      message: `You booked "${eventTitle}"`,
      read: false,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notification API error:", error);
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}