import { Suspense } from 'react';
import ProfileClient from './ProfileClient';
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl lg:mx-auto p-5 md:px-10 xl:px-0 w-full min-h-[200px] py-28 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
        </div>
      }
    >
      <ProfileClient />
    </Suspense>
  );
}