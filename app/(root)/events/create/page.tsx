'use client';

import EventForm from "@/components/shared/EventForm";
import { auth } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { redirect } from "next/navigation";
import { Loader2 } from "lucide-react";

const CreateEvent = () => {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return (
      <div className="max-w-7xl lg:mx-auto p-5 md:px-10 xl:px-0 w-full min-h-[200px] py-28 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  if (!user) {
    redirect('/sign-in');
  }

  return (
    <>
      <section className="bg-blue-50 bg-[radial-gradient(circle,theme(colors.gray.300)_1px,transparent_1px)] bg-cover bg-center py-5 md:py-10">
        <h3 className="max-w-7xl lg:mx-auto p-5 md:px-10 xl:px-0 w-full font-bold text-[28px] leading-[36px] md:text-[36px] md:leading-[44px] text-center sm:text-left animate-fade">
          Create Event
        </h3>
      </section>

      <div className="max-w-7xl lg:mx-auto p-5 md:px-10 xl:px-0 w-full my-8">
        <EventForm 
          userId={user.uid} 
          type="Create" 
          key={user.uid}
        />
      </div>
    </>
  );
};

export default CreateEvent;