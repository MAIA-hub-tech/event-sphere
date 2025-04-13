// app/order-success/page.tsx
"use client"

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getEventById } from '@/lib/actions/event.actions'

export default function OrderSuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const eventId = searchParams.get('eventId')
  const [eventTitle, setEventTitle] = useState<string>('')
  const [isFreeEvent, setIsFreeEvent] = useState(false)

  useEffect(() => {
    const verifyOrder = async () => {
      if (sessionId) {
        // Verify Stripe payment
        const response = await fetch(`/api/verify-stripe?session_id=${sessionId}`)
        const data = await response.json()
        
        if (data.success) {
          // Update Firestore order status
          const orderRef = doc(db, 'orders', data.orderId)
          await setDoc(orderRef, { status: 'completed' }, { merge: true })
        }
      } else if (eventId) {
        // Handle free ticket verification
        try {
          const event = await getEventById(eventId)
          if (event) {
            setEventTitle(event.title)
            setIsFreeEvent(true)
            
            // Verify the order exists in Firestore
            const orderRef = doc(db, 'orders', `${eventId}_*`)
            const orderSnap = await getDoc(orderRef)
            if (!orderSnap.exists()) {
              console.error('Free order not found in database')
            }
          }
        } catch (error) {
          console.error('Error verifying free order:', error)
        }
      }
    }

    verifyOrder()
  }, [sessionId, eventId])

  if (isFreeEvent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <h1 className="text-3xl font-bold">Free Ticket Confirmed!</h1>
        <p>Your ticket for {eventTitle} is ready</p>
        <Button asChild>
          <Link href="/profile/orders">View Your Tickets</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <h1 className="text-3xl font-bold">Order Confirmed!</h1>
      <p>Thank you for your purchase. You'll receive an email confirmation shortly.</p>
      <Button asChild>
        <Link href="/profile/orders">View Your Tickets</Link>
      </Button>
    </div>
  )
}