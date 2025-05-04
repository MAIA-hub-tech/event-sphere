import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Timestamp } from 'firebase/firestore';

// Tailwind class name merger
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Date/Time formatting utilities
const convertToDate = (input: string | Date | Timestamp): Date => {
  if (input instanceof Timestamp) {
    return input.toDate();
  }
  return new Date(input);
}

export const formatDateTime = {
  date: (input: string | Date | Timestamp): string => {
    const date = convertToDate(input);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  },
  time: (input: string | Date | Timestamp): string => {
    const date = convertToDate(input);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  },
  full: (input: string | Date | Timestamp): string => {
    return `${formatDateTime.date(input)} • ${formatDateTime.time(input)}`;
  },
};

// URL Query Parameter Utilities
interface FormUrlQueryParams {
  params: string;
  key: string;
  value: string | null;
}

interface RemoveKeysFromQueryParams {
  params: string;
  keysToRemove: string[];
}

export function formUrlQuery({ params, key, value }: FormUrlQueryParams): string {
  const searchParams = new URLSearchParams(params);
  
  if (value) {
    searchParams.set(key, value);
  } else {
    searchParams.delete(key);
  }

  return `?${searchParams.toString()}`;
}

export function removeKeysFromQuery({ params, keysToRemove }: RemoveKeysFromQueryParams): string {
  const searchParams = new URLSearchParams(params);
  
  keysToRemove.forEach(key => {
    searchParams.delete(key);
  });

  return `?${searchParams.toString()}`;
}

// Simple URL Query Parameter Getter
export function getQueryParam(params: string, key: string): string | null {
  const searchParams = new URLSearchParams(params);
  return searchParams.get(key);
}

// Format price in GBP
export const formatPrice = (amount: number): string => {
  return `£${amount.toFixed(2)}`;
};