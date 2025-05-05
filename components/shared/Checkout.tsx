"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { createStripeSession, verifyStripeSession } from "@/lib/actions/stripe.actions";
import { CheckoutEventInput } from "@/types";
import { hasUserPurchasedTicket } from "@/lib/actions/order.actions";

interface CheckoutProps {
  event: CheckoutEventInput;
  userId: string;
  setAlreadyPurchased: (value: boolean) => void;
}

const Checkout = ({ event, userId, setAlreadyPurchased }: CheckoutProps) => {
  const [localAlreadyPurchased, setLocalAlreadyPurchased] = useState(false);
  const [orderProcessed, setOrderProcessed] = useState(false);
  const router = useRouter();

  const sendNotification = async (userId: string, eventId: string, orderId: string, eventTitle: string) => {
    const payload = {
      userId,
      eventId,
      orderId,
      eventTitle,
    };

    console.log('📨 Sending notification with payload:', payload);

    try {
      const lambdaResponse = await fetch(
        'https://hlih84c3eb.execute-api.eu-north-1.amazonaws.com/dev/notifications',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Origin': window.location.origin,
          },
          body: JSON.stringify(payload),
          credentials: 'omit',
        }
      );

      if (!lambdaResponse.ok) {
        throw new Error(`Lambda returned ${lambdaResponse.status}`);
      }

      console.log('✅ Notification sent via Lambda');
      return true;
    } catch (lambdaError) {
      console.error('🔥 Notification via Lambda failed:', lambdaError);
      return false;
    }
  };

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const isSuccess = query.get("success");
    const sessionId = query.get("session_id");
    const isCanceled = query.get("canceled");

    if (isSuccess && sessionId && !orderProcessed) {
      toast.success("Order confirmed!");
      // Verify Stripe session and update state
      const completeOrder = async () => {
        try {
          console.log('Verifying Stripe session:', sessionId);
          const sessionData = await verifyStripeSession({ sessionId, buyerId: userId });
          const { metadata, status } = sessionData;

          console.log('Session data:', sessionData);

          if (status !== 'paid') {
            throw new Error("Payment not completed");
          }

          if (!metadata?.firebaseOrderId) {
            throw new Error("Missing firebaseOrderId in session metadata");
          }

          // Send notification
          const notificationSuccess = await sendNotification(userId, event.id, metadata.firebaseOrderId, event.title);
          if (!notificationSuccess) {
            toast.warning('Order confirmed, but notification failed');
          }

          // Re-check purchase status to confirm
          const purchased = await hasUserPurchasedTicket(event.id, userId);
          console.log('Re-checked purchase status after update:', purchased);

          setOrderProcessed(true);
          setLocalAlreadyPurchased(true);
          setAlreadyPurchased(true);
          router.push(`/profile/order-success?eventId=${encodeURIComponent(event.id)}`);
        } catch (error) {
          console.error('Error completing order after Stripe payment:', error);
          toast.error('Order confirmation failed. Please contact support.');
        }
      };

      completeOrder();
    }

    if (isCanceled) {
      toast.warning("Order canceled");
    }
  }, [event.id, userId, event.title, orderProcessed, router, setAlreadyPurchased]);

  useEffect(() => {
    if (userId && event.id) {
      hasUserPurchasedTicket(event.id, userId)
        .then((purchased) => {
          console.log('Initial check - Has user purchased ticket:', purchased);
          setLocalAlreadyPurchased(purchased);
          setAlreadyPurchased(purchased);
        })
        .catch(error => {
          console.error('Error checking ticket purchase:', error);
        });
    }
  }, [userId, event.id, setAlreadyPurchased]);

  const handleCheckout = async () => {
    if (localAlreadyPurchased) {
      return toast.error("You already own a ticket for this event");
    }

    try {
      const sessionUrl = await createStripeSession({
        eventId: event.id,
        eventTitle: event.title,
        price: event.price,
        isFree: false,
        buyerId: userId,
      });

      if (!sessionUrl) throw new Error("No session URL returned");

      // Redirect user to Stripe Checkout
      window.location.href = sessionUrl;
    } catch (error) {
      toast.error("Payment failed");
      console.error("❌ Checkout error:", error);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {localAlreadyPurchased ? (
        <div className="flex items-center gap-2 p-2 bg-green-100 rounded-full px-4 py-2 shadow-md">
          <svg 
            className="w-5 h-5 text-green-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M5 13l4 4L19 7" 
            />
          </svg>
          <p className="text-green-600 font-semibold text-sm">
            Ticket Booked Successfully!
          </p>
        </div>
      ) : (
        <Button 
          onClick={handleCheckout} 
          size="lg" 
          disabled={localAlreadyPurchased}
          className="rounded-full bg-cyan-500 hover:bg-cyan-600 text-white transition-colors duration-300 sm:w-fit"
        >
          Buy Ticket
        </Button>
      )}
    </div>
  );
};

export default Checkout;