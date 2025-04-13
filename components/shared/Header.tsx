// components/Header.tsx
"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebaseConfig';
import NavItems from './NavItems';
import UserButton from './UserButton'; // Import the new component

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
      <header className='w-full border-b'>
        <div className='max-w-7xl lg:mx-auto p-5 md:px-10 xl:px-0 w-full flex items-center justify-between'>
          <Link href="/" className='w-36'>
            <Image 
              src="/assets/images/logo.png" 
              alt="Logo" 
              width={128} 
              height={38} 
            />
          </Link>
          <div className='w-32'></div>
        </div>
      </header>
    );
  }

  return (
    <header className='w-full border-b'>
      <div className='max-w-7xl lg:mx-auto p-5 md:px-10 xl:px-0 w-full flex items-center justify-between'>
        <Link href="/" className='w-36'>
          <Image 
            src="/assets/images/logo.png" 
            alt="Logo" 
            width={128} 
            height={38} 
          />
        </Link>

        <div className="flex items-center gap-6">
          {isLoggedIn && <NavItems />}
          
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <UserButton />
              </>
            ) : (
              <Link 
                href="/sign-in" 
                className='bg-cyan-300 text-white px-6 py-2 rounded-full'
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