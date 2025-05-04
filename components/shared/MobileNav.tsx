'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Image from "next/image";
import { Separator } from "../ui/separator";
import NavItems from "./NavItems";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

const MobileNav = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading || !isLoggedIn) {
    return null; // Don't render the mobile nav if the user isn't logged in or while loading
  }

  return (
    <nav className="md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-white hover:bg-cyan-600/20">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent className="flex flex-col gap-6 bg-white md:hidden w-3/4 sm:max-w-sm">
          <SheetHeader>
            <SheetTitle className="sr-only">Mobile Navigation</SheetTitle>
          </SheetHeader>
          <div className="flex justify-center">
            <Image 
              src="/assets/images/logo.png"
              alt="logo"
              width={128}
              height={38}
              className="py-4"
            />
          </div>
          <Separator className="border border-gray-100" />
          <div className="flex-1 px-4">
            <NavItems isMobile={true} />
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
};

export default MobileNav;