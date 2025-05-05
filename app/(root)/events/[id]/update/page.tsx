"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import EventForm from "@/components/shared/EventForm";
import { getEventById } from "@/lib/firestore-utils";

interface EventFormData {
  id: string; 
  title: string;
  description: string;
  location: string;
  imageUrl: string;
  startDateTime: Date;
  endDateTime: Date;
  categoryId: string;
  price: string; // Changed from number to string to match EventFormProps
  isFree: boolean;
  url?: string;
  userId: string;
}

const UpdateEvent = () => {
  const [user] = useAuthState(auth);
  const [event, setEvent] = useState<EventFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams<{ id: string }>();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setIsLoading(true);

        if (!params.id) {
          throw new Error('Event ID is missing');
        }

        const eventData = await getEventById(params.id);
        
        if (!eventData) {
          throw new Error('Event not found');
        }

        // Convert Firestore data to proper format
        const formattedEvent: EventFormData = {
          id: eventData.id,
          title: eventData.title || '',
          description: eventData.description || '',
          location: eventData.location || '',
          imageUrl: eventData.imageUrl || '',
          startDateTime: eventData.startDateTime?.toDate?.() || new Date(),
          endDateTime: eventData.endDateTime?.toDate?.() || new Date(),
          categoryId: eventData.categoryId || '',
          price: typeof eventData.price === 'number' ? eventData.price.toString() : eventData.price || '0', // Convert number to string
          isFree: Boolean(eventData.isFree),
          url: eventData.url || '',
          userId: eventData.userId || ''
        };

        setEvent(formattedEvent);
      } catch (err) {
        console.error('Error fetching event:', err);
        setError(err instanceof Error ? err.message : 'Failed to load event');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchEvent();
    }
  }, [params.id, router]);

  if (isLoading) {
    return (
      <div className="max-w-7xl lg:mx-auto p-5 md:px-10 xl:px-0 w-full min-h-[300px] flex justify-center items-center">
        <div className=" animate-spin h-5 w-5 border-4 border-t-transparent border-blue-500 "></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className=" max-w-7xl lg:mx-auto p-5 md:px-10 xl:px-0 w-full min-h-[300px] flex justify-center items-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <>
      <section className="bg-blue-50 bg-[radial-gradient(circle,theme(colors.gray.300)_1px,transparent_1px)] bg-cover bg-center py-5 md:py-10">
        <h3 className="max-w-7xl lg:mx-auto p-5 md:px-10 xl:px-0 w-full font-bold text-[28px] leading-[36px] md:text-[36px] md:leading-[44px] text-center sm:text-left">Update Event</h3>
      </section>

      <div className="max-w-7xl lg:mx-auto p-5 md:px-10 xl:px-0 w-full my-8">
        {event && (
          <EventForm 
            type="Update" 
            event={event}
            eventId={event.id}
            userId={event.userId}
            onSuccess={() => router.push(`/events/${event.id}`)}
          />
        )}
      </div>
    </>
  );
};

export default UpdateEvent;