import { DocumentSnapshot, Timestamp } from 'firebase/firestore';


export interface BaseEvent {
 id: string;
 title: string;
 description: string;
 imageUrl: string;
 isFree: boolean;
 price: number;
 categoryId: string;
 startDateTime: Date;
 endDateTime: Date;
 location: string;
 isOnline: boolean;
 url?: string;
 organizerId: string;
 userId: string;
 createdAt: Date;
 updatedAt: Date;
}


export interface Event extends BaseEvent {}


export interface CardEvent extends BaseEvent {
 organizer?: {
   name?: string;
   firstName?: string;
   lastName?: string;
   photoURL?: string;
 };
 category?: {
   id: string;
   name: string;
 };
}


export interface EventCreateInput {
 title: string;
 description: string;
 location: string;
 isFree: boolean;
 price: number;
 categoryId: string;
 startDateTime: Date;
 endDateTime: Date;
 url?: string;
 organizerId: string;
 userId: string;
 isOnline?: boolean;
 imageUrl?: string;
}


export interface EventUpdateInput extends Omit<EventCreateInput, 'userId' | 'organizerId'> {
 id: string;
}


export interface PaginatedEvents {
 data: Event[];
 totalPages: number;
 currentPage: number;
 hasMore: boolean;
 lastVisible?: DocumentSnapshot;
}


export interface EventWithRelations {
 event: Event;
 category?: {
   id: string;
   name: string;
 };
 organizer?: {
   id: string;
   name: string;
   email?: string;
   photoURL?: string;
 };
}


export interface FirestoreEventData extends Omit<BaseEvent, 'startDateTime' | 'endDateTime' | 'createdAt' | 'updatedAt'> {
 startDateTime: Timestamp | Date;
 endDateTime: Timestamp | Date;
 createdAt: Timestamp | Date;
 updatedAt: Timestamp | Date;
}


export interface APIEventResponse extends Omit<BaseEvent, 'startDateTime' | 'endDateTime' | 'createdAt' | 'updatedAt'> {
 startDateTime: string;
 endDateTime: string;
 createdAt: string;
 updatedAt: string;
}


export interface EventFormValues {
 title: string;
 description: string;
 location: string;
 isFree: boolean;
 price: number;
 categoryId: string;
 startDateTime: Date | null;
 endDateTime: Date | null;
 url?: string;
 isOnline?: boolean;
 imageFile?: File | null;
 organizerId?: string;
 userId?: string;
}


// Helper type for transformed events
export interface TransformedEvent extends Omit<BaseEvent, 'startDateTime' | 'endDateTime' | 'createdAt' | 'updatedAt'> {
 startDateTime: Date;
 endDateTime: Date;
 createdAt: Date;
 updatedAt: Date;
}
