'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getEventsByUser } from '@/lib/actions/event.actions';
import { getOrdersByUser } from '@/lib/actions/order.actions';
import Collection from '@/components/shared/Collection';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from "lucide-react";

const ProfilePage = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [organizedEvents, setOrganizedEvents] = useState<any[]>([]);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const eventsPage = Number(searchParams.get('eventsPage')) || 1;
  const ordersPage = Number(searchParams.get('ordersPage')) || 1;
  const eventsLimit = 3; // Events per page
  const ordersLimit = 3; // Tickets per page

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        try {
          const eventsResult = await getEventsByUser({ userId: user.uid, page: eventsPage, limit: eventsLimit }).catch(err => {
            console.error('Error in getEventsByUser:', err);
            return { data: [], totalPages: 0 };
          });

          const ordersResult = await getOrdersByUser(user.uid).catch(err => {
            console.error('Error in getOrdersByUser:', err);
            return [];
          });

          setOrganizedEvents(eventsResult.data || []);
          setUserOrders(ordersResult || []);
        } catch (err) {
          console.error('Error loading profile data:', err);
          setError('Failed to load profile data. Please try again later.');
          setOrganizedEvents([]);
          setUserOrders([]);
        }
      } else {
        setUserId(null);
        setOrganizedEvents([]);
        setUserOrders([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [eventsPage]);

  // Transform orders to events safely
  const ticketEvents = userOrders
    .filter(order => {
      const hasEvent = !!order?.event;
      if (!hasEvent) {
        console.log('Order missing event:', order);
      }
      return hasEvent;
    })
    .map(order => {
      const transformedEvent = {
        ...order.event,
        id: order.eventId,
        userId: order.event?.userId || userId || '',
        organizerId: order.event?.userId || userId || ''
      };
      console.log('Transformed ticket event:', transformedEvent);
      return transformedEvent;
    });

  if (loading) {
    return (
      <div className="max-w-7xl lg:mx-auto p-5 md:px-10 xl:px-0 w-full min-h-[200px] py-28 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="max-w-7xl lg:mx-auto p-5 md:px-10 xl:px-0 w-full min-h-[200px] py-28 text-center">
        <h3 className="font-bold text-[28px] leading-[36px] md:text-[36px] md:leading-[44px]">
          Please sign in to view your profile
        </h3>
        <Button asChild size="lg" className="mt-4">
          <Link href="/sign-in">Sign In</Link>
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl lg:mx-auto p-5 md:px-10 xl:px-0 w-full min-h-[200px] py-28 text-center">
        <h3 className="font-bold text-[28px] leading-[36px] md:text-[36px] md:leading-[44px] text-red-600">
          {error}
        </h3>
        <Button asChild size="lg" className="mt-4">
          <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    );
  }

  // Paginate tickets (client-side)
  const paginatedTickets = ticketEvents.slice((ordersPage - 1) * ordersLimit, ordersPage * ordersLimit);

  return (
    <>
      {/* My Tickets Section */}
      <section id="my-tickets" className="bg-blue-50 bg-[radial-gradient(circle,theme(colors.gray.300)_1px,transparent_1px)] bg-cover bg-center py-5 md:py-10">
        <div className="max-w-7xl lg:mx-auto p-5 md:px-10 xl:px-0 w-full flex items-center justify-center sm:justify-between">
          <h3 className="font-bold text-[28px] leading-[36px] md:text-[36px] md:leading-[44px] text-center sm:text-left animate-fade">
            My Tickets
          </h3>
          <Button asChild size="lg" className="bg-cyan-500 rounded-full h-[54px] text-[16px] font-medium leading-[24px] hidden sm:flex">
            <Link href="/events">Explore More Events</Link>
          </Button>
        </div>
      </section>

      <section className="max-w-7xl lg:mx-auto p-5 md:px-10 xl:px-0 w-full my-8">
        <Collection 
          data={paginatedTickets}
          emptyTitle="No event tickets purchased yet"
          emptyStateSubtext="Check out exciting events!"
          collectionType="My_Tickets"
          limit={ordersLimit}
          page={ordersPage}
          urlParamName="ordersPage"
          totalPages={Math.ceil(ticketEvents.length / ordersLimit)}
        />
      </section>

      {/* Events Organized Section */}
      <section className="bg-blue-50 bg-[radial-gradient(circle,theme(colors.gray.300)_1px,transparent_1px)] bg-cover bg-center py-5 md:py-10">
        <div className="max-w-7xl lg:mx-auto p-5 md:px-10 xl:px-0 w-full flex items-center justify-center sm:justify-between">
          <h3 className="font-bold text-[28px] leading-[36px] md:text-[36px] md:leading-[44px] text-center sm:text-left animate-fade">
            Events Organized
          </h3>
          <Button asChild size="lg" className="bg-cyan-500 rounded-full h-[54px] text-[16px] font-normal leading-[24px] hidden sm:flex">
            <Link href="/events/create">Create New Event</Link>
          </Button>
        </div>
      </section>

      <section className="max-w-7xl lg:mx-auto p-5 md:px-10 xl:px-0 w-full my-8">
        <Collection 
          data={organizedEvents}
          emptyTitle="No events organized yet"
          emptyStateSubtext="Create your first event!"
          collectionType="Events_Organized"
          limit={eventsLimit}
          page={eventsPage}
          urlParamName="eventsPage"
          totalPages={Math.ceil((organizedEvents.length || 0) / eventsLimit)}
        />
      </section>
    </>
  );
};

export default ProfilePage;