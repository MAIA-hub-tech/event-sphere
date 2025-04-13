import { getEventById, getRelatedEventsByCategory } from '@/lib/actions/event.actions';
import { formatDateTime } from '@/lib/utils';
import { Calendar, MapPin, Link as LinkIcon } from 'lucide-react';
import ClientImage from '@/components/shared/ClientImage';
import Collection from '@/components/shared/Collection';
import { notFound } from 'next/navigation';
import CheckoutButton from '@/components/shared/CheckoutButton';

export const dynamic = 'force-dynamic';

type EventPageProps = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export default async function EventPage({ params, searchParams }: EventPageProps) {
  // Validate event ID
  const eventId = params?.id;
  if (!eventId || typeof eventId !== 'string') {
    console.error('Invalid event ID parameter:', eventId);
    return notFound();
  }

  try {
    // Fetch event data with error handling
    const event = await getEventById(eventId);
    if (!event) {
      console.error('Event not found in database:', eventId);
      return notFound();
    }

    // Log successful fetch (remove in production)
    console.log('Successfully fetched event:', {
      id: event.id,
      title: event.title,
      organizerId: event.organizerId,
      categoryId: event.categoryId
    });

    // Date formatting helpers
    const formatDate = (date: Date | null) => date ? formatDateTime.date(date) : 'TBD';
    const formatTime = (date: Date | null) => date ? formatDateTime.time(date) : 'TBD';

    // Safely handle searchParams.page
    const pageParam = searchParams?.page;
    const page = Array.isArray(pageParam) ? pageParam[0] : pageParam || '1';

    // Fetch related events with error handling
    const relatedEvents = await getRelatedEventsByCategory({
      categoryId: event.categoryId,
      eventId: event.id,
      page
    }).catch(error => {
      console.error('Error fetching related events:', error);
      return { data: [], totalPages: 0 };
    });

    // Organizer display name logic
    const getOrganizerName = () => {
      if (event.organizer?.firstName && event.organizer?.lastName) {
        return `${event.organizer.firstName} ${event.organizer.lastName}`;
      }
      return event.organizer?.name || event.organizerId || 'Unknown Organizer';
    };

    // URL display formatting
    const formatUrl = (url: string) => {
      return url.replace(/(^\w+:|^)\/\//, '');
    };

    return (
      <>
        <section className="flex justify-center bg-blue-50 bg-[radial-gradient(circle,theme(colors.gray.300)_1px,transparent_1px)] bg-contain">
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:max-w-7xl">
            {/* Event Image */}
            <div className="relative h-full min-h-[300px]">
              <ClientImage
                src={event.imageUrl || '/assets/images/event-placeholder.jpg'}
                alt={event.title || 'Event image'}
                fill
                className="object-cover object-center"
                priority
              />
            </div>

            {/* Event Details */}
            <div className="flex w-full flex-col gap-8 p-5 md:p-10">
              <div className="flex flex-col gap-6">
                <h2 className="font-bold text-[32px] leading-[40px] lg:text-[36px] lg:leading-[44px] xl:text-[40px] xl:leading-[48px]">
                  {event.title || 'Untitled Event'}
                </h2>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex gap-3">
                    <p className="font-bold text-[20px] leading-[30px] tracking-[2%] rounded-full bg-green-500/10 px-5 py-2 text-green-700">
                      {event.isFree ? 'FREE' : `$${event.price || '0'}`}
                    </p>
                    <p className="text-[16px] font-medium leading-[24px] rounded-full bg-gray-500/10 px-4 py-2.5 text-gray-500">
                      {event.category?.name || event.categoryId || 'Uncategorized'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {event.organizer?.photoURL && (
                      <ClientImage
                        src={event.organizer.photoURL}
                        alt="Organizer"
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    )}
                    <p className="text-[18px] font-medium leading-[28px] ml-2 mt-2 sm:mt-0">
                      by{' '}
                      <span className="text-blue-500">
                        {getOrganizerName()}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <CheckoutButton event={event} />

              {/* Event Date/Location */}
              <div className="flex flex-col gap-5">
                <div className="flex gap-2 md:gap-3">
                  <Calendar className="h-8 w-8 text-blue-500" />
                  <div className="text-[16px] font-medium leading-[24px] lg:text-[20px] lg:font-normal lg:leading-[30px] lg:tracking-[2%] flex flex-wrap items-center">
                    <p>
                      {formatDate(event.startDateTime)} -{' '}
                      {formatTime(event.startDateTime)}
                    </p>
                    {event.endDateTime && (
                      <>
                        <span className="mx-1">to</span>
                        <p>
                          {formatDate(event.endDateTime)} -{' '}
                          {formatTime(event.endDateTime)}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-[20px] font-normal leading-[30px] tracking-[2%] flex items-center gap-3">
                  <MapPin className="h-8 w-8 text-blue-500" />
                  <p className="text-[16px] font-medium leading-[24px] lg:text-[20px] lg:font-normal lg:leading-[30px] lg:tracking-[2%]">
                    {event.location || 'Location not specified'}
                    {event.isOnline && ' (Online)'}
                  </p>
                </div>

                {event.url && (
                  <div className="text-[20px] font-normal leading-[30px] tracking-[2%] flex items-center gap-3">
                    <LinkIcon className="h-8 w-8 text-blue-500" />
                    <a
                      href={event.url.includes('://') ? event.url : `https://${event.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {formatUrl(event.url)}
                    </a>
                  </div>
                )}
              </div>

              {/* Event Description */}
              <div className="flex flex-col gap-2">
                <p className="font-bold text-[20px] leading-[30px] tracking-[2%] text-gray-600">
                  What You'll Learn:
                </p>
                <p className="text-[16px] font-medium leading-[24px] lg:text-[18px] lg:font-normal lg:leading-[28px] lg:tracking-[2%]">
                  {event.description || 'No description provided'}
                </p>
                {event.url && (
                  <p className="text-[16px] font-medium leading-[24px] lg:text-[18px] lg:font-normal lg:leading-[28px] lg:tracking-[2%] truncate text-blue-500 underline">
                    <a 
                      href={event.url.includes('://') ? event.url : `https://${event.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {formatUrl(event.url)}
                    </a>
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Related Events */}
        <section className="max-w-7xl lg:mx-auto p-5 md:px-10 xl:px-0 w-full my-8 flex flex-col gap-8 md:gap-12">
          <h2 className="font-bold text-[32px] leading-[40px] lg:text-[36px] lg:leading-[44px] xl:text-[40px] xl:leading-[48px]">
            Related Events
          </h2>
          <Collection
            data={relatedEvents.data}
            emptyTitle="No Events Found"
            emptyStateSubtext="Come back later"
            collectionType="All_Events"
            limit={3}
            page={Number(page) || 1}
            totalPages={relatedEvents.totalPages}
            urlParamName="page"
          />
        </section>
      </>
    );
  } catch (error) {
    console.error('Error in EventPage:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      eventId,
      timestamp: new Date().toISOString()
    });
    return notFound();
  }
}