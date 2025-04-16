// components/shared/CheckoutButton.tsx
"use client";

import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import { createStripeSession } from "@/lib/actions/stripe.actions"; // make sure this exists

interface CheckoutButtonProps {
  event: {
    id: string;
    _id?: string;
    title: string;
    price: number;
    isFree: boolean;
    endDateTime: Date;
  };
}

const CheckoutButton = ({ event }: CheckoutButtonProps) => {
  const [user, loading, error] = useAuthState(auth);
  const hasEventFinished = new Date(event.endDateTime) < new Date();
  const eventId = event._id || event.id;

  const handleFreeCheckout = async () => {
    if (!user) return toast.error("You must be logged in to get a ticket");

    try {
      const orderRef = doc(db, "orders", `${eventId}_${user.uid}_${Date.now()}`);
      await setDoc(orderRef, {
        eventId,
        buyerId: user.uid,
        amount: 0,
        currency: "GBP",
        status: "completed",
        createdAt: serverTimestamp(),
      });

      window.location.href = `/order-success?eventId=${eventId}`;
    } catch (error) {
      console.error("Free checkout error:", error);
      toast.error("Failed to process free ticket");
    }
  };

  const handlePaidCheckout = async () => {
    if (!user) return toast.error("You must be logged in to buy a ticket");

    try {
      const sessionUrl = await createStripeSession({
        eventId,
        eventTitle: event.title,
        price: event.price,
        isFree: event.isFree,
        buyerId: user.uid,
      });

      window.location.href = sessionUrl;
    } catch (err) {
      console.error("Stripe checkout error:", err);
      toast.error("Payment failed. Please try again.");
    }
  };

  if (loading) {
    return <Loader2 className="h-5 w-5 animate-spin text-primary-500" />;
  }

  if (error) {
    return <p className="p-2 text-red-400">Error loading user</p>;
  }

  return (
    <div className="flex items-center gap-3">
      {hasEventFinished ? (
        <p className="p-2 text-red-400">Tickets no longer available</p>
      ) : !user ? (
        <Button asChild className="button rounded-full" size="lg">
          <Link href="/sign-in">Get Tickets</Link>
        </Button>
      ) : event.isFree ? (
        <Button onClick={handleFreeCheckout} className="button rounded-full" size="lg">
          Get Free Ticket
        </Button>
      ) : (
        <Button onClick={handlePaidCheckout} className="button rounded-full" size="lg">
          Buy Ticket
        </Button>
      )}
    </div>
  );
};

export default CheckoutButton;
