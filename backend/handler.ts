import Stripe from 'stripe';
import { adminDb } from '../lib/firebase-admin';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
});

const NOTIFICATION_ENDPOINT = 'https://hlih84c3eb.execute-api.eu-north-1.amazonaws.com/dev/notifications';

export const stripeWebhook = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Log the entire event for debugging
    console.log('Received webhook event:', JSON.stringify({
      headers: event.headers,
      body: event.body,
      isBase64Encoded: event.isBase64Encoded,
    }, null, 2));

    // Find the stripe-signature header (case-insensitive)
    const sigHeader = Object.keys(event.headers).find(
      key => key.toLowerCase() === 'stripe-signature'
    );
    const sig = sigHeader ? event.headers[sigHeader] : undefined;

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    // Validate the signature and body
    if (!sig) {
      console.error('Missing stripe-signature header');
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Missing stripe-signature header' }),
      };
    }

    if (!event.body) {
      console.error('Missing request body');
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Missing request body' }),
      };
    }

    let stripeEvent: Stripe.Event;
    let rawBody = event.body;

    // Handle base64-encoded bodies if necessary
    if (event.isBase64Encoded) {
      rawBody = Buffer.from(event.body, 'base64').toString('utf8');
    }

    try {
      stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Webhook signature verification failed:', errorMessage);
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Webhook signature verification failed', details: errorMessage }),
      };
    }

    if (stripeEvent.type === 'checkout.session.completed') {
      const session = stripeEvent.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.firebaseOrderId;

      if (!orderId) {
        console.error('Missing firebaseOrderId in session metadata');
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Missing firebaseOrderId in session metadata' }),
        };
      }

      const userId = session.metadata?.buyerId;
      const eventId = session.metadata?.eventId;
      const eventTitle = session.metadata?.eventTitle;

      if (!userId || !eventId || !eventTitle) {
        console.error('Missing required metadata fields for notification:', { userId, eventId, eventTitle });
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Missing required metadata fields for notification' }),
        };
      }

      const orderRef = adminDb.doc(`orders/${orderId}`);

      try {
        // Check if the order exists
        const orderDoc = await orderRef.get();
        if (!orderDoc.exists) {
          console.warn(`Order ${orderId} not found, creating new order document`);
          await orderRef.set({
            status: 'completed',
            paymentStatus: 'paid',
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            buyerId: userId,
            eventId: eventId,
            eventTitle: eventTitle,
            totalAmount: session.amount_total ? session.amount_total / 100 : 0,
            currency: session.currency || 'gbp',
          });
          console.log(`Order ${orderId} created with status completed`);
        } else {
          await orderRef.update({
            status: 'completed',
            paymentStatus: 'paid',
            updatedAt: new Date().toISOString(),
          });
          console.log(`Order ${orderId} updated to completed`);
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('Failed to update or create order:', errorMessage);
        // Continue to send notification even if order update fails
      }

      // Trigger notification creation via HTTP request
      const notificationPayload = {
        userId,
        eventId,
        orderId,
        eventTitle,
      };

      console.log('Sending notification request:', notificationPayload);

      try {
        const response = await fetch(NOTIFICATION_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(notificationPayload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to create notification:', response.status, errorText);
        } else {
          const result = await response.json();
          console.log('Notification created successfully:', result);
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('Failed to send notification request:', errorMessage);
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ received: true }),
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error:', errorMessage);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      }),
    };
  }
};

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
      timestamp: new Date().toISOString(),
    });

    return {
      statusCode: 200,
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        success: true,
        docId: docRef.id,
      }),
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error:', errorMessage);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      }),
    };
  }
};