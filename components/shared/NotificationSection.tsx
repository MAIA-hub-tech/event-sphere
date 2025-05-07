"use client";

import { useState } from "react";
import { useCollection } from "react-firebase-hooks/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { db, auth } from "@/lib/firebase";
import { doc, updateDoc, deleteDoc, collection, query, orderBy } from "firebase/firestore";
import { formatDateTime } from "@/lib/utils";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationSection() {
  const [user] = useAuthState(auth);
  const [notifications, loading, error] = useCollection(
    user ? query(
      collection(db, `users/${user.uid}/notifications`),
      orderBy("timestamp", "desc")
    ) : null
  );
  const [hoveredNotification, setHoveredNotification] = useState<string | null>(null);

  const markAsRead = async (notificationId: string) => {
    if (!user) return;
    
    try {
      await updateDoc(
        doc(db, `users/${user.uid}/notifications/${notificationId}`),
        { read: true }
      );
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  const deleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    
    try {
      await deleteDoc(
        doc(db, `users/${user.uid}/notifications/${notificationId}`)
      );
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const markAllAsRead = async () => {
    if (!user || !notifications) return;
    
    try {
      const unreadNotifications = notifications.docs.filter(doc => !doc.data().read);
      const updatePromises = unreadNotifications.map(doc =>
        updateDoc(doc.ref, { read: true })
      );
      await Promise.all(updatePromises);
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const deleteAllRead = async () => {
    if (!user || !notifications) return;
    
    try {
      const readNotifications = notifications.docs.filter(doc => doc.data().read);
      const deletePromises = readNotifications.map(doc =>
        deleteDoc(doc.ref)
      );
      await Promise.all(deletePromises);
    } catch (err) {
      console.error("Error deleting all read notifications:", err);
    }
  };

  if (loading) return <p className="p-4 text-center text-gray-500 text-lg animate-pulse">Loading notifications...</p>;
  if (error) return <p className="p-4 text-red-500 text-lg">Error loading notifications: {error.message}</p>;
  if (!notifications?.size) return <p className="p-4 text-center text-gray-500 text-lg">No notifications yet</p>;

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white p-8 md:p-10 rounded-3xl shadow-lg animate-fade">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h3 className="text-4xl md:text-5xl font-extrabold text-gray-900">Notifications</h3>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Button
            variant="outline"
            onClick={markAllAsRead}
            className="w-full md:w-auto bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-full shadow-md hover:shadow-lg transition-shadow duration-300 px-6 py-2"
            disabled={!notifications.docs.some(doc => !doc.data().read)}
          >
            Mark All as Read
          </Button>
          <Button
            variant="outline"
            onClick={deleteAllRead}
            className="w-full md:w-auto border-red-600 text-red-600 hover:bg-red-50 font-semibold rounded-full shadow-md hover:shadow-lg transition-shadow duration-300 px-6 py-2"
            disabled={!notifications.docs.some(doc => doc.data().read)}
          >
            Delete All Read
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {notifications.docs.map((doc) => {
            const data = doc.data();
            const timestamp = data.timestamp?.toDate?.() || new Date(data.timestamp);
            const isRead = data.read;
            
            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className={`relative p-5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg ${
                  isRead 
                    ? "bg-white"
                    : "bg-gradient-to-r from-cyan-100 to-blue-100"
                }`}
                onClick={() => !isRead && markAsRead(doc.id)}
                onMouseEnter={() => setHoveredNotification(doc.id)}
                onMouseLeave={() => setHoveredNotification(null)}
              >
                {/* Delete button - only shows when read AND hovered */}
                {isRead && hoveredNotification === doc.id && (
                  <button
                    onClick={(e) => deleteNotification(doc.id, e)}
                    className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-200 transition-colors"
                    aria-label="Delete notification"
                  >
                    <X className="w-5 h-5 text-gray-500 hover:text-red-500" />
                  </button>
                )}

                {/* Notification header */}
                <div className="flex justify-between items-start pr-8">
                  <h3 className={`text-lg font-semibold flex items-center gap-2 ${
                    isRead ? "text-gray-800" : "text-blue-800"
                  }`}>
                    {data.type === "event_booking" && (
                      <span className="text-2xl">🎟️</span>
                    )}
                    {data.title}
                  </h3>
                  
                  {/* Blue dot - only for unread */}
                  {!isRead && (
                    <span className="absolute top-4 right-4 w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 animate-pulse" />
                  )}
                </div>

                <p className={`mt-2 text-base ${
                  isRead ? "text-gray-600" : "text-blue-700"
                }`}>
                  {data.message}
                </p>
                
                <p className="text-sm text-gray-400 mt-2">
                  {formatDateTime.full(timestamp)}
                </p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}