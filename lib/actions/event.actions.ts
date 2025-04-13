import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit as firestoreLimit,
  startAfter,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  DocumentData,
  DocumentSnapshot,
  getCountFromServer
} from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { deleteFileFromS3, uploadFileToS3 } from '@/lib/aws/s3';
import { FirebaseError } from 'firebase/app';

// Constants
const EVENTS_PER_PAGE = 6;

// Type Definitions
interface Category {
  id: string;
  name: string;
}

interface Organizer {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  photoURL?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  isFree: boolean;
  price: number;
  categoryId: string;
  category?: Category | null;
  startDateTime: Date;
  endDateTime: Date;
  location: string;
  isOnline: boolean;
  url?: string;
  organizerId: string;
  organizer?: Organizer | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PaginatedEvents {
  data: Event[];
  totalPages: number;
  currentPage?: number;
  hasMore?: boolean;
  lastVisible?: DocumentSnapshot;
}

interface GetAllEventsOptions {
  page?: number;
  limit?: number;
  query?: string;
  category?: string;
  lastVisible?: DocumentSnapshot | null;
}

interface User {
  uid: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  photoURL?: string;
}

// Helper Functions
const transformFirestoreEvent = (docData: DocumentData, docId: string): Omit<Event, 'category' | 'organizer'> => {
  const convertTimestamp = (timestamp: any): Date => {
    if (timestamp?.toDate) return timestamp.toDate();
    if (timestamp instanceof Date) return timestamp;
    if (typeof timestamp === 'string' || typeof timestamp === 'number') return new Date(timestamp);
    return new Date();
  };

  return {
    id: docId,
    title: docData.title || '',
    description: docData.description || '',
    imageUrl: docData.imageUrl || '',
    isFree: Boolean(docData.isFree),
    price: docData.price ? Number(docData.price) : 0,
    categoryId: docData.categoryId || '',
    startDateTime: convertTimestamp(docData.startDateTime),
    endDateTime: convertTimestamp(docData.endDateTime),
    location: docData.location || '',
    isOnline: Boolean(docData.isOnline),
    url: docData.url,
    organizerId: docData.organizerId || docData.userId || '',
    userId: docData.userId || docData.organizerId || '',
    createdAt: convertTimestamp(docData.createdAt),
    updatedAt: convertTimestamp(docData.updatedAt)
  };
};

// Core CRUD Operations

// CREATE
export const createEvent = async (
  payload: {
    title: string;
    description: string;
    location: string;
    imageFile?: File;
    isFree: boolean;
    price: number;
    categoryId: string;
    startDateTime: Date;
    endDateTime: Date;
    url?: string;
    userId: string;
    isOnline?: boolean;
  },
  currentUser: User
): Promise<Event> => {
  try {
    const { imageFile, userId, ...eventData } = payload;

    if (!currentUser?.uid) {
      throw new Error('User not authenticated');
    }

    // Upload image if provided
    let imageUrl = '';
    if (imageFile) {
      imageUrl = await uploadFileToS3(
        imageFile,
        `events/${userId}/${Date.now()}_${imageFile.name}`,
        { isPublic: true }
      );
    }

    const eventToCreate = {
      ...eventData,
      imageUrl,
      organizerId: userId,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'events'), eventToCreate);
    
    return {
      ...transformFirestoreEvent(eventToCreate, docRef.id),
      id: docRef.id
    };
  } catch (error) {
    console.error('Error creating event:', error);
    throw new Error('Failed to create event');
  }
};

// READ
export const getEventById = async (eventId: string): Promise<Event | null> => {
  try {
    const eventDoc = await getDoc(doc(db, "events", eventId));
    if (!eventDoc.exists()) return null;

    const eventData = eventDoc.data();
    const baseEvent = transformFirestoreEvent(eventData, eventDoc.id);

    // Ensure price is number type
    const processedEvent = {
      ...baseEvent,
      price: typeof eventData.price === 'string' ? parseFloat(eventData.price) : eventData.price,
      organizer: eventData.organizerId ? {
        id: eventData.organizerId,
        firstName: eventData.organizer?.firstName,
        lastName: eventData.organizer?.lastName,
        photoURL: eventData.organizer?.photoURL
      } : null,
      category: eventData.categoryId ? {
        id: eventData.categoryId,
        name: eventData.category?.name || 'Uncategorized'
      } : null
    };

    return processedEvent;
  } catch (error) {
    console.error('Error in getEventById:', error);
    return null;
  }
};

export const getAllEvents = async ({
  page = 1,
  limit = EVENTS_PER_PAGE,
  query: searchQuery = '',
  category = '',
  lastVisible = null
}: GetAllEventsOptions): Promise<PaginatedEvents> => {
  try {
    const eventsRef = collection(db, 'events');
    let q = query(eventsRef, orderBy('createdAt', 'desc'));

    if (searchQuery) {
      q = query(q, 
        where('title', '>=', searchQuery),
        where('title', '<=', searchQuery + '\uf8ff')
      );
    }

    if (category) {
      q = query(q, where('categoryId', '==', category));
    }

    const totalSnapshot = await getCountFromServer(q);
    const totalPages = Math.ceil(totalSnapshot.data().count / limit);

    q = query(q, firestoreLimit(limit));
    
    if (page > 1) {
      if (lastVisible) {
        q = query(q, startAfter(lastVisible), firestoreLimit(limit));
      } else {
        const prevQuery = query(q, firestoreLimit((page - 1) * limit));
        const snapshot = await getDocs(prevQuery);
        const lastDoc = snapshot.docs[snapshot.docs.length - 1];
        q = query(q, startAfter(lastDoc), firestoreLimit(limit));
      }
    }

    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => transformFirestoreEvent(doc.data(), doc.id));

    return {
      data,
      totalPages,
      currentPage: page,
      hasMore: data.length === limit && page < totalPages,
      lastVisible: snapshot.docs[snapshot.docs.length - 1]
    };
  } catch (error) {
    console.error('Error fetching events:', error);
    return {
      data: [],
      totalPages: 0,
      currentPage: 1,
      hasMore: false
    };
  }
};

export const getEventsByUser = async ({ 
  userId, 
  page = 1, 
  limit = 3 
}: { 
  userId: string; 
  page?: number; 
  limit?: number 
}): Promise<PaginatedEvents> => {
  try {
    const eventsRef = collection(db, 'events');
    const q = query(
      eventsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit)
    );

    const [snapshot, totalSnapshot] = await Promise.all([
      getDocs(q),
      getCountFromServer(query(eventsRef, where('userId', '==', userId)))
    ]);

    return {
      data: snapshot.docs.map(doc => transformFirestoreEvent(doc.data(), doc.id)),
      totalPages: Math.ceil(totalSnapshot.data().count / limit),
      currentPage: page
    };
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
};

export const getRelatedEventsByCategory = async (payload: {
  categoryId: string;
  eventId: string;
  page?: number | string;
  limit?: number;
}): Promise<PaginatedEvents> => {
  try {
    const { categoryId, eventId, limit = 3 } = payload;
    const page = typeof payload.page === 'string' ? parseInt(payload.page) : payload.page || 1;
    
    if (!categoryId) {
      console.error('Missing categoryId in getRelatedEventsByCategory');
      return { data: [], totalPages: 0, currentPage: 1 };
    }

    const eventsRef = collection(db, 'events');
    const q = query(
      eventsRef,
      where('categoryId', '==', categoryId),
      where('id', '!=', eventId),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit)
    );

    const [snapshot, countSnapshot] = await Promise.all([
      getDocs(q),
      getCountFromServer(query(eventsRef, where('categoryId', '==', categoryId)))
    ]);

    return {
      data: snapshot.docs.map(doc => transformFirestoreEvent(doc.data(), doc.id)),
      totalPages: Math.ceil(countSnapshot.data().count / limit),
      currentPage: page
    };
  } catch (error) {
    console.error('Error in getRelatedEventsByCategory:', error);
    return { data: [], totalPages: 0, currentPage: 1 };
  }
};

// UPDATE
export const updateEvent = async (payload: {
  eventId: string;
  eventData: Partial<Omit<Event, 'id' | 'createdAt'>>;
  imageFile?: File;
  userId: string;
}): Promise<Event> => {
  try {
    const { eventId, eventData, imageFile, userId } = payload;
    const eventRef = doc(db, 'events', eventId);
    const eventSnap = await getDoc(eventRef);

    if (!eventSnap.exists()) {
      throw new Error('Event not found');
    }

    // Verify ownership
    if (eventSnap.data().userId !== userId && eventSnap.data().organizerId !== userId) {
      throw new Error('Unauthorized to update this event');
    }

    let imageUrl = eventSnap.data().imageUrl;
    if (imageFile) {
      imageUrl = await uploadFileToS3(
        imageFile,
        `events/${userId}/${eventId}/${Date.now()}_${imageFile.name}`,
        { isPublic: true }
      );
      
      if (eventSnap.data().imageUrl && eventSnap.data().imageUrl !== imageUrl) {
        try {
          await deleteFileFromS3(eventSnap.data().imageUrl);
        } catch (s3Error) {
          console.error('Error deleting old image:', s3Error);
        }
      }
    }

    // Create a new object with only defined values
    const updateData: Record<string, any> = {
      updatedAt: serverTimestamp()
    };

    // Explicitly check and add each possible field
    if (eventData.title !== undefined) updateData.title = eventData.title;
    if (eventData.description !== undefined) updateData.description = eventData.description;
    if (eventData.isFree !== undefined) updateData.isFree = eventData.isFree;
    if (eventData.price !== undefined) updateData.price = eventData.price;
    if (eventData.categoryId !== undefined) updateData.categoryId = eventData.categoryId;
    if (eventData.startDateTime !== undefined) updateData.startDateTime = eventData.startDateTime;
    if (eventData.endDateTime !== undefined) updateData.endDateTime = eventData.endDateTime;
    if (eventData.location !== undefined) updateData.location = eventData.location;
    if (eventData.isOnline !== undefined) updateData.isOnline = eventData.isOnline;
    if (eventData.url !== undefined) updateData.url = eventData.url;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

    await updateDoc(eventRef, updateData);

    // Return updated event
    const updatedEvent = await getEventById(eventId);
    if (!updatedEvent) {
      throw new Error('Failed to fetch updated event');
    }
    return updatedEvent;
  } catch (error) {
    console.error('Error updating event:', error);
    throw new Error('Failed to update event');
  }
};

// DELETE
export const deleteEvent = async (payload: {
  eventId: string;
  userId: string;
}): Promise<void> => {
  try {
    const { eventId, userId } = payload;
    const eventRef = doc(db, 'events', eventId);
    const eventSnap = await getDoc(eventRef);

    if (!eventSnap.exists()) {
      throw new Error('Event not found');
    }

    // Verify ownership
    if (eventSnap.data().userId !== userId && eventSnap.data().organizerId !== userId) {
      throw new Error('Unauthorized to delete this event');
    }

    // Delete associated image if exists
    if (eventSnap.data().imageUrl) {
      try {
        await deleteFileFromS3(eventSnap.data().imageUrl);
      } catch (s3Error) {
        console.error('Error deleting event image:', s3Error);
      }
    }

    await deleteDoc(eventRef);
  } catch (error) {
    console.error('Error deleting event:', error);
    throw new Error('Failed to delete event');
  }
};

// Utility Functions
export const getEventsByOrganizer = async (organizerId: string, limit = 6): Promise<Event[]> => {
  try {
    const q = query(
      collection(db, 'events'),
      where('organizerId', '==', organizerId),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => transformFirestoreEvent(doc.data(), doc.id));
  } catch (error) {
    console.error('Error fetching events by organizer:', error);
    return [];
  }
};

export const searchEvents = async (searchQuery: string, limit = 5): Promise<Event[]> => {
  try {
    const q = query(
      collection(db, 'events'),
      where('title', '>=', searchQuery),
      where('title', '<=', searchQuery + '\uf8ff'),
      orderBy('title'),
      firestoreLimit(limit)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => transformFirestoreEvent(doc.data(), doc.id));
  } catch (error) {
    console.error('Error searching events:', error);
    return [];
  }
};