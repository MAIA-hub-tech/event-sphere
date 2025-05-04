// ====== USER TYPES ======
export type User = {
    clerkId: string
    firstName: string
    lastName: string
    username: string
    email: string
    photo: string
    createdAt?: Date
    updatedAt?: Date
  }
  
  export type CreateUserParams = Omit<User, 'createdAt' | 'updatedAt'> & {
    path?: string
  }
  
  export type UpdateUserParams = Partial<Omit<User, 'clerkId' | 'email'>> & {
    path?: string
  }
  
  // ====== EVENT TYPES ======
  export interface EventBase {
    id: string;
    _id: string;
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
    url: string;
    userId: string;
    createdAt?: Date;
    updatedAt?: Date;
  }
  
  export interface Event extends EventBase {
    organizer: {
      _id: string;
      firstName: string;
      lastName: string;
      photoURL?: string;
    };
    category?: {
      _id: string;
      name: string;
    };
  }
  
  export type CreateEventParams = {
    userId: string
    event: Omit<EventBase, 'createdAt' | 'updatedAt'>
    path?: string
  }
  
  export type UpdateEventParams = {
    userId: string
    event: {
      _id: string
    } & Partial<EventBase>
    path?: string
  }
  
  export type DeleteEventParams = {
    eventId: string
    path?: string
  }
  
  export type GetAllEventsParams = {
    query?: string
    category?: string
    limit?: number
    page?: number | string
  }
  
  export type GetEventsByUserParams = {
    userId: string
    limit?: number
    page?: number | string
  }
  
  export type GetRelatedEventsByCategoryParams = {
    categoryId: string
    eventId: string
    limit?: number
    page?: number | string
  }
  
  // ====== CATEGORY TYPES ======
  export type Category = {
    _id: string
    name: string
    createdAt?: Date
  }
  
  export type CreateCategoryParams = {
    categoryName: string
    path?: string
  }
  
  // ====== ORDER TYPES ======
  export interface Order {
    id: string;
    eventId: string;
    buyerId: string;
    totalAmount: number;
    status: 'pending' | 'completed' | 'cancelled';
    createdAt: Date;
    event?: Event;
    buyer?: {
      id: string;
      name: string;
      email: string;
    };
    organizer?: {
      _id: string;
      firstName: string;
      lastName: string;
      photoURL?: string;
    };
  }
  
  export interface OrderWithEvent extends Order {
    event: Event;
    buyer: {
      id: string;
      name: string;
      email: string;
    };
  }
  
  export type OrderLegacy = {
    _id: string
    stripeId: string
    eventId: string
    buyerId: string
    totalAmount: string
    createdAt: Date
    event?: {
      title: string
      imageUrl: string
    }
    buyer?: {
      id: string
      name: string
      email: string
    }
  }
  
  export type CheckoutOrderParams = {
    eventTitle: string
    eventId: string
    price: string
    isFree: boolean
    buyerId: string
  }
  
  export type CreateOrderParams = {
    stripeId: string
    eventId: string
    buyerId: string
    totalAmount: string
    createdAt?: Date
  }
  
  export type GetOrdersByEventParams = {
    eventId: string
    searchString?: string
  }
  
  export type GetOrdersByUserParams = {
    userId: string | null
    limit?: number
    page?: string | number | null
  }
  
  // ====== URL QUERY TYPES ======
  export type UrlQueryParams = {
    params: string
    key: string
    value: string | null
  }
  
  export type RemoveUrlQueryParams = {
    params: string
    keysToRemove: string[]
  }
  
  export type SearchParamProps = {
    params: { 
      id: string 
      [key: string]: string 
    }
    searchParams: { 
      [key: string]: string | string[] | undefined 
    }
  }
  
  // ====== UTILITY TYPES ======
  export type Pagination = {
    page: number
    limit: number
    totalPages: number
    totalItems: number
  }
  
  export type ApiResponse<T> = {
    success: boolean
    message?: string
    data?: T
    error?: string
  }
  
  // ====== CHECKOUT TYPES ======
  export interface CheckoutEvent {
    id: string;
    _id?: string;
    title: string;
    price: number;
    isFree: boolean;
    endDateTime: Date;
  }
  
  export type CheckoutEventInput = Pick<CheckoutEvent, 'id' | 'title' | 'price' | 'isFree'>