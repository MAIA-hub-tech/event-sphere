// lib/actions/stripe.actions.ts
"use server";

import Stripe from "stripe";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil'
});

interface CreateStripeSessionParams {
  eventId: string;
  eventTitle: string;
  price: number;
  isFree: boolean;
  buyerId: string;
}

export async function createStripeSession({
  eventId,
  eventTitle,
  price,
  isFree,
  buyerId,
}: CreateStripeSessionParams): Promise<string> {
  try {
    console.log("⚡ Starting createStripeSession");

    if (isFree) {
      throw new Error("❌ Free events should not trigger Stripe checkout.");
    }

    const orderId = `${eventId}_${buyerId}_${Date.now()}`;
    const orderRef = doc(db, "orders", orderId);

    await setDoc(orderRef, {
      eventId,
      buyerId,
      amount: price,
      currency: "GBP",
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log("✅ Firestore 'pending' order created:", orderId);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl?.startsWith("http")) {
      throw new Error(`❌ Invalid NEXT_PUBLIC_SITE_URL: ${siteUrl}`);
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: { name: eventTitle },
            unit_amount: Math.round(price * 100), // pence
          },
          quantity: 1,
        },
      ],
      metadata: {
        eventId,
        buyerId,
        firebaseOrderId: orderId,
      },
      mode: "payment",
      success_url: `${siteUrl}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/events/${eventId}?canceled=true`,
    });

    console.log("💳 Stripe session created:", session.id);
    return session.url!;
  } catch (error: any) {
    console.error("🔥 Stripe session creation error:", error?.message || error);
    throw error;
  }
}
