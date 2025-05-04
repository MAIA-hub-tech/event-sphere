'use client';

import Search from '@/components/shared/Search';
import { getOrdersByEvent } from '@/lib/actions/order.actions';
import { formatDateTime, formatPrice } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/button';
import Link from 'next/link';

interface IOrderItem {
  id: string;
  eventTitle: string;
  buyerName: string;
  buyerEmail: string;
  createdAt: string;
  totalAmount: number;
  status: string;
}

const Orders = () => {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<IOrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const eventId = searchParams.get('eventId') || '';
        const result = await getOrdersByEvent({ 
          eventId,
          searchString: searchParams.get('query') || ''
        });
        setOrders(result);
      } catch (error) {
        console.error('Failed to load orders:', error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [searchParams]);

  return (
    <>
      <section className="bg-blue-50 bg-[radial-gradient(circle,theme(colors.gray.300)_1px,transparent_1px)] bg-cover bg-center py-5 md:py-10">
        <h3 className="max-w-7xl lg:mx-auto p-5 md:px-10 xl:px-0 w-full font-bold text-[28px] leading-[36px] md:text-[36px] md:leading-[44px] text-center sm:text-left">
          Orders
        </h3>
      </section>

      <section className="max-w-7xl lg:mx-auto p-5 md:px-10 xl:px-0 w-full mt-8">
        <Search placeholder="Search buyer name or email..." />
      </section>

      <section className="max-w-7xl lg:mx-auto p-5 md:px-10 xl:px-0 w-full overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <p>No orders found for this event</p>
            <Button asChild className="mt-4">
              <Link href="/events">Browse Events</Link>
            </Button>
          </div>
        ) : (
          <table className="w-full border-collapse border-t">
            <thead>
              <tr className="text-[14px] font-medium leading-[20px] border-b text-gray-500">
                <th className="min-w-[150px] py-3 text-left">Order ID</th>
                <th className="min-w-[200px] flex-1 py-3 pr-4 text-left">Event</th>
                <th className="min-w-[150px] py-3 text-left">Buyer</th>
                <th className="min-w-[150px] py-3 text-left">Email</th>
                <th className="min-w-[100px] py-3 text-left">Created</th>
                <th className="min-w-[100px] py-3 text-left">Status</th>
                <th className="min-w-[100px] py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="text-[14px] font-normal leading-[20px] lg:text-[16px] lg:font-normal lg:leading-[24px] border-b"
                  style={{ boxSizing: 'border-box' }}
                >
                  <td className="min-w-[150px] py-4 text-blue-500">
                    {order.id.slice(0, 8)}...
                  </td>
                  <td className="min-w-[200px] flex-1 py-4 pr-4">
                    {order.eventTitle}
                  </td>
                  <td className="min-w-[150px] py-4">
                    {order.buyerName}
                  </td>
                  <td className="min-w-[150px] py-4">
                    {order.buyerEmail}
                  </td>
                  <td className="min-w-[100px] py-4">
                    {formatDateTime.full(order.createdAt)}
                  </td>
                  <td className="min-w-[100px] py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      order.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : order.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="min-w-[100px] py-4 text-right">
                    {formatPrice(order.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
};

export default Orders;