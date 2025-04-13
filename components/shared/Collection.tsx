"use client";

import React from 'react';
import Card from './Card';
import Pagination from './Pagination';
import { DocumentData, Timestamp } from 'firebase/firestore';
import { Event } from '@/types/event.d';

type CollectionProps = {
  data: Event[];
  emptyTitle: string;
  emptyStateSubtext: string;
  collectionType?: 'All_Events' | 'My_Tickets' | 'Events_Organized';
  page: number;
  totalPages?: number;
  urlParamName?: string;
  limit?: number;
};

const Collection = ({
  data,
  emptyTitle,
  emptyStateSubtext,
  collectionType,
  page,
  totalPages = 0,
  urlParamName = 'page',
  limit
}: CollectionProps) => {
  // Type guard for Firestore DocumentData
  const isDocumentData = (item: any): item is DocumentData => {
    return item && typeof item === 'object' && !('id' in item);
  };

  // Helper function to safely convert to Date
  const toDate = (value: any): Date => {
    if (value === null || value === undefined) return new Date();
    if (value instanceof Date) return value;
    if (typeof value?.toDate === 'function') return value.toDate();
    if (typeof value === 'string') return new Date(value);
    return new Date();
  };

  // Normalize event data to ensure it matches Event type
  const normalizeEvent = (eventData: any): Event => {
    // Ensure we're working with an object
    if (!eventData || typeof eventData !== 'object') {
      return createDefaultEvent();
    }

    // Convert Firestore DocumentData to Event
    return {
      id: eventData.id || '',
      title: eventData.title || '',
      description: eventData.description || '',
      imageUrl: eventData.imageUrl || '/assets/images/placeholder.jpg',
      isFree: Boolean(eventData.isFree),
      price: eventData.price || 0,
      location: eventData.location || '',
      categoryId: eventData.categoryId || '',
      startDateTime: toDate(eventData.startDateTime),
      endDateTime: toDate(eventData.endDateTime),
      url: eventData.url || undefined,
      userId: eventData.userId || eventData.organizerId || '',
      organizerId: eventData.organizerId || '',
      createdAt: toDate(eventData.createdAt),
      updatedAt: toDate(eventData.updatedAt),
      isOnline: Boolean(eventData.isOnline),
      // Optional fields that might come from related data
      ...(eventData.category && { category: eventData.category }),
      ...(eventData.organizer && { organizer: eventData.organizer })
    };
  };

  // Create a default event object
  const createDefaultEvent = (): Event => {
    const now = new Date();
    return {
      id: '',
      title: '',
      description: '',
      imageUrl: '/assets/images/placeholder.jpg',
      isFree: false,
      price: 0,
      location: '',
      categoryId: '',
      startDateTime: now,
      endDateTime: now,
      url: undefined,
      userId: '',
      organizerId: '',
      createdAt: now,
      updatedAt: now,
      isOnline: false
    };
  };

  return (
    <>
      {data?.length > 0 ? (
        <div className="flex flex-col items-center gap-10">
          <ul className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:gap-10">
            {data.map((eventData, index) => {
              try {
                const event = normalizeEvent(eventData);
                const hasOrderLink = collectionType === 'Events_Organized';
                const hidePrice = collectionType === 'My_Tickets';

                return (
                  <li key={event.id || `event-${index}`} className="flex justify-center">
                    <Card
                      event={event}
                      hasOrderLink={hasOrderLink}
                      hidePrice={hidePrice}
                    />
                  </li>
                );
              } catch (error) {
                console.error('Error rendering event:', error);
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
        <div className="flex justify-center items-center max-w-7xl lg:mx-auto p-5 md:px-10 xl:px-0 min-h-[200px] w-full flex-col gap-3 rounded-[14px] bg-gray-50 py-28 text-center">
          <h3 className="font-bold text-[20px] leading-[30px] tracking-[2%] md:font-bold md:text-[28px] md:leading-[36px]">
            {emptyTitle}
          </h3>
          <p className="text-[14px] font-medium leading-[20px]">
            {emptyStateSubtext}
          </p>
        </div>
      )}
    </>
  );
};

export default Collection;