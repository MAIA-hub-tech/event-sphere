import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import qs from 'query-string'
import { UrlQueryParams, RemoveUrlQueryParams } from '@/types'

// Tailwind class merging utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Enhanced date/time formatting with error handling
export const formatDateTime = {
  // Full date with time (e.g., "Mon, Oct 25, 2023 at 8:30 PM")
  full: (date: Date | string | undefined | null): string => {
    try {
      if (!date) return 'Date not available'
      const dateObj = typeof date === 'string' ? new Date(date) : date
      if (isNaN(dateObj.getTime())) return 'Invalid date'
      
      return dateObj.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      })
    } catch {
      return 'Invalid date'
    }
  },

  // Date only (e.g., "Mon, Oct 25, 2023")
  date: (date: Date | string | undefined | null): string => {
    try {
      if (!date) return 'Date not available'
      const dateObj = typeof date === 'string' ? new Date(date) : date
      if (isNaN(dateObj.getTime())) return 'Invalid date'
      
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return 'Invalid date'
    }
  },

  // Time only (e.g., "8:30 PM")
  time: (date: Date | string | undefined | null): string => {
    try {
      if (!date) return 'Time not available'
      const dateObj = typeof date === 'string' ? new Date(date) : date
      if (isNaN(dateObj.getTime())) return 'Invalid time'
      
      return dateObj.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      })
    } catch {
      return 'Invalid time'
    }
  },

  // Month and day (e.g., "Oct 25")
  monthDay: (date: Date | string | undefined | null): string => {
    try {
      if (!date) return 'Date not available'
      const dateObj = typeof date === 'string' ? new Date(date) : date
      if (isNaN(dateObj.getTime())) return 'Invalid date'
      
      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'Invalid date'
    }
  },

  // Returns all formats in one object
  all: (date: Date | string | undefined | null) => ({
    full: formatDateTime.full(date),
    date: formatDateTime.date(date),
    time: formatDateTime.time(date),
    monthDay: formatDateTime.monthDay(date)
  })
}

// File to URL converter
export const convertFileToUrl = (file: File) => URL.createObjectURL(file)

// Price formatting utility
export const formatPrice = (price: string | number) => {
  try {
    const amount = typeof price === 'string' ? parseFloat(price) : price
    if (isNaN(amount)) return '$0.00'
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  } catch {
    return '$0.00'
  }
}

// URL query manipulation utilities
export function formUrlQuery({ params, key, value }: UrlQueryParams) {
  try {
    const currentUrl = qs.parse(params)
    currentUrl[key] = value
    return qs.stringifyUrl(
      {
        url: window.location.pathname,
        query: currentUrl,
      },
      { skipNull: true }
    )
  } catch (error) {
    console.error('Error forming URL query:', error)
    return window.location.pathname
  }
}

export function removeKeysFromQuery({ params, keysToRemove }: RemoveUrlQueryParams) {
  try {
    const currentUrl = qs.parse(params)
    keysToRemove.forEach(key => delete currentUrl[key])
    return qs.stringifyUrl(
      {
        url: window.location.pathname,
        query: currentUrl,
      },
      { skipNull: true }
    )
  } catch (error) {
    console.error('Error removing keys from query:', error)
    return window.location.pathname
  }
}

// Error handling utility
export const handleError = (error: unknown) => {
  console.error(error)
  throw new Error(typeof error === 'string' ? error : JSON.stringify(error))
}

// String utilities
export const capitalize = (str: string) => {
  try {
    return str.charAt(0).toUpperCase() + str.slice(1)
  } catch {
    return str
  }
}

export const truncate = (str: string, length: number) => {
  try {
    return str.length > length ? `${str.substring(0, length)}...` : str
  } catch {
    return str
  }
}

// Image validation
export const isBase64Image = (str: string) => {
  try {
    const base64Regex = /^data:image\/(png|jpe?g|gif|webp);base64,/
    return base64Regex.test(str)
  } catch {
    return false
  }
}

// Firestore timestamp converter
export const convertFirestoreTimestamp = (timestamp: any): Date => {
  try {
    if (timestamp?.toDate) {
      return timestamp.toDate()
    }
    if (timestamp?.seconds) {
      return new Date(timestamp.seconds * 1000)
    }
    return new Date(timestamp)
  } catch {
    return new Date()
  }
}