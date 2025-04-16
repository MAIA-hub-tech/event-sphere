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
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Order, BaseEvent } from "@/types";

// Helper to safely convert Firestore timestamps
const convertTimestamp = (timestamp: any): Date => {
  if (timestamp?.toDate) return timestamp.toDate(); // Firestore Timestamp
  if (timestamp instanceof Date) return timestamp; // Already Date
  if (typeof timestamp === "string") return new Date(timestamp); // ISO string
  return new Date(); // Fallback
};

// Parse raw Firestore event into typed BaseEvent
const parseEvent = (data: DocumentData, id: string): BaseEvent => ({
  id,
  title: data.title || "",
  description: data.description || "",
  imageUrl: data.imageUrl || "",
  isFree: Boolean(data.isFree),
  price: data.price ? Number(data.price) : 0,
  categoryId: data.categoryId || "",
  startDateTime: convertTimestamp(data.startDateTime),
  endDateTime: convertTimestamp(data.endDateTime),
  location: data.location || "",
  isOnline: Boolean(data.isOnline),
  url: data.url,
  userId: data.userId || data.organizerId || "",
  createdAt: convertTimestamp(data.createdAt),
  updatedAt: convertTimestamp(data.updatedAt),
});

// Create an order (only used outside Stripe flow)
export const createOrder = async (orderData: {
  eventId: string;
  buyerId: string;
  totalAmount: number;
  status?: "pending" | "completed" | "cancelled";
}): Promise<Order> => {
  try {
    const finalStatus = orderData.status || "completed";

    const orderRef = await addDoc(collection(db, "orders"), {
      eventId: orderData.eventId,
      buyerId: orderData.buyerId,
      totalAmount: orderData.totalAmount,
      status: finalStatus,
      createdAt: serverTimestamp(),
    });

    return {
      id: orderRef.id,
      eventId: orderData.eventId,
      buyerId: orderData.buyerId,
      totalAmount: orderData.totalAmount,
      status: finalStatus,
      createdAt: new Date(), // fallback; actual timestamp will load via getOrderById
    };
  } catch (error) {
    console.error("🔥 Error creating order:", error);
    throw new Error("Failed to create order");
  }
};

// Fetch a single order by ID
export const getOrderById = async (orderId: string): Promise<Order | null> => {
  try {
    const orderDoc = await getDoc(doc(db, "orders", orderId));
    if (!orderDoc.exists()) return null;

    const data = orderDoc.data();
    return {
      id: orderDoc.id,
      eventId: data.eventId,
      buyerId: data.buyerId,
      totalAmount: Number(data.totalAmount),
      status: data.status,
      createdAt: convertTimestamp(data.createdAt),
    };
  } catch (error) {
    console.error("🔥 Error fetching order by ID:", error);
    return null;
  }
};

// Fetch all orders for a specific user
export const getOrdersByUser = async (userId: string): Promise<Order[]> => {
  try {
    const q = query(
      collection(db, "orders"),
      where("buyerId", "==", userId),
      orderBy("createdAt", "desc")
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
          status: orderData.status || "completed",
          createdAt: convertTimestamp(orderData.createdAt),
        };

        // Expand event info
        const eventSnap = await getDoc(doc(db, "events", orderData.eventId));
        if (eventSnap.exists()) {
          order.event = parseEvent(eventSnap.data(), eventSnap.id);
        }

        return order;
      })
    );

    return orders;
  } catch (error) {
    console.error("🔥 Error fetching user orders:", error);
    throw error;
  }
};

// ✅ Fetch all orders for a specific event and optionally filter by buyer name
export const getOrdersByEvent = async ({
  eventId,
  searchString = "",
}: {
  eventId: string
  searchString?: string
}): Promise<
  {
    id: string
    eventTitle: string
    buyerName: string
    createdAt: string
    totalAmount: number
  }[]
> => {
  try {
    const q = query(
      collection(db, "orders"),
      where("eventId", "==", eventId),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    const orders = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        const orderId = docSnap.id;

        // Fetch event title
        const eventSnap = await getDoc(doc(db, "events", data.eventId));
        const eventTitle = eventSnap.exists() ? eventSnap.data().title || "" : "";

        // Fetch buyer name
        const userSnap = await getDoc(doc(db, "users", data.buyerId));
        const buyerName = userSnap.exists() ? userSnap.data().name || "Unknown" : "Unknown";

        const orderItem = {
          id: orderId,
          eventTitle,
          buyerName,
          createdAt: convertTimestamp(data.createdAt).toISOString(),
          totalAmount: Number(data.totalAmount),
        };

        return orderItem;
      })
    );

    // Optional filter by search text
    const filteredOrders = searchString
      ? orders.filter((order) =>
          order.buyerName.toLowerCase().includes(searchString.toLowerCase())
        )
      : orders;

    return filteredOrders;
  } catch (error) {
    console.error("🔥 Error fetching orders by event:", error);
    return [];
  }
};
