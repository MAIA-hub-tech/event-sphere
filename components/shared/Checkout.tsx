// components/shared/Checkout.tsx
"use client"

import { Button } from '../ui/button'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { createStripeSession } from '@/lib/actions/stripe.actions'
import { getStripe } from '@/lib/stripe'
import { CheckoutEventInput } from '@/types'

interface CheckoutProps {
  event: CheckoutEventInput
  userId: string
}

const Checkout = ({ event, userId }: CheckoutProps) => {
  useEffect(() => {
    const query = new URLSearchParams(window.location.search)
    if (query.get('success')) toast.success("Order confirmed!")
    if (query.get('canceled')) toast.warning("Order canceled")
  }, [])

  const handleCheckout = async () => {
    try {
      const session = await createStripeSession({
        eventId: event.id,
        eventTitle: event.title,
        price: event.price,
        isFree: false, // Explicitly false since this component only handles paid events
        buyerId: userId
      })

      const stripe = await getStripe()
      await stripe?.redirectToCheckout({ sessionId: session.id })
    } catch (error) {
      toast.error("Payment failed")
      console.error(error)
    }
  }

  return (
    <Button onClick={handleCheckout} size="lg" className="button sm:w-fit">
      Buy Ticket
    </Button>
  )
}

export default Checkout