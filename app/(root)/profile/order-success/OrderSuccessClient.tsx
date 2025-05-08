'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-gradient-to-b from-gray-50 to-white">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-600" />
        <p className="text-xl font-medium text-gray-700">Verifying your order...</p>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-4 text-center bg-gradient-to-b from-gray-50 to-white">
        <h1 className="text-5xl md:text-6xl font-extrabold text-red-500 animate-fade">Order Verification Failed</h1>
        <p className="text-xl font-medium text-gray-700">We couldn't confirm your ticket purchase.</p>
        <div className="flex gap-4 mt-6">
          <Button asChild className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-full shadow-md hover:shadow-lg transition-shadow duration-300 px-8 py-4 text-lg">
            <Link href="/profile">Back to Profile</Link>
          </Button>
          <Button asChild variant="outline" className="border-cyan-600 text-cyan-600 hover:bg-cyan-50 font-semibold rounded-full shadow-md hover:shadow-lg transition-shadow duration-300 px-8 py-4 text-lg">
            <Link href="/">Return Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <div className="flex-1 container mx-auto px-4 py-8 md:py-12 lg:px-8 2xl:max-w-7xl flex items-center justify-center">
        <Card className="max-w-2xl w-full p-10 rounded-xl shadow-lg bg-white border-none animate-fade">
          {/* Success Header */}
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="bg-green-100 p-4 rounded-full shadow-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 text-green-600"
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
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 text-center">
              {orderDetails.isFree ? 'Ticket Confirmed!' : 'Payment Successful!'}
            </h1>
          </div>

          {/* Order Details */}
          <div className="space-y-3 text-center">
            <p className="text-2xl font-semibold text-gray-800">{orderDetails.eventTitle}</p>
            {!orderDetails.isFree && (
              <p className="text-xl font-medium text-gray-700">Amount: £{(orderDetails.amount || 0).toFixed(2)}</p>
            )}
            {orderDetails.createdAt && (
              <p className="text-base text-gray-500">
                Purchased on: {orderDetails.createdAt.toLocaleDateString()}
              </p>
            )}
            <p className="text-base text-gray-500">Order #: {orderDetails.orderId}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-10 w-full">
            <Button asChild className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-full shadow-md hover:shadow-lg transition-shadow duration-300 px-8 py-4 text-lg">
              <Link href={`/events/${orderDetails.eventId}`}>
                View Event
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1 border-cyan-600 text-cyan-600 hover:bg-cyan-50 font-semibold rounded-full shadow-md hover:shadow-lg transition-shadow duration-300 px-8 py-4 text-lg">
              <Link href="/profile#my-tickets">My Tickets</Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}