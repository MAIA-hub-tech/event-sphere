// app/api/webhook/route.ts
import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-03-31.basil', // Matches @types/stripe v8.x
    typescript: true
  });

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature') as string
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  // Handle completed checkout sessions
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { id, amount_total, metadata } = session

    try {
      // Create order document in Firestore
      const orderId = metadata?.firebaseOrderId || `stripe_${id}`
      const orderRef = doc(db, 'orders', orderId)

      await setDoc(orderRef, {
        stripeId: id,
        eventId: metadata?.eventId || '',
        buyerId: metadata?.buyerId || '',
        totalAmount: amount_total ? amount_total / 100 : 0, // Convert from pence to pounds
        currency: 'gbp',
        status: 'completed',
        paymentStatus: 'paid',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Add any additional fields you need
      })

      console.log(`Successfully created order ${orderId}`)
      return NextResponse.json({ success: true, orderId })
      
    } catch (error) {
      console.error('Error creating Firestore order:', error)
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      )
    }
  }

  // Handle other Stripe events if needed
  if (event.type === 'charge.refunded') {
    // Handle refunds
  }

  return NextResponse.json({ received: true }, { status: 200 })
}