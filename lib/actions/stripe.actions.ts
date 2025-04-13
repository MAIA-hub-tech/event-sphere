// lib/actions/stripe.actions.ts
"use server"

import Stripe from 'stripe'
import { db } from '@/lib/firebase'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-03-31.basil' // Matches @types/stripe v8.x
})

interface CreateStripeSessionParams {
  eventId: string
  eventTitle: string
  price: number
  isFree: boolean
  buyerId: string
}

export async function createStripeSession({
  eventId,
  eventTitle,
  price,
  isFree,
  buyerId
}: CreateStripeSessionParams) {
  try {
    // 1. Validate that this isn't a free event
    if (isFree) throw new Error("Free events should not use Stripe");

    // 2. Create order document in Firestore
    const orderRef = doc(db, 'orders', `${eventId}_${buyerId}_${Date.now()}`)
    
    await setDoc(orderRef, {
      eventId,
      buyerId,
      amount: price,
      currency: 'GBP', // Using pounds as requested
      status: 'pending', // Always pending since we're handling paid events only
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    // 3. Create Stripe Checkout session for paid events
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp', // Using pounds
            product_data: {
              name: eventTitle,
            },
            unit_amount: Math.round(price * 100), // Convert to pence
          },
          quantity: 1,
        },
      ],
      metadata: {
        eventId,
        buyerId,
        firebaseOrderId: orderRef.id
      },
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/events/${eventId}?canceled=true`,
    })

    return session
  } catch (error) {
    console.error('Error creating Stripe session:', error)
    throw error
  }
}