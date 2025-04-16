"use client";
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getEventsByUser } from '@/lib/actions/event.actions';
import { getOrdersByUser } from '@/lib/actions/order.actions';
import Collection from '@/components/shared/Collection';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const ProfilePage = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [organizedEvents, setOrganizedEvents] = useState<any[]>([]);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        try {
          const [events, orders] = await Promise.all([
            getEventsByUser({ userId: user.uid }),
            getOrdersByUser(user.uid)
          ]);
          setOrganizedEvents(events.data || []);
          setUserOrders(orders || []);
        } catch (error) {
          console.error('Error loading data:', error);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Transform orders to events safely
  const ticketEvents = userOrders
    .filter(order => order?.event)
    .map(order => ({
      ...order.event,
      id: order.eventId, // Use the original event ID
      userId: order.event.userId || userId || '', // Your preferred field
      organizerId: order.event.userId || userId || '' // For compatibility
    }));

  if (loading) {
    return <div className="max-w-7xl lg:mx-auto p-5 md:px-10 xl:px-0 w-full py-10 text-center">Loading...</div>;
  }

  if (!userId) {
    return (
      <div className="max-w-7xl lg:mx-auto p-5 md:px-10 xl:px-0 w-full min-h-[200px] py-28 text-center">
        <h3 className=" font-bold text-[28px] leading-[36px] md:text-[36px] md:leading-[44px]">Please sign in to view your profile</h3>
        <Button asChild size="lg" className="mt-4">
          <Link href="/sign-in">Sign In</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* My Tickets Section */}
      <section className="bg-blue-50  bg-[radial-gradient(circle,theme(colors.gray.300)_1px,transparent_1px)] bg-cover bg-center py-5 md:py-10">
        <div className="max-w-7xl lg:mx-auto p-5 md:px-10 xl:px-0 w-full flex items-center justify-center sm:justify-between">
          <h3 className=' font-bold text-[28px] leading-[36px] md:text-[36px] md:leading-[44px] text-center sm:text-left'>My Tickets</h3>
          <Button asChild size="lg" className="bg-cyan-500 rounded-full h-[54px]  text-[16px] font-medium leading-[24px] hidden sm:flex">
            <Link href="/#events">Explore More Events</Link>
          </Button>
        </div>
      </section>

      <section className="max-w-7xl lg:mx-auto p-5 md:px-10 xl:px-0 w-full my-8">
        <Collection 
          data={ticketEvents}
          emptyTitle="No event tickets purchased yet"
          emptyStateSubtext="Check out exciting events!"
          collectionType="My_Tickets"
          limit={3}
          page={1}
          urlParamName="ordersPage"
          totalPages={Math.ceil(ticketEvents.length / 3)}
        />
      </section>

      {/* Events Organized Section */}
      <section className="bg-blue-50 bg-[radial-gradient(circle,theme(colors.gray.300)_1px,transparent_1px)] bg-cover bg-center py-5 md:py-10">
        <div className=" max-w-7xl lg:mx-auto p-5 md:px-10 xl:px-0 w-full flex items-center justify-center sm:justify-between">
          <h3 className='font-bold text-[28px] leading-[36px] md:text-[36px] md:leading-[44px] text-center sm:text-left'>Events Organized</h3>
          <Button asChild size="lg" className=" bg-cyan-500 rounded-full h-[54px]  text-[16px] font-normal leading-[24px] hidden sm:flex">
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
          limit={3}
          page={1}
          urlParamName="eventsPage"
          totalPages={Math.ceil(organizedEvents.length / 3)}
        />
      </section>
    </>
  );
};

export default ProfilePage;