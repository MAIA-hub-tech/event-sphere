import { Timestamp } from 'firebase/firestore';

// Define Category interface
export interface Category {
  id: string;
  name: string;
}

// Define Organizer interface
export interface Organizer {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  photoURL?: string;
}

// Base Event interface
export interface Event {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  startDateTime: string;
  endDateTime: string;
  price: number;
  isFree: boolean;
  categoryId: string;
  userId: string;
  organizerId: string;
  createdAt: string;
  updatedAt: string;
  url?: string;
  location: string;
  isOnline: boolean;
  category?: Category | null;
  organizer?: Organizer | null;
}

// Firestore-specific Event interface
export interface FirestoreEvent extends Omit<Event, 'startDateTime' | 'endDateTime' | 'createdAt' | 'updatedAt'> {
  startDateTime: Timestamp;
  endDateTime: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  category?: Category | null;
  organizer?: Organizer | null;
}

// Client-side Event interface
export interface ClientEvent extends Omit<Event, 'startDateTime' | 'endDateTime' | 'createdAt' | 'updatedAt'> {
  startDateTime: Date | Timestamp | string | undefined | null;
  endDateTime: Date | Timestamp | string | undefined | null;
  createdAt: Date | Timestamp | string | undefined | null;
  updatedAt: Date | Timestamp | string | undefined | null;
}

// Form values interface
export interface EventFormValues {
  title: string;
  description: string;
  location: string;
  imageUrl: string;
  startDateTime: Date;
  endDateTime: Date;
  categoryId: string;
  price: string;
  isFree: boolean;
  url?: string;
  isOnline?: boolean;
}

// Event card props
export interface EventCardProps {
  event: Event;
  hasOrderLink?: boolean;
  hidePrice?: boolean;
}

// Event collection interface
export interface EventCollection {
  data: Event[];
  emptyTitle: string;
  emptyStateSubtext: string;
  collectionType?: 'All_Events' | 'My_Tickets' | 'Events_Organized';
  page: number;
  totalPages?: number;
  limit?: number;
}

// Paginated events interface
export interface PaginatedEvents {
  data: Event[];
  totalPages: number;
  currentPage?: number;
  hasMore?: boolean;
  lastVisible?: unknown;
  currentCategory?: string | null;
}

// Event actions interface
export interface EventActions {
  createEvent: (
    payload: {
      title: string;
      description: string;
      location: string;
      imageFile?: File;
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
  ) => Promise<Event>;
  updateEvent: (payload: {
    eventId: string;
    eventData: Partial<Omit<Event, 'id' | 'createdAt'>>;
    imageFile?: File;
    userId: string;
  }) => Promise<Event>;
  deleteEvent: (payload: { eventId: string; userId: string }) => Promise<void>;
  getEventById: (eventId: string) => Promise<Event | null>;
  getEventByIdAdmin: (eventId: string) => Promise<Event | null>;
  getRelatedEventsByCategory: (params: {
    categoryId: string;
    eventId: string;
    page?: number | string;
    limit?: number;
  }) => Promise<PaginatedEvents>;
  getAllEvents: (options?: {
    page?: number;
    limit?: number;
    query?: string;
    category?: string;
    lastVisible?: unknown;
  }) => Promise<PaginatedEvents>;
  getEventsByUser: (params: {
    userId: string;
    page?: number;
    limit?: number;
  }) => Promise<PaginatedEvents>;
  getEventsByOrganizer: (organizerId: string, limit?: number) => Promise<Event[]>;
  searchEvents: (searchQuery: string, limit?: number) => Promise<Event[]>;
}

// Payload interfaces
export interface CreateEventPayload {
  title: string;
  description: string;
  location: string;
  imageFile?: File;
  isFree: boolean;
  price: number;
  categoryId: string;
  startDateTime: string;
  endDateTime: string;
  url?: string;
  userId: string;
  isOnline?: boolean;
}

export interface UpdateEventPayload {
  eventId: string;
  eventData: Partial<Omit<Event, 'id' | 'createdAt'>>;
  imageFile?: File;
  userId: string;
}

export interface DeleteEventPayload {
  eventId: string;
  userId: string;
}