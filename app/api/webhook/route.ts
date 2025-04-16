import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil', // Ensure it matches your installed Stripe version
  typescript: true,
});

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature') as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid Stripe signature' }, { status: 400 });
  }

  // ✅ Handle successful checkout
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { id, amount_total, metadata } = session;

    try {
      const orderId = metadata?.firebaseOrderId || `stripe_${id}`;
      const orderRef = doc(db, 'orders', orderId);

      await setDoc(orderRef, {
        stripeId: id,
        eventId: metadata?.eventId || '',
        buyerId: metadata?.buyerId || '',
        totalAmount: amount_total ? amount_total / 100 : 0,
        currency: session.currency || 'gbp',
        status: 'completed',
        paymentStatus: 'paid',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log(`✅ Stripe webhook: Order ${orderId} created.`);
      return NextResponse.json({ success: true, orderId });
    } catch (error) {
      console.error('🔥 Firestore order creation error:', error);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }
  }

  // 🔁 Add more event types here (e.g., refunds)
  if (event.type === 'charge.refunded') {
    console.log('⚠️ Charge refunded:', event.data.object);
    // Optional: handle refunds here
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
