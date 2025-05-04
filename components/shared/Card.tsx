'use client';

import { formatDateTime } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { DeleteConfirmation } from './DeleteConfirmation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';

type CardProps = {
  event: {
    id: string;
    title: string;
    imageUrl: string;
    startDateTime: string;
    isFree: boolean;
    price: number;
    category?: { id: string; name: string };
    organizer?: { id: string; firstName: string; lastName: string; photoURL?: string };
    userId: string;
  };
  hasOrderLink?: boolean;
  hidePrice?: boolean;
};

const Card = ({ event, hasOrderLink = false, hidePrice = false }: CardProps) => {
  const [user] = useAuthState(auth);
  const isEventCreator = user?.uid === event.userId;

  console.log('Card rendering with props:', { eventId: event.id, title: event.title, hasOrderLink, hidePrice, isEventCreator });

  // Convert ISO date string to Date object for display
  const startDateTime = new Date(event.startDateTime);
  console.log('Card startDateTime:', startDateTime.toISOString());

  // Get organizer name with proper fallbacks
  const getOrganizerName = () => {
    if (event.organizer?.firstName || event.organizer?.lastName) {
      return `${event.organizer.firstName || ''} ${event.organizer.lastName || ''}`.trim();
    }
    return 'Organizer';
  };

  // Get organizer initial from name
  const getOrganizerInitial = () => {
    const name = getOrganizerName();
    if (name === 'Organizer') return 'O';
    return name.charAt(0).toUpperCase();
  };

  // Get avatar URL with proper fallbacks
  const getOrganizerAvatar = () => {
    return event.organizer?.photoURL || null;
  };

  return (
    <div className="group relative flex min-h-[380px] w-full max-w-[400px] flex-col overflow-hidden rounded-xl bg-white shadow-md transition-all hover:shadow-lg md:min-h-[438px]">
      <Link href={`/events/${event.id}`} className="flex-grow">
        <div className="relative w-full h-[200px] bg-gray-50">
          <Image
            src={event.imageUrl || '/assets/images/event-placeholder.jpg'}
            alt={event.title || 'Event image'}
            fill
            className="object-cover object-center"
            priority={false}
            onError={(e) => {
              console.error(`Error loading image for event ${event.id}:`, event.imageUrl);
              e.currentTarget.src = '/assets/images/event-placeholder.jpg';
            }}
          />
        </div>
      </Link>
    
      {isEventCreator && !hidePrice && (
        <div className="absolute right-2 top-2 flex flex-col gap-4 rounded-xl bg-white p-3 shadow-sm transition-all">
          <Link href={`/events/${event.id}/update`}>
            <Image src="/assets/icons/edit.svg" alt="edit" width={20} height={20} />
          </Link>
          <DeleteConfirmation eventId={event.id} />
        </div>
      )}

      <div className="flex min-h-[230px] flex-col gap-3 p-5 md:gap-4">
        {!hidePrice && (
          <div className="flex gap-2">
            <span className="text-[14px] font-semibold leading-[20px] w-min rounded-full bg-green-400 px-4 py-1 text-green-50">
              {event.isFree ? 'FREE' : `£${event.price.toFixed(2)}`}
            </span>
            {event.category && (
              <p className="text-[14px] font-semibold leading-[20px] w-min rounded-full bg-gray-500/10 px-4 py-1 text-gray-500 line-clamp-1">
                {event.category.name || 'Uncategorized'}
              </p>
            )}
          </div>
        )}

        <p className="md:text-[16px] md:font-medium md:leading-[24px] lg:text-[18px] lg:font-medium lg:leading-[28px] text-gray-500">
          {formatDateTime.date(startDateTime)} - {formatDateTime.time(startDateTime)}
        </p>

        <Link href={`/events/${event.id}`}>
          <p className="text-[20px] font-medium leading-[30px] md:text-[16px] md:font-medium md:leading-[24px] line-clamp-2 flex-1 text-black">{event.title}</p>
        </Link>

        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-2">
            <div className={`h-6 w-6 rounded-full overflow-hidden border border-gray-100 shadow-sm flex items-center justify-center ${
              getOrganizerAvatar() ? '' : 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white'
            }`}>
              {getOrganizerAvatar() ? (
                <Image 
                  src={getOrganizerAvatar() || '/assets/images/placeholder-avatar.png'}
                  alt={getOrganizerName()}
                  width={24}
                  height={24}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    console.error(`Error loading organizer avatar for event ${event.id}:`, getOrganizerAvatar());
                    e.currentTarget.src = '/assets/images/placeholder-avatar.png';
                  }}
                />
              ) : (
                <span className="text-xs font-medium">
                  {getOrganizerInitial()}
                </span>
              )}
            </div>
            <p className="text-[14px] font-medium leading-[20px] md:text-[16px] md:font-medium md:leading-[24px] text-gray-600">
              {getOrganizerName()}
            </p>
          </div>

          {hasOrderLink && (
            <Link href={`/orders?eventId=${event.id}`} className="flex items-center gap-2">
              <p className="text-blue-500 font-semibold">Order Details</p>
              <Image src="/assets/icons/arrow.svg" alt="arrow" width={10} height={10} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Card;