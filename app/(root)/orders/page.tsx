'use client'

import Search from '@/components/shared/Search'
import { getOrdersByEvent } from '@/lib/actions/order.actions'
import { formatDateTime, formatPrice } from '@/lib/utils'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface IOrderItem {
  id: string
  eventTitle: string
  buyerName: string
  createdAt: string
  totalAmount: number
}

const Orders = () => {
  const searchParams = useSearchParams()
  const eventId = searchParams.get('eventId') || ''
  const searchText = searchParams.get('query') || ''

  const [orders, setOrders] = useState<IOrderItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true)
      try {
        const result = await getOrdersByEvent({ eventId, searchString: searchText })
        setOrders(result || [])
      } catch (error) {
        console.error('Error fetching orders:', error)
        setOrders([])
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [eventId, searchText])

  return (
    <>
      <section className="bg-blue-50 bg-[radial-gradient(circle,theme(colors.gray.300)_1px,transparent_1px)] bg-cover bg-center py-5 md:py-10">
        <h3 className="max-w-7xl lg:mx-auto p-5 md:px-10 xl:px-0 w-full font-bold text-[28px] leading-[36px] md:text-[36px] md:leading-[44px] text-center sm:text-left">Orders</h3>
      </section>

      <section className="max-w-7xl lg:mx-auto p-5 md:px-10 xl:px-0 w-full mt-8">
        <Search placeholder="Search buyer name..." />
      </section>

      <section className="max-w-7xl lg:mx-auto p-5 md:px-10 xl:px-0 w-full overflow-x-auto">
        <table className="w-full border-collapse border-t">
          <thead>
            <tr className=" text-[14px] font-medium leading-[20px] border-b text-gray-500">
              <th className="min-w-[250px] py-3 text-left">Order ID</th>
              <th className="min-w-[200px] flex-1 py-3 pr-4 text-left">Event Title</th>
              <th className="min-w-[150px] py-3 text-left">Buyer</th>
              <th className="min-w-[100px] py-3 text-left">Created</th>
              <th className="min-w-[100px] py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-4 text-center text-gray-500">
                  No orders found.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order.id}
                  className="text-[14px] font-normal leading-[20px] lg:text-[16px] lg:font-normal lg:leading-[24px] border-b"
                  style={{ boxSizing: 'border-box' }}
                >
                  <td className="min-w-[250px] py-4 text-blue-500">{order.id}</td>
                  <td className="min-w-[200px] flex-1 py-4 pr-4">{order.eventTitle}</td>
                  <td className="min-w-[150px] py-4">{order.buyerName}</td>
                  <td className="min-w-[100px] py-4">{formatDateTime.full(order.createdAt)}</td>
                  <td className="min-w-[100px] py-4 text-right">{formatPrice(order.totalAmount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </>
  )
}

export default Orders