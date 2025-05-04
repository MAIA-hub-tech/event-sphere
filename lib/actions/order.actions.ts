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
import { Order, Event, EventBase } from "@/types";

// Helper to safely convert Firestore timestamps
const convertTimestamp = (timestamp: any): Date => {
  if (timestamp?.toDate) return timestamp.toDate();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === "string") return new Date(timestamp);
  return new Date();
};

// Parse raw Firestore event into typed Event
const parseEvent = async (data: DocumentData, id: string): Promise<Event> => {
  try {
    console.log(`Parsing event ${id}:`, data);
    const baseEvent: EventBase = {
      id,
      _id: id,
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
      url: data.url || "",
      userId: data.userId || data.organizerId || "",
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
    };

    console.log(`Base event for ${id}:`, baseEvent);

    let organizer;
    if (data.organizer) {
      organizer = {
        _id: data.organizer.id || data.userId || "unknown",
        firstName: data.organizer.firstName || "",
        lastName: data.organizer.lastName || "",
        photoURL: data.organizer.photoURL || undefined
      };
      console.log(`Organizer from event data for event ${id}:`, organizer);
    } else if (data.userId) {
      try {
        const userSnap = await getDoc(doc(db, "users", data.userId));
        if (userSnap.exists()) {
          const userData = userSnap.data();
          organizer = {
            _id: data.userId,
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            photoURL: userData.photoURL || undefined
          };
          console.log(`Fetched organizer for event ${id}:`, organizer);
        } else {
          console.warn(`User ${data.userId} not found for event ${id}`);
          organizer = {
            _id: data.userId,
            firstName: "Unknown",
            lastName: "Organizer"
          };
        }
      } catch (error) {
        console.error(`Error fetching user ${data.userId} for event ${id}:`, error);
        organizer = {
          _id: data.userId || "unknown",
          firstName: "Unknown",
          lastName: "Organizer"
        };
      }
    } else {
      organizer = {
        _id: "unknown",
        firstName: "Unknown",
        lastName: "Organizer"
      };
      console.log(`No organizer data for event ${id}, using default:`, organizer);
    }

    const event = {
      ...baseEvent,
      organizer,
      category: data.category ? {
        _id: data.category.id || "unknown",
        name: data.category.name || "Uncategorized"
      } : undefined
    };

    console.log(`Parsed event ${id}:`, event);
    return event;
  } catch (error) {
    console.error(`Error parsing event ${id}:`, error);
    throw error;
  }
};

// Check if user has purchased ticket for an event
export const hasUserPurchasedTicket = async (eventId: string, userId: string, retries: number = 3, delayMs: number = 1000): Promise<boolean> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Checking ticket purchase (attempt ${attempt}/${retries}) for event: ${eventId}, user: ${userId}`);
      const q = query(
        collection(db, "orders"),
        where("eventId", "==", eventId),
        where("buyerId", "==", userId),
        where("status", "==", "completed")
      );

      const snapshot = await getDocs(q);
      const purchased = !snapshot.empty;
      console.log(`Purchase check result (attempt ${attempt}):`, purchased);
      if (purchased) return true;
      if (attempt < retries) {
        console.log(`Purchase not found, retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error('Error checking ticket purchase:', error);
      if (attempt < retries) {
        console.log(`Error occurred, retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } else {
        return false;
      }
    }
  }
  return false;
};

// Create an order (used for both free and paid events)
export const createOrder = async (orderData: {
  eventId: string;
  buyerId: string;
  totalAmount: number;
  status?: "pending" | "completed" | "cancelled";
}): Promise<Order> => {
  try {
    const finalStatus = orderData.status || (orderData.totalAmount === 0 ? "completed" : "pending");

    const orderRef = await addDoc(collection(db, "orders"), {
      ...orderData,
      userId: orderData.buyerId,
      status: finalStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      id: orderRef.id,
      ...orderData,
      status: finalStatus,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error("Error creating order:", error);
    throw new Error("Failed to create order");
  }
};

// Fetch a single order by ID with expanded event and user data
export const getOrderById = async (orderId: string): Promise<Order | null> => {
  try {
    const orderDoc = await getDoc(doc(db, "orders", orderId));
    if (!orderDoc.exists()) return null;

    const data = orderDoc.data();
    const order: Order = {
      id: orderDoc.id,
      eventId: data.eventId,
      buyerId: data.userId || data.buyerId,
      totalAmount: Number(data.totalAmount),
      status: data.status || "completed",
      createdAt: convertTimestamp(data.createdAt),
    };

    const eventSnap = await getDoc(doc(db, "events", data.eventId));
    if (eventSnap.exists()) {
      order.event = await parseEvent(eventSnap.data(), eventSnap.id);
      if (order.event.organizer) {
        order.organizer = {
          _id: order.event.organizer._id,
          firstName: order.event.organizer.firstName,
          lastName: order.event.organizer.lastName,
          photoURL: order.event.organizer.photoURL
        };
      }
    }

    const userSnap = await getDoc(doc(db, "users", data.userId || data.buyerId));
    if (userSnap.exists()) {
      order.buyer = {
        id: userSnap.id,
        name: userSnap.data().name || "Unknown",
        email: userSnap.data().email || "",
      };
    }

    return order;
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    return null;
  }
};

// Fetch all orders for a specific user with expanded event data
export const getOrdersByUser = async (userId: string): Promise<Order[]> => {
  try {
    console.log('getOrdersByUser called with userId:', userId);

    const ordersRef = collection(db, "orders");
    const q = query(
      ordersRef,
      where("buyerId", "==", userId),
      orderBy("createdAt", "desc")
    );

    console.log('Querying orders for buyerId:', userId);

    let snapshot;
    try {
      snapshot = await getDocs(q);
    } catch (error) {
      console.error('Error executing getDocs in getOrdersByUser:', error);
      throw error;
    }

    console.log('Snapshot size:', snapshot.size);

    const rawOrders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate().toISOString() : doc.data().createdAt,
    }));
    console.log('Raw Firestore orders:', rawOrders);

    if (snapshot.empty) {
      console.log('No orders found for buyerId:', userId);
      const allOrdersSnapshot = await getDocs(collection(db, "orders"));
      const allOrders = allOrdersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate().toISOString() : doc.data().createdAt,
      }));
      console.log('All orders in Firestore for debugging:', allOrders);
      return [];
    }

    const orders = await Promise.all(
      snapshot.docs.map(async (orderDoc) => {
        const orderData = orderDoc.data();
        const order: Order = {
          id: orderDoc.id,
          eventId: orderData.eventId,
          buyerId: orderData.userId || orderData.buyerId,
          totalAmount: Number(orderData.totalAmount),
          status: orderData.status || "completed",
          createdAt: convertTimestamp(orderData.createdAt),
        };

        console.log('Processing order:', order.id, 'with eventId:', orderData.eventId);

        try {
          const eventSnap = await getDoc(doc(db, "events", orderData.eventId));
          if (eventSnap.exists()) {
            order.event = await parseEvent(eventSnap.data(), eventSnap.id);
            console.log('Fetched event for order:', order.id, 'event:', order.event.title);
            
            if (order.event.organizer) {
              order.organizer = {
                _id: order.event.organizer._id,
                firstName: order.event.organizer.firstName,
                lastName: order.event.organizer.lastName,
                photoURL: order.event.organizer.photoURL
              };
            }
          } else {
            console.warn(`Event ${orderData.eventId} not found for order ${order.id}`);
          }
        } catch (error) {
          console.error(`Error fetching event ${orderData.eventId} for order ${order.id}:`, error);
        }

        return order;
      })
    );

    console.log(`Fetched ${orders.length} orders for user ${userId}:`, orders);

    const filteredOrders = orders.filter(order => !!order.event);
    console.log(`Filtered ${filteredOrders.length} orders with events for user ${userId}:`, filteredOrders);

    return filteredOrders;
  } catch (error) {
    console.error("Error in getOrdersByUser:", error);
    return [];
  }
};

// Fetch all orders for a specific event with filtering capability
export const getOrdersByEvent = async ({
  eventId,
  searchString = "",
}: {
  eventId: string;
  searchString?: string;
}): Promise<
  Array<{
    id: string;
    eventTitle: string;
    buyerName: string;
    buyerEmail: string;
    createdAt: string;
    totalAmount: number;
    status: string;
  }>
> => {
  try {
    console.log('getOrdersByEvent called with eventId:', eventId, 'searchString:', searchString);

    if (!eventId) throw new Error("Event ID is required");

    const ordersRef = collection(db, "orders");
    const q = query(
      ordersRef,
      where("eventId", "==", eventId),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    console.log('Orders snapshot size:', snapshot.size);

    const rawOrders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate().toISOString() : doc.data().createdAt,
    }));
    console.log('Raw orders:', rawOrders);

    const orders = await Promise.all(
      snapshot.docs.map(async (orderDoc) => {
        const data = orderDoc.data();
        
        let eventTitle = "Event Not Found";
        try {
          const eventSnap = await getDoc(doc(db, "events", data.eventId));
          eventTitle = eventSnap.exists() ? eventSnap.data().title : eventTitle;
          console.log(`Fetched event title for order ${orderDoc.id}:`, eventTitle);
        } catch (error) {
          console.error(`Error fetching event ${data.eventId}:`, error);
        }

        let buyerName = "Unknown Buyer";
        let buyerEmail = "";
        try {
          if (data.userId || data.buyerId) {
            const userSnap = await getDoc(doc(db, "users", data.userId || data.buyerId));
            if (userSnap.exists()) {
              const userData = userSnap.data();
              buyerName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || "Attendee";
              buyerEmail = userData.email || "";
              console.log(`Fetched buyer for order ${orderDoc.id}:`, { buyerName, buyerEmail });
            }
          }
        } catch (error) {
          console.error(`Error fetching user ${data.userId || data.buyerId}:`, error);
        }

        return {
          id: orderDoc.id,
          eventTitle,
          buyerName,
          buyerEmail,
          createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
          totalAmount: data.totalAmount ? Number(data.totalAmount) : 0,
          status: data.status || "completed"
        };
      })
    );

    if (searchString) {
      const searchLower = searchString.toLowerCase();
      return orders.filter(order => 
        order.buyerName.toLowerCase().includes(searchLower) ||
        order.buyerEmail.toLowerCase().includes(searchLower) ||
        order.eventTitle.toLowerCase().includes(searchLower)
      );
    }

    return orders;
  } catch (error) {
    console.error("Error in getOrdersByEvent:", error);
    return [];
  }
};