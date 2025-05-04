// Navigation links
export const headerLinks = [
  { label: 'Home', route: '/' },
  { label: 'Events', route: '/events' },
  { label: 'Create Event', route: '/events/create' },
  { label: 'Profile', route: '/profile' },
] as const;

// Firebase collections
export const COLLECTIONS = {
  EVENTS: 'events',
  USERS: 'users',
  CATEGORIES: 'categories',
} as const;

// AWS S3 configuration
export const S3_CONFIG = {
  BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME!,
  REGION: process.env.AWS_REGION!,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
};

// Event default values
export const eventDefaultValues = {
  title: '',
  description: '',
  location: '',
  imageUrl: '',
  startDateTime: new Date(),
  endDateTime: new Date(),
  categoryId: '',
  price: '0',
  isFree: false,
  url: '',
};

// Reusable types
export type NavLink = {
  label: string;
  route: string;
};

export type S3File = {
  url: string;
  key: string;
  name: string;
};

export type EventFormValues = {
  title: string;
  description: string;
  location: string;
  imageUrl: string;
  startDateTime: Date;
  endDateTime: Date;
  categoryId: string;
  price: string;
  isFree: boolean;
  url: string;
};