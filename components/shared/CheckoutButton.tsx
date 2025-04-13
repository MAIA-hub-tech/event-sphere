// components/shared/CheckoutButton.tsx
"use client"

import { useAuthState } from 'react-firebase-hooks/auth'
import { auth, db } from '@/lib/firebase'
import { Loader2 } from 'lucide-react'
import Checkout from './Checkout'
import Link from 'next/link'
import { Button } from '../ui/button'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { toast } from 'sonner'

interface CheckoutButtonProps {
  event: {
    id: string
    _id?: string
    title: string
    price: number
    isFree: boolean
    endDateTime: Date
  }
}

const CheckoutButton = ({ event }: CheckoutButtonProps) => {
  const [user, loading, error] = useAuthState(auth)
  const hasEventFinished = new Date(event.endDateTime) < new Date()

  // Normalize the ID field
  const eventId = event._id || event.id

  const handleFreeCheckout = async () => {
    try {
      // Create order directly in Firestore
      const orderRef = doc(db, 'orders', `${eventId}_${user?.uid}_${Date.now()}`)
      await setDoc(orderRef, {
        eventId: eventId,
        buyerId: user?.uid,
        amount: 0,
        currency: 'GBP',
        status: 'completed',
        createdAt: serverTimestamp()
      })
      
      // Redirect to success page
      window.location.href = `/order-success?eventId=${eventId}`
    } catch (error) {
      console.error('Free checkout error:', error)
      toast.error('Failed to process free ticket')
    }
  }

  if (loading) {
    return <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
  }

  if (error) {
    return <p className="p-2 text-red-400">Error loading user</p>
  }

  const checkoutEvent = {
    id: eventId,
    _id: eventId,
    title: event.title,
    price: event.price,
    isFree: event.isFree,
    endDateTime: event.endDateTime
  }

  return (
    <div className="flex items-center gap-3">
      {hasEventFinished ? (
        <p className="p-2 text-red-400">Tickets no longer available</p>
      ) : !user ? (
        <Button asChild className="button rounded-full" size="lg">
          <Link href="/sign-in">Get Tickets</Link>
        </Button>
      ) : event.isFree ? (
        <Button 
          onClick={handleFreeCheckout}
          className="button rounded-full" 
          size="lg"
        >
          Get Free Ticket
        </Button>
      ) : (
        <Checkout event={checkoutEvent} userId={user.uid} />
      )}
    </div>
  )
}

export default CheckoutButton