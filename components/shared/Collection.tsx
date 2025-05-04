'use client';

import React from 'react';
import Card from './Card';
import Pagination from './Pagination';
import { ClientEvent } from '@/types/event';
import { Timestamp } from 'firebase/firestore';
import Link from 'next/link';

type CollectionProps = {
  data: ClientEvent[];
  emptyTitle: string;
  emptyStateSubtext: string;
  collectionType?: 'All_Events' | 'My_Tickets' | 'Events_Organized';
  page: number;
  totalPages?: number;
  urlParamName?: string;
  limit?: number;
  className?: string;
};

// Utility to convert string (ISO date), Date, or Timestamp to Date
const toDate = (value: string | Date | Timestamp | undefined | null): Date => {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === 'string') return new Date(value);
  return new Date();
};

const Collection = ({
  data = [],
  emptyTitle,
  emptyStateSubtext,
  collectionType,
  page,
  totalPages = 0,
  urlParamName = 'page',
  limit,
  className,
}: CollectionProps) => {
  console.log('Collection data before mapping:', data.map(e => ({
    id: e.id,
    title: e.title,
    startDateTime: e.startDateTime,
    organizer: e.organizer,
    category: e.category,
  })));

  return (
    <>
      {data.length > 0 ? (
        <div className="flex flex-col items-center gap-10">
          <ul className={`grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:gap-10 ${className || ''}`}>
            {data.map((event, index) => {
              try {
                const hasOrderLink = collectionType === 'Events_Organized';
                const hidePrice = collectionType === 'My_Tickets';

                const simplifiedEvent = {
                  id: event.id,
                  title: event.title,
                  imageUrl: event.imageUrl,
                  startDateTime: toDate(event.startDateTime).toISOString(),
                  isFree: event.isFree,
                  price: Number(event.price),
                  category: event.category ? { id: event.category.id, name: event.category.name } : undefined,
                  organizer: event.organizer ? {
                    id: event.organizer.id,
                    firstName: event.organizer.firstName || 'Unknown',
                    lastName: event.organizer.lastName || 'Organizer',
                    photoURL: event.organizer.photoURL
                  } : undefined,
                  userId: event.userId
                };

                console.log(`Collection rendering event ${index}:`, simplifiedEvent);

                return (
                  <li key={`${event.id}-${index}`} className="flex justify-center">
                    <Card
                      event={simplifiedEvent}
                      hasOrderLink={hasOrderLink}
                      hidePrice={hidePrice}
                    />
                  </li>
                );
              } catch (error) {
                console.error('Error rendering event in Collection:', { error, eventId: event.id, title: event.title });
                return null;
              }
            })}
          </ul>

          {totalPages > 1 && (
            <Pagination
              urlParamName={urlParamName}
              page={page}
              totalPages={totalPages}
            />
          )}
        </div>
      ) : (
        <div className="flex justify-center items-center max-w-7xl lg:mx-auto p-5 md:px-10 xl:px-0 min-h-[200px] w-full flex-col gap-3 rounded-xl bg-gray-50 py-28 text-center shadow-md">
          <h3 className="font-bold text-xl md:text-2xl text-gray-800">{emptyTitle}</h3>
          <p className="text-sm md:text-base font-medium text-gray-600">{emptyStateSubtext}</p>
        </div>
      )}
    </>
  );
};

export default Collection;