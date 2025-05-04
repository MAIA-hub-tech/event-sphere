'use client';

import { useState } from 'react'; // Added import for useState
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { deleteFileFromS3 } from '@/lib/aws/s3';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface DeleteConfirmationProps {
  eventId: string;
  imageUrl?: string;
  redirectPath?: string;
}

export const DeleteConfirmation = ({ 
  eventId,
  imageUrl,
  redirectPath = '/'
}: DeleteConfirmationProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleDelete = async () => {
    setIsPending(true);
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'events', eventId));
      console.log('Event deleted from Firestore:', eventId);

      // Delete from S3 if image exists
      if (imageUrl) {
        try {
          await deleteFileFromS3(imageUrl);
          console.log('Image deleted from S3:', imageUrl);
        } catch (s3Error) {
          console.error('S3 deletion failed (proceeding anyway):', s3Error);
          toast.warning('Event deleted, but failed to delete associated image.');
        }
      }

      toast.success('Event deleted successfully', {
        description: 'The event has been permanently removed.',
      });

      // Redirect if on event detail page
      if (pathname.includes(`/events/${eventId}`)) {
        router.push(redirectPath);
      }

      router.refresh();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error instanceof Error 
        ? `Failed to delete event: ${error.message}`
        : 'Failed to delete event'
      );
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button 
          className="p-1 hover:scale-110 transition-transform"
          aria-label="Delete event"
          disabled={isPending}
        >
          <Image 
            src="/assets/icons/delete.svg" 
            alt="Delete" 
            width={20} 
            height={20} 
            className="filter hover:brightness-90"
          />
        </button>
      </AlertDialogTrigger>

      <AlertDialogContent className="bg-white max-w-md rounded-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold">
            Confirm Deletion
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600">
            This will permanently delete the event{imageUrl && ' and its associated image'}.
            <br />
            <span className="text-red-500 font-medium">This action cannot be undone.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel 
            disabled={isPending}
            className="mt-2 sm:mt-0"
          >
            Cancel
          </AlertDialogCancel>

          <AlertDialogAction
            disabled={isPending}
            onClick={(e) => {
              e.preventDefault(); // Prevent default behavior
              handleDelete();
            }}
            className="bg-red-600 hover:bg-red-700 focus-visible:ring-red-500 text-white"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">↻</span>
                Deleting...
              </span>
            ) : 'Delete Event'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};