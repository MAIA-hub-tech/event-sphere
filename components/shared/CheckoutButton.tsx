"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter, usePathname } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { createStripeSession } from '@/lib/actions/stripe.actions';
import { hasUserPurchasedTicket } from '@/lib/actions/order.actions';
import { ClientEvent } from '@/types/event';
import Checkout from './Checkout';
import { toDate } from '@/lib/utils';

interface CheckoutButtonProps {
  event: ClientEvent;
  className?: string;
}

const CheckoutButton = ({ event, className }: CheckoutButtonProps) => {
  const [user, loading, error] = useAuthState(auth);
  const [alreadyPurchased, setAlreadyPurchased] = useState<boolean>(false);
  const endDate = toDate(event.endDateTime);
  const hasEventFinished = endDate ? endDate < new Date() : false;
  const eventId = event.id;
  const router = useRouter();
  const pathname = usePathname();

  const price = typeof event.price === 'string' ? parseFloat(event.price) || 0 : event.price;

  const checkPurchaseStatus = useCallback(async () => {
    if (user && eventId) {
      try {
        console.log('Checking purchase status for event:', eventId, 'and user:', user.uid);
        const purchased = await hasUserPurchasedTicket(eventId, user.uid);
        console.log('Purchase status from Firestore:', purchased);
        setAlreadyPurchased(purchased);
      } catch (error) {
        console.error('Error checking ticket purchase:', error);
      }
    }
  }, [user, eventId]);

  useEffect(() => {
    checkPurchaseStatus();
  }, [checkPurchaseStatus, pathname]);

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

  const handleFreeCheckout = async () => {
    if (alreadyPurchased) return toast.error('You already have a ticket');
    if (!user) return toast.error('Please sign in');

    try {
      const orderId = `${eventId}_${user.uid}_${Date.now()}`;
      const orderRef = doc(db, 'orders', orderId);

      await setDoc(orderRef, {
        eventId,
        buyerId: user.uid,
        amount: 0,
        currency: 'GBP',
        status: 'completed',
        createdAt: serverTimestamp(),
      });

      const notificationSuccess = await sendNotification(user.uid, eventId, orderId, event.title);

      if (!notificationSuccess) {
        toast.warning('Booking completed, but notification failed');
      }

      setAlreadyPurchased(true);
      router.push(`/profile/order-success?eventId=${encodeURIComponent(eventId)}`);
    } catch (error: unknown) {
      console.error('Checkout error:', error);
      toast.error('Booking failed. Please try again.');
    }
  };

  if (loading) {
    return <Loader2 className="h-5 w-5 animate-spin text-cyan-500" />;
  }

  if (error) {
    return <p className="p-2 text-red-400">Error loading user</p>;
  }

  return (
    <div className="flex items-center gap-3">
      {alreadyPurchased ? (
        <div className="flex items-center gap-3">
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
          <Button
            asChild
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-full shadow-md hover:shadow-lg transition-shadow duration-300 px-8 py-3 text-base"
          >
            <Link href={`/events/${event.id}/forum`}>
              Forum
            </Link>
          </Button>
        </div>
      ) : hasEventFinished ? (
        <p className="p-2 text-red-400 font-semibold">Tickets no longer available</p>
      ) : !user ? (
        <Button asChild size="lg" className={`rounded-full bg-cyan-500 hover:bg-cyan-600 text-white transition-colors duration-300 ${className}`}>
          <Link href="/sign-in">Get Tickets</Link>
        </Button>
      ) : event.isFree ? (
        <Button
          onClick={handleFreeCheckout}
          size="lg"
          className={`rounded-full bg-cyan-500 hover:bg-cyan-600 text-white transition-colors duration-300 ${className}`}
        >
          Get Free Ticket
        </Button>
      ) : (
        <Checkout
          event={event}
          userId={user.uid}
          setAlreadyPurchased={setAlreadyPurchased}
        />
      )}
    </div>
  );
};

export default CheckoutButton;