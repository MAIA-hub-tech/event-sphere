import { getEventById, getRelatedEventsByCategory } from '@/lib/actions/event.actions';
import { formatDateTime } from '@/lib/utils';
import { Calendar, MapPin, Link as LinkIcon } from 'lucide-react';
import ClientImage from '@/components/shared/ClientImage';
import Collection from '@/components/shared/Collection';
import { notFound } from 'next/navigation';
import CheckoutButton from '@/components/shared/CheckoutButton';
import { Timestamp } from 'firebase/firestore';
import { ClientEvent } from '@/types/event';

export const dynamic = 'force-dynamic';

type EventPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function EventPage({ params, searchParams }: EventPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const eventId = resolvedParams.id;
  if (!eventId || typeof eventId !== 'string') {
    return notFound();
  }

  try {
    const event: ClientEvent | null = await getEventById(eventId);
    if (!event) {
      return notFound();
    }

    console.log('Organizer details:', {
      id: event.organizerId,
      name: event.organizer ? `${event.organizer.firstName || ''} ${event.organizer.lastName || ''}`.trim() : 'No organizer data',
      hasData: !!event.organizer,
    });

    // Convert startDateTime and endDateTime to Date objects
    const startDateTime = event.startDateTime
      ? event.startDateTime instanceof Timestamp
        ? event.startDateTime.toDate()
        : new Date(event.startDateTime)
      : null;
    const endDateTime = event.endDateTime
      ? event.endDateTime instanceof Timestamp
        ? event.endDateTime.toDate()
        : new Date(event.endDateTime)
      : null;

    const formatDate = (date: Date | null) => date ? formatDateTime.date(date) : 'TBD';
    const formatTime = (date: Date | null) => date ? formatDateTime.time(date) : 'TBD';
    const page = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page, 10) : 1;

    const relatedEvents = await getRelatedEventsByCategory({
      categoryId: event.categoryId,
      eventId: event.id,
      page,
    }).catch(error => {
      console.error('Error fetching related events:', error);
      return { data: [], totalPages: 0 };
    });

    const getOrganizerName = () => {
      // If firstName and lastName are set and not default values, use them
      if (
        event.organizer?.firstName &&
        event.organizer?.lastName &&
        event.organizer.firstName !== 'Unknown' &&
        event.organizer.lastName !== 'Organizer'
      ) {
        return `${event.organizer.firstName} ${event.organizer.lastName}`.trim();
      }
      // Otherwise, prefer displayName if available
      if (event.organizer?.displayName) {
        return event.organizer.displayName;
      }
      // Fallback to organizerId or default
      return event.organizerId || 'Unknown Organizer';
    };

    const formatUrl = (url: string) => {
      try {
        const urlObj = new URL(url.includes('://') ? url : `https://${url}`);
        return urlObj.hostname.replace(/^www\./, '');
      } catch {
        return url;
      }
    };

    return (
      <>
        {/* Event Details Section */}
        <section className="container mx-auto px-4 py-8 md:py-12 lg:px-8 2xl:max-w-7xl animate-fade">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
            {/* Event Image */}
            <div className="relative h-[300px] md:h-[400px] rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl">
              <ClientImage
                src={event.imageUrl || '/assets/images/event-placeholder.jpg'}
                alt={event.title || 'Event image'}
                fill
                className="object-cover object-center transition-transform duration-300 hover:scale-105"
                priority // Fix LCP warning
              />
            </div>

            {/* Event Details */}
            <div className="flex flex-col justify-center gap-6">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900">
                {event.title || 'Untitled Event'}
              </h1>

              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center px-4 py-2 bg-green-500 text-white text-lg font-semibold rounded-full shadow-md">
                  {event.isFree ? 'FREE' : `£${event.price || '0'}`}
                </span>
                <span className="inline-flex items-center px-4 py-2 bg-cyan-500 text-white text-lg font-medium rounded-full shadow-md">
                  {event.category?.name || event.categoryId || 'Uncategorized'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {event.organizer?.photoURL && (
                  <ClientImage
                    src={event.organizer.photoURL}
                    alt="Organizer"
                    width={32}
                    height={32}
                    className="rounded-full object-cover"
                  />
                )}
                <p className="text-lg md:text-xl font-medium text-gray-800">
                  by{' '}
                  <span className="text-cyan-600 hover:underline">{getOrganizerName()}</span>
                </p>
              </div>

              <CheckoutButton event={event} className="inline-block px-6 py-3 bg-cyan-600 text-white text-lg font-semibold rounded-full hover:bg-cyan-700 transition-all shadow-lg w-full md:w-auto" />

              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-6 w-6 text-cyan-600" />
                  <div className="text-gray-700">
                    <p className="text-lg md:text-xl font-medium">
                      {formatDate(startDateTime)} - {formatTime(startDateTime)}
                    </p>
                    {endDateTime && (
                      <p className="text-lg md:text-xl font-medium">
                        to {formatDate(endDateTime)} - {formatTime(endDateTime)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="h-6 w-6 text-cyan-600" />
                  <p className="text-lg md:text-xl font-medium text-gray-700">
                    {event.location || 'Location not specified'}
                    {event.isOnline && ' (Online)'}
                  </p>
                </div>

                {event.url && (
                  <div className="flex items-center gap-3">
                    <LinkIcon className="h-6 w-6 text-cyan-600" />
                    <a
                      href={event.url.includes('://') ? event.url : `https://${event.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-600 hover:underline text-lg md:text-xl font-medium truncate"
                    >
                      {formatUrl(event.url)}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Event Description */}
          <div className="mt-8 flex flex-col gap-2">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-800">What You'll Learn:</h3>
            <p className="text-gray-600 text-lg md:text-xl leading-relaxed">
              {event.description || 'No description provided.'}
            </p>
            {event.url && (
              <a
                href={event.url.includes('://') ? event.url : `https://${event.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-600 hover:underline text-lg md:text-xl truncate"
              >
                {formatUrl(event.url)}
              </a>
            )}
          </div>
        </section>

        {/* Separator */}
        <div className="w-full h-px bg-gray-200 my-8" />

        {/* Related Events Section */}
        <section className="container mx-auto px-4 py-8 md:py-12 lg:px-8 2xl:max-w-7xl bg-gradient-to-b from-gray-50 to-white">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 animate-fade">
            Related Events
          </h2>
          <Collection
            data={relatedEvents.data}
            emptyTitle="No Related Events Found"
            emptyStateSubtext="Check back later for more events"
            collectionType="All_Events"
            limit={3}
            page={page}
            totalPages={relatedEvents.totalPages}
            urlParamName="page"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          />
        </section>
      </>
    );
  } catch (error) {
    console.error('Error loading event:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      eventId,
      timestamp: new Date().toISOString(),
    });
    return notFound();
  }
}