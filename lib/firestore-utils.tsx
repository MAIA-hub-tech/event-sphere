// lib/firestore-utils.ts
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface FirestoreEvent {
  title?: string;
  description?: string;
  location?: string;
  imageUrl?: string;
  startDateTime?: any; // Can be Timestamp or Date
  endDateTime?: any;   // Can be Timestamp or Date
  categoryId?: string;
  price?: string | number;
  isFree?: boolean;
  url?: string;
  userId?: string;
  createdAt?: any;
  updatedAt?: any;
}

export const getEventById = async (eventId: string): Promise<FirestoreEvent & { id: string }> => {
  const eventRef = doc(db, 'events', eventId);
  const eventSnap = await getDoc(eventRef);
  
  if (!eventSnap.exists()) {
    throw new Error('Event not found');
  }

  return {
    id: eventSnap.id,
    ...eventSnap.data()
  };
};