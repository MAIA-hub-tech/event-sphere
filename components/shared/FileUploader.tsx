'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { getAuth, getIdToken } from 'firebase/auth';
import { toast } from 'sonner';
import Image from 'next/image';
import { getSafeImageUrl } from '@/lib/imageUtils';

type FileUploaderProps = {
  onFieldChange: (url: string) => void;
  imageUrl?: string;
  setFiles: (files: File[]) => void;
  eventId?: string;
  maxSizeMB?: number;
  disabled?: boolean;
  acceptedTypes?: string[];
  className?: string; // Add className prop
};

export function FileUploader({
  imageUrl = '',
  onFieldChange,
  setFiles,
  eventId,
  maxSizeMB = 5,
  disabled = false,
  acceptedTypes = ['.png', '.jpg', '.jpeg', '.webp'],
  className = '',
}: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const auth = getAuth();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled) return;
    if (!acceptedFiles.length) return;

    const file = acceptedFiles[0];
    const maxSize = maxSizeMB * 1024 * 1024;

    if (file.size > maxSize) {
      toast.error(`File too large (max ${maxSizeMB}MB)`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setFiles(acceptedFiles);
    const toastId = toast.loading(`Uploading (0%)...`);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Please sign in to upload files');

      const token = await getIdToken(user, true);

      const response = await fetch('/api/generate-upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          eventId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get upload URL');
      }

      const { uploadUrl, key } = await response.json();
      if (!uploadUrl || !key) {
        throw new Error('Invalid response from server');
      }

      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
          toast.loading(`Uploading (${progress}%)...`, { id: toastId });
        }
      };

      const uploadSuccess = await new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(true);
          } else {
            reject(new Error(`Upload failed: ${xhr.status} - ${xhr.statusText} - Response: ${xhr.responseText}`));
          }
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.open('PUT', uploadUrl, true);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

      if (!uploadSuccess) {
        throw new Error('Upload failed');
      }

      const imageUrl = `https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${key}`;
      onFieldChange(imageUrl);
      toast.success('Image uploaded successfully!', { id: toastId });
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Upload failed',
        { id: toastId }
      );
      setFiles([]);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [onFieldChange, setFiles, auth, eventId, maxSizeMB, disabled]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': acceptedTypes,
    },
    maxFiles: 1,
    maxSize: maxSizeMB * 1024 * 1024,
    disabled: isUploading || disabled,
  });

  return (
    <div {...getRootProps()} className={`relative group ${className}`}>
      <input {...getInputProps()} />

      <div className={`
        flex justify-center items-center h-72 cursor-pointer
        rounded-xl bg-gray-50 overflow-hidden border-2 border-dashed
        ${isUploading ? 'border-cyan-500' : 'border-gray-300'}
        ${disabled ? 'cursor-not-allowed opacity-70' : 'hover:border-cyan-400'}
        transition-colors duration-300
      `}>
        {isUploading ? (
          <div className="text-center p-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div
                className="bg-cyan-600 h-2.5 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">
              Uploading... {uploadProgress}%
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Please don't close this window
            </p>
          </div>
        ) : imageUrl ? (
          <div className="relative w-full h-full">
            <Image
              src={getSafeImageUrl(imageUrl)}
              alt="Uploaded preview"
              fill
              className="object-cover object-center rounded-xl"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              onError={() => {
                console.error('Image load error:', imageUrl);
                toast.error('Could not load image');
              }}
              unoptimized={process.env.NODE_ENV === 'development'}
            />
            {!disabled && (
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button variant="outline" className="bg-white/90 rounded-full">
                  Change Image
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center p-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-12 h-12 mx-auto mb-4 text-gray-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            <h3 className="font-medium mb-1 text-gray-700">Drag & drop your image</h3>
            <p className="text-sm text-gray-500 mb-4">or click to browse</p>
            <p className="text-xs text-gray-400">
              Supported: {acceptedTypes.join(', ')} (max {maxSizeMB}MB)
            </p>
            {disabled && (
              <p className="text-xs text-red-500 mt-2">Upload disabled</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}