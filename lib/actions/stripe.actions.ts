"use server";

import Stripe from "stripe";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { hasUserPurchasedTicket } from "@/lib/actions/order.actions";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
});

interface CreateStripeSessionParams {
  eventId: string;
  eventTitle: string;
  price: number;
  isFree: boolean;
  buyerId: string;
}

interface VerifyStripeSessionParams {
  sessionId: string;
  buyerId?: string;
}

export async function createStripeSession({
  eventId,
  eventTitle,
  price,
  isFree,
  buyerId,
}: CreateStripeSessionParams): Promise<string> {
  try {
    console.log("⚡ Creating Stripe session for event:", eventId);

    if (isFree || price <= 0) {
      throw new Error("Cannot create Stripe session for free event");
    }

    // Validate price
    if (price <= 0 || isNaN(price)) {
      throw new Error("Invalid price amount");
    }

    // Check if the user has already purchased a ticket
    const hasPurchased = await hasUserPurchasedTicket(eventId, buyerId);
    console.log('Has user purchased ticket before creating session:', hasPurchased);
    if (hasPurchased) {
      throw new Error("User has already purchased a ticket for this event");
    }

    const orderId = `order_${eventId}_${buyerId}_${Date.now()}`;
    const orderRef = doc(db, "orders", orderId);

    // Create pending order in Firestore
    await setDoc(orderRef, {
      eventId,
      eventTitle,
      buyerId,
      totalAmount: price,
      currency: "GBP",
      status: "pending",
      paymentStatus: "unpaid",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log("✅ Created pending order in Firestore:", orderId);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl?.startsWith("http")) {
      throw new Error(`Invalid site URL configuration: ${siteUrl}`);
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: { 
              name: eventTitle,
              metadata: {
                eventId,
              }
            },
            unit_amount: Math.round(price * 100), // Convert to pence
          },
          quantity: 1,
        },
      ],
      metadata: {
        eventId,
        buyerId,
        eventTitle,
        firebaseOrderId: orderId,
      },
      mode: "payment",
      success_url: `${siteUrl}/profile/order-success?session_id={CHECKOUT_SESSION_ID}&eventId=${eventId}`,
      cancel_url: `${siteUrl}/events/${eventId}?canceled=true`,
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes from now
    });

    if (!session.url) {
      throw new Error("Failed to create Stripe checkout URL");
    }

    console.log("💳 Successfully created Stripe session:", session.id);
    return session.url;
  } catch (error: any) {
    console.error("🔥 Stripe session creation failed:", error.message);
    throw new Error(error.message || "Failed to create Stripe session");
  }
}

export async function verifyStripeSession({
  sessionId,
  buyerId
}: VerifyStripeSessionParams) {
  try {
    console.log("🔍 Verifying Stripe session:", sessionId);

    if (!sessionId) {
      throw new Error("Missing session ID");
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent']
    });

    // Additional verification if buyerId is provided
    if (buyerId && session.metadata?.buyerId !== buyerId) {
      throw new Error("Session does not belong to this user");
    }

    return {
      session,
      paymentIntent: session.payment_intent,
      status: session.payment_status,
      amount: session.amount_total ? session.amount_total / 100 : 0,
      currency: session.currency,
      metadata: session.metadata
    };
  } catch (error: any) {
    console.error("🔴 Stripe session verification failed:", error.message);
    throw new Error(error.message || "Failed to verify Stripe session");
  }
}