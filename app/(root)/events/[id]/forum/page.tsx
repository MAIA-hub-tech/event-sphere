"use client";

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { useRouter, useParams } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, query, orderBy, addDoc, Timestamp, getDocs, where, getDoc, doc } from 'firebase/firestore';
import { formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Reply } from 'lucide-react';
import { notFound } from 'next/navigation';

export default function EventForumPage() {
  const { id: eventId } = useParams();
  const [user] = useAuthState(auth);
  const router = useRouter();
  const [eventTitle, setEventTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [hasBooked, setHasBooked] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if the user has booked the event
  useEffect(() => {
    const checkBookingStatus = async () => {
      if (!user || !eventId) {
        setLoading(false);
        return;
      }

      try {
        const ordersQuery = query(
          collection(db, 'orders'),
          where('buyerId', '==', user.uid),
          where('eventId', '==', eventId),
          where('status', '==', 'completed')
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        setHasBooked(!ordersSnapshot.empty);

        // Fetch event title
        const eventDoc = await getDoc(doc(db, 'events', eventId as string));
        if (eventDoc.exists()) {
          setEventTitle(eventDoc.data()?.title || 'Event Forum');
        }
      } catch (error) {
        console.error('Error checking booking status or fetching event:', error);
      } finally {
        setLoading(false);
      }
    };

    checkBookingStatus();
  }, [user, eventId]);

  // Fetch comments in real-time
  const commentsQuery = eventId
    ? query(
        collection(db, `events/${eventId}/comments`),
        orderBy('timestamp', 'desc')
      )
    : null;
  const [comments, commentsLoading, commentsError] = useCollection(commentsQuery);

  // Handle posting a new comment
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    try {
      await addDoc(collection(db, `events/${eventId}/comments`), {
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        text: newComment.trim(),
        timestamp: Timestamp.fromDate(new Date()),
      });
      setNewComment('');
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  // Get the first letter of the user's name for the avatar fallback
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  // Check if user logged in with Google
  const isGoogleUser = () => {
    return user?.providerData?.some(
      (provider) => provider.providerId === 'google.com'
    );
  };

  if (loading) {
    return <p className="p-4 text-center text-gray-500 animate-pulse">Loading...</p>;
  }

  if (!user) {
    router.push(`/sign-in?redirect=/events/${eventId}/forum`);
    return null;
  }

  if (!hasBooked) {
    return notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <div className="flex-1 container mx-auto px-4 py-8 md:py-12 lg:px-8 2xl:max-w-7xl">
        {/* Forum Header */}
        <header className="mb-10 border-b border-gray-200 pb-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 animate-fade">
            Forum
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mt-2">
            {eventTitle}
          </h2>
        </header>

        {/* Comment Posting Form */}
        <Card className="p-6 mb-10 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-lg">
          <form onSubmit={handlePostComment} className="flex items-center gap-4">
            <Avatar className="h-10 w-10">
              {isGoogleUser() && user?.photoURL ? (
                <AvatarImage
                  src={user.photoURL}
                  alt="User profile"
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-cyan-400 to-blue-500 text-white font-semibold">
                  {getInitials(user?.displayName || user?.email || 'U')}
                </AvatarFallback>
              )}
            </Avatar>
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts..."
              className="flex-1 bg-white text-lg font-normal leading-[28px] px-6 py-3 border-none rounded-full focus:ring-cyan-500 focus:border-cyan-500 transition-shadow duration-300 shadow-md hover:shadow-lg"
              required
            />
            <Button
              type="submit"
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-full shadow-md hover:shadow-lg transition-shadow duration-300 px-8 py-3 text-base"
            >
              Post Comment
            </Button>
          </form>
        </Card>

        {/* Comments Section */}
        <div className="space-y-4">
          {commentsLoading && <p className="text-center text-gray-500 animate-pulse">Loading comments...</p>}
          {commentsError && (
            <p className="text-center text-red-500">Error loading comments: {commentsError.message}</p>
          )}
          {!commentsLoading && !commentsError && (!comments || comments.empty) && (
            <p className="text-center text-gray-500 text-lg">No comments yet. Be the first to share your thoughts!</p>
          )}
          {comments && comments.docs.map((doc) => {
            const data = doc.data();
            const timestamp = data.timestamp instanceof Timestamp
              ? data.timestamp.toDate()
              : new Date(data.timestamp);
            return (
              <Card
                key={doc.id}
                className="p-5 rounded-xl shadow-md bg-gray-50 hover:shadow-lg hover:scale-[1.01] transition-all duration-300 border-l-4 border-cyan-500"
              >
                <div className="flex items-start gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-cyan-400 to-blue-500 text-white font-semibold">
                      {getInitials(data.userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800 text-lg hover:text-cyan-600 transition-colors cursor-pointer">
                          {data.userName}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDateTime.full(timestamp)}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-cyan-600 transition-colors"
                        onClick={() => console.log('Reply functionality to be implemented')}
                      >
                        <Reply className="h-4 w-4 mr-1" />
                        Reply
                      </Button>
                    </div>
                    <p className="mt-2 text-gray-700 text-base leading-relaxed">{data.text}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}