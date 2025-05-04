import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  console.log('Webhook received');

  const sig = request.headers.get('stripe-signature')!;
  const body = await request.text();

  // Validate webhook secret
  if (!webhookSecret) {
    console.error('❌ Missing STRIPE_WEBHOOK_SECRET');
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    console.log('Webhook event verified:', event.type);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { id, amount_total, metadata, currency } = session;

    console.log('Checkout session completed:', { id, metadata });

    try {
      const orderId = metadata?.firebaseOrderId;
      if (!orderId) {
        throw new Error('Missing firebaseOrderId in session metadata');
      }

      const orderRef = doc(db, 'orders', orderId);

      await updateDoc(orderRef, {
        stripeId: id,
        eventId: metadata?.eventId || '',
        buyerId: metadata?.buyerId || '',
        amount: amount_total ? amount_total / 100 : 0,
        currency: currency || 'gbp',
        status: 'completed',
        paymentStatus: 'paid',
        redirectStatus: 'pending',
        updatedAt: serverTimestamp(),
      });

      console.log(`✅ Order ${orderId} successfully updated to completed`);
      return NextResponse.json({ success: true, orderId });
    } catch (error) {
      console.error('🔥 Firestore error:', error);
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }
  }

  // Handle refunds
  if (event.type === 'charge.refunded') {
    console.log('⚠️ Charge refunded:', event.data.object);
    // Add your refund handling logic here
  }

  return NextResponse.json({ received: true }, { status: 200 });
}