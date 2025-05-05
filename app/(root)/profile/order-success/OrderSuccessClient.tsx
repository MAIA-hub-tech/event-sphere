'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getEventById } from '@/lib/actions/event.actions';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface OrderDetails {
  eventTitle: string;
  eventId: string;
  orderId: string;
  isFree: boolean;
  amount?: number;
  status?: string;
  createdAt?: Date;
}

export default function OrderSuccessClient() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);

  useEffect(() => {
    const verifyOrder = async () => {
      try {
        const sessionId = searchParams.get('session_id');
        const eventId = searchParams.get('eventId');
        
        // Wait for auth to initialize
        await new Promise(resolve => {
          const unsubscribe = auth.onAuthStateChanged(user => {
            unsubscribe();
            resolve(user);
          });
        });

        // Validate required parameters
        if (!eventId) throw new Error("Missing event information");
        if (!auth.currentUser?.uid) throw new Error("Please sign in to view your order");

        // Get event details
        const event = await getEventById(eventId);
        if (!event) throw new Error("Event not found");

        // Handle paid orders (Stripe)
        if (sessionId) {
          // First check Firestore
          const orderRef = doc(db, 'orders', sessionId);
          const orderSnap = await getDoc(orderRef);
          
          if (orderSnap.exists()) {
            const orderData = orderSnap.data();
            if (orderData.buyerId !== auth.currentUser.uid) {
              throw new Error("This order doesn't belong to you");
            }

            setOrderDetails({
              eventTitle: event.title,
              eventId: eventId,
              orderId: sessionId,
              isFree: false,
              amount: orderData.totalAmount,
              status: orderData.status,
              createdAt: orderData.createdAt?.toDate()
            });
          } else {
            // Fallback: Verify with API route
            const response = await fetch(`/api/verify-session?sessionId=${sessionId}`);
            if (!response.ok) throw new Error("Failed to verify payment");
            
            const session = await response.json();
            if (session.payment_status === 'paid') {
              setOrderDetails({
                eventTitle: event.title,
                eventId: eventId,
                orderId: sessionId,
                isFree: false,
                amount: session.amount_total / 100,
                status: 'completed'
              });
            } else {
              throw new Error("Payment not completed");
            }
          }
        } 
        // Handle free orders
        else {
          const ordersRef = collection(db, 'orders');
          const q = query(
            ordersRef,
            where("eventId", "==", eventId),
            where("buyerId", "==", auth.currentUser.uid),
            orderBy("createdAt", "desc"),
            limit(1)
          );
          
          const querySnapshot = await getDocs(q);
          if (querySnapshot.empty) throw new Error("Order not found");

          const latestOrder = querySnapshot.docs[0];
          const orderData = latestOrder.data();
          
          setOrderDetails({
            eventTitle: event.title,
            eventId: eventId,
            orderId: latestOrder.id,
            isFree: true,
            status: orderData.status,
            createdAt: orderData.createdAt?.toDate()
          });
        }
      } catch (error) {
        console.error("Order verification error:", error);
        toast.error(`Failed to verify order: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    verifyOrder();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        <p>Verifying your order...</p>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-4 text-center">
        <h1 className="text-2xl font-bold text-red-500">Order Verification Failed</h1>
        <p>We couldn't confirm your ticket purchase</p>
        <div className="flex gap-4 mt-6">
          <Button asChild>
            <Link href="/profile">Back to Profile</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Return Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-4 max-w-md mx-auto">
      {/* Success Icon */}
      <div className="bg-green-100 p-4 rounded-full">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      {/* Success Message */}
      <h1 className="text-3xl font-bold text-center">
        {orderDetails.isFree ? 'Ticket Confirmed!' : 'Payment Successful!'}
      </h1>

      {/* Order Details */}
      <div className="text-center space-y-2">
        <p className="font-medium text-lg">{orderDetails.eventTitle}</p>
        {!orderDetails.isFree && (
          <p className="text-gray-600">Amount: £{(orderDetails.amount || 0).toFixed(2)}</p>
        )}
        {orderDetails.createdAt && (
          <p className="text-sm text-gray-500">
            Purchased on: {orderDetails.createdAt.toLocaleDateString()}
          </p>
        )}
        <p className="text-sm text-gray-500">Order #: {orderDetails.orderId}</p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-8 w-full">
        <Button asChild className="flex-1 bg-cyan-500 rounded-full hover:bg-cyan-700">
          <Link href={`/events/${orderDetails.eventId}`}>
            View Event
          </Link>
        </Button>
        <Button asChild variant="outline" className="flex-1 bg-cyan-500 rounded-full hover:bg-cyan-700 text-amber-50">
          <Link href="/profile#my-tickets">My Tickets</Link>
        </Button>
      </div>
    </div>
  );
}