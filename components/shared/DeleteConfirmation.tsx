'use client'

import { useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { doc, deleteDoc } from 'firebase/firestore'
import { db } from '@/firebaseConfig'
import { toast } from 'sonner'
import { deleteFileFromS3 } from '@/lib/aws/s3'

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
} from '@/components/ui/alert-dialog'

interface DeleteConfirmationProps {
  eventId: string
  imageUrl?: string
  redirectPath?: string
}

export const DeleteConfirmation = ({ 
  eventId,
  imageUrl,
  redirectPath = '/events'
}: DeleteConfirmationProps) => {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleDelete = async () => {
    try {
      // Always try to delete from Firestore first
      await deleteDoc(doc(db, 'events', eventId))
      
      // Then attempt S3 deletion if image exists
      if (imageUrl) {
        try {
          await deleteFileFromS3(imageUrl)
        } catch (s3Error) {
          console.error('S3 deletion failed (proceeding anyway):', s3Error)
          // Don't fail the entire operation if S3 deletion fails
        }
      }

      toast.success('Event deleted successfully')
      
      // Redirect if on event detail page
      if (pathname.includes(`/events/${eventId}`)) {
        router.push(redirectPath)
      }
      
      // Refresh the page
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error 
        ? `Failed to delete event: ${error.message}`
        : 'Failed to delete event'
      )
      console.error('Delete error:', error)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button 
          className="p-1 hover:scale-110 transition-transform"
          aria-label="Delete event"
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
            onClick={() => startTransition(handleDelete)}
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
  )
}