'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import NavItems from './NavItems';
import MobileNav from './MobileNav';
import Search from '@/components/shared/Search';
import UserButton from './UserButton';

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-cyan-500 to-blue-500 shadow-md">
        <div className="max-w-7xl lg:mx-auto p-5 md:px-10 xl:px-0 w-full flex items-center justify-between">
          <Link href="/" className="w-36">
            <Image 
              src="/assets/images/logo.png" 
              alt="Logo" 
              width={128} 
              height={38} 
              priority
            />
          </Link>
          <div className="w-32"></div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-cyan-500 to-blue-500 shadow-md">
      <div className="max-w-7xl lg:mx-auto p-5 md:px-10 xl:px-0 w-full flex items-center justify-between gap-4">
        <Link href="/" className="w-36">
          <Image 
            src="/assets/images/logo.png" 
            alt="Logo" 
            width={128} 
            height={38} 
            priority
          />
        </Link>

        {/* Search Bar */}
        <div className="hidden md:block flex-1 max-w-md">
          <Search />
        </div>

        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-6">
            {isLoggedIn && <NavItems />}
          </nav>
          
          <div className="flex items-center gap-3">
            <MobileNav />
            {isLoggedIn ? (
              <UserButton />
            ) : (
              <Link 
                href="/sign-in" 
                className="bg-white text-cyan-600 px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition-colors"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;