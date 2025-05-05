import { adminDb } from '../lib/firebase-admin'; // Fixed import path
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const createNotification = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { body } = event;
    if (!body) throw new Error('No body provided');
    
    const { userId, eventId, orderId, eventTitle } = JSON.parse(body);
    if (!userId || !eventId || !orderId || !eventTitle) {
      throw new Error('Missing required fields');
    }

    console.log(`Creating notification for user ${userId} on event ${eventId}`);

    const docRef = await adminDb.collection(`users/${userId}/notifications`).add({
      type: "event_booking",
      eventId,
      orderId,
      title: "🎟️ Booking Confirmed!",
      message: `You booked "${eventTitle}"`,
      read: false,
      timestamp: new Date().toISOString()
    });

    return {
      statusCode: 200,
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true,
        docId: docRef.id
      })
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error:', errorMessage);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      })
    };
  }
};