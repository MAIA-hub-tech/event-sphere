'use server';

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
  getCountFromServer,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { deleteFileFromS3 } from '@/lib/aws/s3';
import { FirestoreEvent, ClientEvent, Category, Organizer } from '@/types/event';
import { revalidatePath } from 'next/cache';
import { toDate } from '@/lib/utils';

// Constants
const EVENTS_PER_PAGE = 6;

// Type Definitions
export interface PaginatedEvents {
  data: ClientEvent[];
  totalPages: number;
  currentPage?: number;
  hasMore?: boolean;
  lastVisible?: DocumentSnapshot;
  currentCategory?: string | null;
}

interface GetAllEventsOptions {
  page?: number;
  limit?: number;
  query?: string;
  category?: string;
  lastVisible?: DocumentSnapshot | null;
}

// Helper Functions
const transformFirestoreEvent = (docData: DocumentData, docId: string): Omit<ClientEvent, 'category' | 'organizer'> => {
  const convertTimestamp = (timestamp: any): string => {
    if (!timestamp) return new Date().toISOString();
    if (timestamp?.toDate) return timestamp.toDate().toISOString();
    if (timestamp instanceof Date) return timestamp.toISOString();
    if (typeof timestamp === 'string' || typeof timestamp === 'number') return new Date(timestamp).toISOString();
    return new Date().toISOString();
  };

  return {
    id: docId,
    title: docData.title || '',
    description: docData.description || '',
    imageUrl: docData.imageUrl || '/assets/images/placeholder.jpg',
    isFree: Boolean(docData.isFree),
    price: docData.price ? Number(docData.price) : 0,
    categoryId: docData.categoryId || '',
    startDateTime: convertTimestamp(docData.startDateTime),
    endDateTime: convertTimestamp(docData.endDateTime),
    location: docData.location || '',
    isOnline: Boolean(docData.isOnline),
    url: docData.url || '',
    organizerId: docData.organizerId || docData.userId || '',
    userId: docData.userId || '',
    createdAt: convertTimestamp(docData.createdAt),
    updatedAt: convertTimestamp(docData.updatedAt),
  };
};

// Organizer Helpers
const fetchOrganizerDetails = async (organizerId: string): Promise<Organizer> => {
  if (!organizerId) {
    return { id: '', firstName: 'Unknown', lastName: 'Organizer' };
  }

  try {
    const organizerDoc = await getDoc(doc(db, 'users', organizerId));
    if (!organizerDoc.exists()) {
      console.warn(`Organizer document ${organizerId} not found`);
      return { id: organizerId, firstName: 'Unknown', lastName: 'Organizer' };
    }

    const data = organizerDoc.data();
    let firstName = data.firstName || '';
    let lastName = data.lastName || '';

    // If firstName and lastName are not set or are default values, try to parse from displayName
    if (
      (!firstName || firstName === 'Unknown') &&
      (!lastName || lastName === 'Organizer') &&
      data.displayName
    ) {
      const nameParts = data.displayName.trim().split(/\s+/);
      if (nameParts.length === 1) {
        firstName = nameParts[0];
        lastName = '';
      } else {
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(' ');
      }
    }

    // If still not set, fall back to defaults
    if (!firstName && !lastName) {
      firstName = 'Unknown';
      lastName = 'Organizer';
    }

    return {
      id: organizerDoc.id,
      firstName,
      lastName,
      displayName: data.displayName || undefined,
      email: data.email || undefined,
      photoURL: data.photoURL || undefined,
    };
  } catch (error) {
    console.error(`Error fetching organizer ${organizerId}:`, error);
    return { id: organizerId, firstName: 'Unknown', lastName: 'Organizer' };
  }
};

const fetchOrganizersBatch = async (organizerIds: string[]): Promise<Map<string, Organizer>> => {
  const uniqueIds = [...new Set(organizerIds.filter(id => id))];
  if (uniqueIds.length === 0) return new Map();

  try {
    const snapshot = await getDocs(
      query(collection(db, 'users'), where('__name__', 'in', uniqueIds))
    );

    const organizersMap = new Map<string, Organizer>();
    snapshot.forEach(doc => {
      const data = doc.data();
      let firstName = data.firstName || '';
      let lastName = data.lastName || '';

      // If firstName and lastName are not set or are default values, try to parse from displayName
      if (
        (!firstName || firstName === 'Unknown') &&
        (!lastName || lastName === 'Organizer') &&
        data.displayName
      ) {
        const nameParts = data.displayName.trim().split(/\s+/);
        if (nameParts.length === 1) {
          firstName = nameParts[0];
          lastName = '';
        } else {
          firstName = nameParts[0];
          lastName = nameParts.slice(1).join(' ');
        }
      }

      // If still not set, fall back to defaults
      if (!firstName && !lastName) {
        firstName = 'Unknown';
        lastName = 'Organizer';
      }

      organizersMap.set(doc.id, {
        id: doc.id,
        firstName,
        lastName,
        displayName: data.displayName || undefined,
        email: data.email || undefined,
        photoURL: data.photoURL || undefined,
      });
    });

    uniqueIds.forEach(id => {
      if (!organizersMap.has(id)) {
        organizersMap.set(id, {
          id: id,
          firstName: 'Unknown',
          lastName: 'Organizer',
        });
      }
    });

    return organizersMap;
  } catch (error) {
    console.error('Error batch fetching organizers:', error);
    const fallbackMap = new Map<string, Organizer>();
    uniqueIds.forEach(id => {
      fallbackMap.set(id, {
        id: id,
        firstName: 'Unknown',
        lastName: 'Organizer',
      });
    });
    return fallbackMap;
  }
};

// Category Helpers
const fetchCategoryDetails = async (categoryId: string): Promise<Category | null> => {
  if (!categoryId) return null;

  try {
    const categoryDoc = await getDoc(doc(db, 'categories', categoryId));
    if (!categoryDoc.exists()) return null;

    return {
      id: categoryDoc.id,
      name: categoryDoc.data().name || 'Uncategorized',
    };
  } catch (error) {
    console.error(`Error fetching category ${categoryId}:`, error);
    return null;
  }
};

const fetchCategoriesBatch = async (categoryIds: string[]): Promise<Map<string, Category>> => {
  const uniqueIds = [...new Set(categoryIds.filter(id => id))];
  if (uniqueIds.length === 0) return new Map();

  try {
    const snapshot = await getDocs(
      query(collection(db, 'categories'), where('__name__', 'in', uniqueIds))
    );

    const categoriesMap = new Map<string, Category>();
    snapshot.forEach(doc => {
      categoriesMap.set(doc.id, {
        id: doc.id,
        name: doc.data().name || 'Uncategorized',
      });
    });

    return categoriesMap;
  } catch (error) {
    console.error('Error batch fetching categories:', error);
    return new Map();
  }
};

// Core CRUD Operations
export const createEvent = async (
  payload: {
    title: string;
    description: string;
    location: string;
    imageUrl?: string;
    isFree: boolean;
    price: number;
    categoryId: string;
    startDateTime: string;
    endDateTime: string;
    url?: string;
    userId: string;
    isOnline?: boolean;
  },
  currentUser: { uid: string; firstName?: string; lastName?: string; photoURL?: string }
): Promise<ClientEvent> => {
  try {
    const { userId, startDateTime, endDateTime, ...eventData } = payload;

    // Validate and convert dates using toDate
    const startDate = toDate(startDateTime);
    const endDate = toDate(endDateTime);

    if (!startDate) {
      throw new Error('Invalid start date');
    }
    if (!endDate) {
      throw new Error('Invalid end date');
    }

    const eventToCreate = {
      ...eventData,
      startDateTime: startDate,
      endDateTime: endDate,
      organizerId: userId,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'events'), eventToCreate);

    const eventDataWithId = {
      ...transformFirestoreEvent(eventToCreate, docRef.id),
      id: docRef.id,
    };
    const category = await fetchCategoryDetails(payload.categoryId);

    revalidatePath('/');
    revalidatePath('/profile');

    return {
      ...eventDataWithId,
      organizer: {
        id: userId,
        firstName: currentUser.firstName || 'Unknown',
        lastName: currentUser.lastName || 'Organizer',
        photoURL: currentUser.photoURL || undefined,
      },
      category,
    };
  } catch (error) {
    console.error('Error creating event:', error);
    throw new Error('Failed to create event');
  }
};

export const getEventById = async (eventId: string): Promise<ClientEvent | null> => {
  try {
    const eventDoc = await getDoc(doc(db, 'events', eventId));
    if (!eventDoc.exists()) {
      console.warn(`Event ${eventId} not found`);
      return null;
    }

    const eventData = eventDoc.data();
    const organizer = await fetchOrganizerDetails(eventData.organizerId || eventData.userId);
    console.log('Fetched organizer for event', eventId, ':', organizer);

    const category = await fetchCategoryDetails(eventData.categoryId);

    return {
      ...transformFirestoreEvent(eventData, eventDoc.id),
      organizer,
      category,
    };
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
  lastVisible = null,
}: GetAllEventsOptions): Promise<PaginatedEvents> => {
  try {
    const eventsRef = collection(db, 'events');
    let q = query(eventsRef, orderBy('createdAt', 'desc'));

    let categoryId = '';
    if (category) {
      const categoriesQuery = query(
        collection(db, 'categories'),
        where('name', '==', category),
        firestoreLimit(1)
      );
      const categorySnapshot = await getDocs(categoriesQuery);

      if (categorySnapshot.empty) {
        console.warn(`No category found with name: ${category}`);
        return {
          data: [],
          totalPages: 0,
          currentPage: page,
          hasMore: false,
          lastVisible: undefined,
          currentCategory: category,
        };
      }

      categoryId = categorySnapshot.docs[0].id;
      q = query(q, where('categoryId', '==', categoryId));
    }

    const totalSnapshot = await getCountFromServer(q);
    const totalEvents = totalSnapshot.data().count;
    const totalPages = Math.ceil(totalEvents / limit);

    if (page > 1 && lastVisible) {
      q = query(q, startAfter(lastVisible), firestoreLimit(limit));
    } else if (page > 1) {
      const prevQuery = query(q, firestoreLimit((page - 1) * limit));
      const prevSnapshot = await getDocs(prevQuery);
      const lastDoc = prevSnapshot.docs[prevSnapshot.docs.length - 1];
      q = query(q, startAfter(lastDoc), firestoreLimit(limit));
    } else {
      q = query(q, firestoreLimit(limit));
    }

    const snapshot = await getDocs(q);
    let events: ClientEvent[] = [];

    console.log('Raw Firestore events:', snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate().toISOString() : doc.data().createdAt,
    })));

    const organizerIds = snapshot.docs
      .map(doc => doc.data().organizerId || doc.data().userId)
      .filter(Boolean);
    const categoryIds = snapshot.docs.map(doc => doc.data().categoryId).filter(Boolean);

    const [organizersMap, categoriesMap] = await Promise.all([
      fetchOrganizersBatch(organizerIds),
      fetchCategoriesBatch(categoryIds),
    ]);

    events = snapshot.docs.map(doc => {
      const eventData = doc.data();
      const organizerId = eventData.organizerId || eventData.userId;
      const organizer = {
        id: organizerId,
        firstName: organizersMap.get(organizerId)?.firstName || 'Unknown',
        lastName: organizersMap.get(organizerId)?.lastName || 'Organizer',
        displayName: organizersMap.get(organizerId)?.displayName || undefined,
        email: organizersMap.get(organizerId)?.email,
        photoURL: organizersMap.get(organizerId)?.photoURL,
      };

      return {
        ...transformFirestoreEvent(eventData, doc.id),
        organizer,
        category: categoriesMap.get(eventData.categoryId) || null,
      };
    });

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      events = events.filter(
        (event) =>
          event.title.toLowerCase().includes(searchLower) ||
          event.description.toLowerCase().includes(searchLower) ||
          event.location.toLowerCase().includes(searchLower)
      );
    }

    let finalTotalPages = totalPages;
    if (searchQuery) {
      const filteredCount = events.length;
      finalTotalPages = Math.ceil(filteredCount / limit);
    }

    console.log(`Fetched ${events.length} events for page ${page}`);
    console.log('Events:', events.map(e => ({ id: e.id, title: e.title, createdAt: e.createdAt })));

    return {
      data: events,
      totalPages: finalTotalPages,
      currentPage: page,
      hasMore: events.length === limit && page < totalPages,
      lastVisible: snapshot.docs[snapshot.docs.length - 1],
      currentCategory: category || null,
    };
  } catch (error) {
    console.error('Error fetching events:', error);
    return {
      data: [],
      totalPages: 0,
      currentPage: page,
      hasMore: false,
      lastVisible: undefined,
      currentCategory: null,
    };
  }
};

export const getEventsByUser = async ({
  userId,
  page = 1,
  limit = 10,
}: {
  userId: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedEvents> => {
  try {
    console.log('getEventsByUser called with:', { userId, page, limit });

    const eventsRef = collection(db, 'events');
    let q = query(
      eventsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const totalSnapshot = await getCountFromServer(q);
    const totalEvents = totalSnapshot.data().count;
    const totalPages = Math.ceil(totalEvents / limit);

    console.log('Total events for user:', totalEvents, 'Total pages:', totalPages);

    if (page > 1) {
      const prevQuery = query(q, firestoreLimit((page - 1) * limit));
      const prevSnapshot = await getDocs(prevQuery);
      const lastDoc = prevSnapshot.docs[prevSnapshot.docs.length - 1];
      q = query(q, startAfter(lastDoc), firestoreLimit(limit));
    } else {
      q = query(q, firestoreLimit(limit));
    }

    const snapshot = await getDocs(q);

    const rawEvents = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate().toISOString() : doc.data().createdAt,
    }));
    console.log('Raw Firestore user events:', rawEvents);

    const organizerIds = snapshot.docs
      .map(doc => doc.data().organizerId || doc.data().userId)
      .filter(Boolean);
    const organizersMap = await fetchOrganizersBatch(organizerIds);

    const data = snapshot.docs.map(doc => {
      const eventData = doc.data();
      const organizerId = eventData.organizerId || eventData.userId;
      const organizer = {
        id: organizerId,
        firstName: organizersMap.get(organizerId)?.firstName || 'Unknown',
        lastName: organizersMap.get(organizerId)?.lastName || 'Organizer',
        displayName: organizersMap.get(organizerId)?.displayName || undefined,
        email: organizersMap.get(organizerId)?.email,
        photoURL: organizersMap.get(organizerId)?.photoURL,
      };

      return {
        ...transformFirestoreEvent(eventData, doc.id),
        organizer,
        category: null,
      };
    });

    console.log(`Fetched ${data.length} user events for user ${userId} on page ${page}`);
    console.log('User events:', data.map(e => ({ id: e.id, title: e.title, createdAt: e.createdAt })));

    return {
      data,
      totalPages,
      currentPage: page,
      hasMore: data.length === limit && page < totalPages,
      lastVisible: undefined,
    };
  } catch (error) {
    console.error('Error fetching user events:', error);
    return {
      data: [],
      totalPages: 0,
      currentPage: page,
      hasMore: false,
      lastVisible: undefined,
    };
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

    const eventsRef = collection(db, 'events');
    let q = query(
      eventsRef,
      where('categoryId', '==', categoryId),
      where('id', '!=', eventId),
      orderBy('createdAt', 'desc')
    );

    const countSnapshot = await getCountFromServer(q);
    const totalPages = Math.ceil(countSnapshot.data().count / limit);

    if (page > 1) {
      const prevQuery = query(q, firestoreLimit((page - 1) * limit));
      const prevSnapshot = await getDocs(prevQuery);
      const lastDoc = prevSnapshot.docs[prevSnapshot.docs.length - 1];
      q = query(q, startAfter(lastDoc), firestoreLimit(limit));
    } else {
      q = query(q, firestoreLimit(limit));
    }

    const snapshot = await getDocs(q);

    const organizerIds = snapshot.docs
      .map(doc => doc.data().organizerId || doc.data().userId)
      .filter(Boolean);
    const organizersMap = await fetchOrganizersBatch(organizerIds);

    const category = await fetchCategoryDetails(categoryId);

    const data = snapshot.docs.map(doc => {
      const eventData = doc.data();
      const organizerId = eventData.organizerId || eventData.userId;
      const organizer = {
        id: organizerId,
        firstName: organizersMap.get(organizerId)?.firstName || 'Unknown',
        lastName: organizersMap.get(organizerId)?.lastName || 'Organizer',
        displayName: organizersMap.get(organizerId)?.displayName || undefined,
        email: organizersMap.get(organizerId)?.email,
        photoURL: organizersMap.get(organizerId)?.photoURL,
      };

      return {
        ...transformFirestoreEvent(eventData, doc.id),
        organizer,
        category: category || { id: categoryId, name: 'Uncategorized' },
      };
    });

    return {
      data,
      totalPages,
      currentPage: page,
      hasMore: data.length === limit && page < totalPages,
      lastVisible: snapshot.docs[snapshot.docs.length - 1],
    };
  } catch (error) {
    console.error('Error in getRelatedEventsByCategory:', error);
    return { data: [], totalPages: 0, currentPage: 1, hasMore: false, lastVisible: undefined };
  }
};

export const updateEvent = async (payload: {
  eventId: string;
  eventData: Partial<Omit<ClientEvent, 'id' | 'createdAt'>>;
  userId: string;
}): Promise<ClientEvent> => {
  try {
    const { eventId, eventData, userId } = payload;
    const eventRef = doc(db, 'events', eventId);
    const eventSnap = await getDoc(eventRef);

    if (!eventSnap.exists()) {
      throw new Error('Event not found');
    }

    if (eventSnap.data().userId !== userId && eventSnap.data().organizerId !== userId) {
      throw new Error('Unauthorized to update this event');
    }

    if (eventData.imageUrl && eventSnap.data().imageUrl && eventSnap.data().imageUrl !== eventData.imageUrl) {
      try {
        await deleteFileFromS3(eventSnap.data().imageUrl);
      } catch (s3Error) {
        console.error('Error deleting old image:', s3Error);
      }
    }

    const updateData: Record<string, any> = {
      updatedAt: serverTimestamp(),
    };

    if (eventData.title !== undefined) updateData.title = eventData.title;
    if (eventData.description !== undefined) updateData.description = eventData.description;
    if (eventData.isFree !== undefined) updateData.isFree = eventData.isFree;
    if (eventData.price !== undefined) updateData.price = eventData.price;
    if (eventData.categoryId !== undefined) updateData.categoryId = eventData.categoryId;
    if (eventData.startDateTime !== undefined) {
      const startDate = toDate(eventData.startDateTime);
      if (startDate) updateData.startDateTime = startDate;
    }
    if (eventData.endDateTime !== undefined) {
      const endDate = toDate(eventData.endDateTime);
      if (endDate) updateData.endDateTime = endDate;
    }
    if (eventData.location !== undefined) updateData.location = eventData.location;
    if (eventData.isOnline !== undefined) updateData.isOnline = eventData.isOnline;
    if (eventData.url !== undefined) updateData.url = eventData.url;
    if (eventData.imageUrl !== undefined) updateData.imageUrl = eventData.imageUrl;

    await updateDoc(eventRef, updateData);

    revalidatePath('/');
    revalidatePath('/profile');
    revalidatePath(`/events/${eventId}`);

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

    if (eventSnap.data().userId !== userId && eventSnap.data().organizerId !== userId) {
      throw new Error('Unauthorized to delete this event');
    }

    if (eventSnap.data().imageUrl) {
      try {
        await deleteFileFromS3(eventSnap.data().imageUrl);
      } catch (s3Error) {
        console.error('Error deleting event image:', s3Error);
      }
    }

    await deleteDoc(eventRef);

    revalidatePath('/');
    revalidatePath('/profile');
  } catch (error) {
    console.error('Error deleting event:', error);
    throw new Error('Failed to delete event');
  }
};

export const getEventsByOrganizer = async (organizerId: string, limit = 6): Promise<ClientEvent[]> => {
  try {
    const q = query(
      collection(db, 'events'),
      where('organizerId', '==', organizerId),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit)
    );

    const snapshot = await getDocs(q);
    const organizerIds = snapshot.docs
      .map(doc => doc.data().organizerId || doc.data().userId)
      .filter(Boolean);
    const organizersMap = await fetchOrganizersBatch(organizerIds);

    return snapshot.docs.map(doc => {
      const eventData = doc.data();
      const organizerId = eventData.organizerId || eventData.userId;
      const organizer = {
        id: organizerId,
        firstName: organizersMap.get(organizerId)?.firstName || 'Unknown',
        lastName: organizersMap.get(organizerId)?.lastName || 'Organizer',
        displayName: organizersMap.get(organizerId)?.displayName || undefined,
        email: organizersMap.get(organizerId)?.email,
        photoURL: organizersMap.get(organizerId)?.photoURL,
      };

      return {
        ...transformFirestoreEvent(eventData, doc.id),
        organizer,
        category: null,
      };
    });
  } catch (error) {
    console.error('Error fetching events by organizer:', error);
    return [];
  }
};

export const searchEvents = async (searchQuery: string, limit = 5): Promise<ClientEvent[]> => {
  try {
    const q = query(
      collection(db, 'events'),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit)
    );

    const snapshot = await getDocs(q);
    const organizerIds = snapshot.docs.map(doc => doc.data().organizerId).filter(Boolean);
    const organizersMap = await fetchOrganizersBatch(organizerIds);

    let events = snapshot.docs.map(doc => {
      const eventData = doc.data();
      const organizerId = eventData.organizerId || eventData.userId;
      const organizer = {
        id: organizerId,
        firstName: organizersMap.get(organizerId)?.firstName || 'Unknown',
        lastName: organizersMap.get(organizerId)?.lastName || 'Organizer',
        displayName: organizersMap.get(organizerId)?.displayName || undefined,
        email: organizersMap.get(organizerId)?.email,
        photoURL: organizersMap.get(organizerId)?.photoURL,
      };

      return {
        ...transformFirestoreEvent(eventData, doc.id),
        organizer,
        category: null,
      };
    });

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      events = events.filter(
        (event) =>
          event.title.toLowerCase().includes(searchLower) ||
          event.description.toLowerCase().includes(searchLower) ||
          event.location.toLowerCase().includes(searchLower)
      );
    }

    return events;
  } catch (error) {
    console.error('Error searching events:', error);
    return [];
  }
};