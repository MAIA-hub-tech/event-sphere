// components/shared/Checkout.tsx
"use client";

import { Button } from "../ui/button";
import { useEffect } from "react";
import { toast } from "sonner";
import { createStripeSession } from "@/lib/actions/stripe.actions";
import { CheckoutEventInput } from "@/types";

interface CheckoutProps {
  event: CheckoutEventInput;
  userId: string;
}

const Checkout = ({ event, userId }: CheckoutProps) => {
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get("success")) toast.success("Order confirmed!");
    if (query.get("canceled")) toast.warning("Order canceled");
  }, []);

  const handleCheckout = async () => {
    try {
      const sessionUrl = await createStripeSession({
        eventId: event.id,
        eventTitle: event.title,
        price: event.price,
        isFree: false, // paid event
        buyerId: userId,
      });

      if (!sessionUrl) throw new Error("No session URL returned");

      // redirect user to Stripe Checkout
      window.location.href = sessionUrl;
    } catch (error) {
      toast.error("Payment failed");
      console.error("❌ Checkout error:", error);
    }
  };

  return (
    <Button onClick={handleCheckout} size="lg" className="button sm:w-fit">
      Buy Ticket
    </Button>
  );
};

export default Checkout;
