"use client";
import { useState } from "react";
import { useCollection } from "react-firebase-hooks/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { db, auth } from "@/lib/firebase";
import { doc, updateDoc, deleteDoc, collection, query, orderBy } from "firebase/firestore";
import { formatDateTime } from "@/lib/utils";
import { X } from "lucide-react";

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

  if (loading) return <p className="p-4 text-center">Loading notifications...</p>;
  if (error) return <p className="p-4 text-red-500">Error loading notifications</p>;
  if (!notifications?.size) return <p className="p-4 text-center text-gray-500">No notifications yet</p>;

  return (
    <div className="space-y-3 p-4">
      {notifications.docs.map((doc) => {
        const data = doc.data();
        const timestamp = data.timestamp?.toDate?.() || new Date(data.timestamp);
        const isRead = data.read;
        
        return (
          <div 
            key={doc.id}
            className={`relative p-4 border rounded-lg transition-all duration-200 hover:shadow-sm ${
              isRead 
                ? "bg-white border-gray-200 cursor-default"
                : "bg-blue-50 border-blue-200 cursor-pointer"
            }`}
            onClick={() => !isRead && markAsRead(doc.id)}
            onMouseEnter={() => setHoveredNotification(doc.id)}
            onMouseLeave={() => setHoveredNotification(null)}
          >
            {/* Delete button - only shows when read AND hovered */}
            {isRead && hoveredNotification === doc.id && (
              <button
                onClick={(e) => deleteNotification(doc.id, e)}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-200 transition-colors"
                aria-label="Delete notification"
              >
                <X className="w-4 h-4 text-gray-500 hover:text-red-500" />
              </button>
            )}

            {/* Notification header */}
            <div className="flex justify-between items-start pr-6">
              <h3 className={`font-medium ${
                isRead ? "text-gray-800" : "text-blue-800"
              }`}>
                {data.title}
              </h3>
              
              {/* Blue dot - only for unread */}
              {!isRead && (
                <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-blue-500" />
              )}
            </div>

            <p className={`mt-1 ${
              isRead ? "text-gray-600" : "text-blue-700"
            }`}>
              {data.message}
            </p>
            
            <p className="text-xs text-gray-400 mt-2">
              {formatDateTime.full(timestamp)}
            </p>
          </div>
        );
      })}
    </div>
  );
}