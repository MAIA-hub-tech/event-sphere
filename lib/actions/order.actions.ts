import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  orderBy, 
  addDoc, 
  serverTimestamp, 
  DocumentData,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order, BaseEvent } from '@/types';

// Helper to safely convert Firestore timestamps
const convertTimestamp = (timestamp: any): Date => {
  if (timestamp?.toDate) return timestamp.toDate(); // Firestore Timestamp
  if (timestamp instanceof Date) return timestamp; // Already Date
  if (typeof timestamp === 'string') return new Date(timestamp); // ISO string
  return new Date(); // Fallback
};

const parseEvent = (data: DocumentData, id: string): BaseEvent => ({
  id,
  title: data.title || '',
  description: data.description || '',
  imageUrl: data.imageUrl || '',
  isFree: Boolean(data.isFree),
  price: data.price ? Number(data.price) : 0,
  categoryId: data.categoryId || '',
  startDateTime: convertTimestamp(data.startDateTime),
  endDateTime: convertTimestamp(data.endDateTime),
  location: data.location || '',
  isOnline: Boolean(data.isOnline),
  url: data.url,
  userId: data.userId || data.organizerId || '',
  createdAt: convertTimestamp(data.createdAt),
  updatedAt: convertTimestamp(data.updatedAt)
});

export const createOrder = async (orderData: {
  eventId: string;
  buyerId: string;
  totalAmount: number;
  status?: 'pending' | 'completed' | 'cancelled';
}): Promise<Order> => {
  try {
    // Ensure status has a value
    const finalStatus = orderData.status || 'completed';
    
    const orderRef = await addDoc(collection(db, 'orders'), {
      eventId: orderData.eventId,
      buyerId: orderData.buyerId,
      totalAmount: orderData.totalAmount,
      status: finalStatus,
      createdAt: serverTimestamp()
    });

    // Return with proper typing
    return {
      id: orderRef.id,
      eventId: orderData.eventId,
      buyerId: orderData.buyerId,
      totalAmount: orderData.totalAmount,
      status: finalStatus, // Now guaranteed to exist
      createdAt: new Date()
    };
  } catch (error) {
    console.error('Error creating order:', error);
    throw new Error('Failed to create order');
  }
};

export const getOrderById = async (orderId: string): Promise<Order | null> => {
  try {
    const orderDoc = await getDoc(doc(db, 'orders', orderId));
    if (!orderDoc.exists()) return null;

    const data = orderDoc.data();
    return {
      id: orderDoc.id,
      eventId: data.eventId,
      buyerId: data.buyerId,
      totalAmount: Number(data.totalAmount),
      status: data.status,
      createdAt: convertTimestamp(data.createdAt)
    };
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
};

export const getOrdersByUser = async (userId: string): Promise<Order[]> => {
  try {
    const q = query(
      collection(db, 'orders'),
      where('buyerId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    
    const orders = await Promise.all(
      snapshot.docs.map(async (orderDoc) => {
        const orderData = orderDoc.data();
        
        const order: Order = {
          id: orderDoc.id,
          eventId: orderData.eventId,
          buyerId: orderData.buyerId,
          totalAmount: Number(orderData.totalAmount),
          status: orderData.status || 'completed',
          createdAt: convertTimestamp(orderData.createdAt)
        };

        const eventSnap = await getDoc(doc(db, 'events', orderData.eventId));
        if (eventSnap.exists()) {
          order.event = parseEvent(eventSnap.data(), eventSnap.id);
        }

        return order;
      })
    );

    return orders;
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
};