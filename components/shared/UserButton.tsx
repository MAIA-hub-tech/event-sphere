"use client";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const UserButton = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Track auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Get user initial (first letter of displayName or email)
  const getUserInitial = () => {
    return currentUser?.displayName?.charAt(0)?.toUpperCase() || 
           currentUser?.email?.charAt(0)?.toUpperCase() || 
           'U';
  };

  // Check if user logged in with Google
  const isGoogleUser = () => {
    return currentUser?.providerData?.some(
      (provider) => provider.providerId === 'google.com'
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 focus:outline-none"
        aria-label="User menu"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <div className={`h-10 w-10 rounded-full overflow-hidden border-2 border-white shadow-md flex items-center justify-center ${
          isGoogleUser() ? '' : 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white'
        }`}>
          {/* Show Google profile picture if available */}
          {isGoogleUser() && currentUser?.photoURL ? (
            <img 
              src={currentUser.photoURL}
              alt="Google profile"
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer" // Needed for Google images
            />
          ) : (
            // Show initial for email/password users
            <span className="text-xl font-medium">
              {getUserInitial()}
            </span>
          )}
        </div>
      </button>

      {/* Dropdown menu remains the same */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-64 rounded-xl bg-white py-2 z-50 border border-gray-100 shadow-xl">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="font-medium text-gray-900 text-lg font-sans">
              {currentUser?.displayName || currentUser?.email?.split("@")[0]}
            </p>
            <p className="text-gray-500 text-sm font-light truncate">
              {currentUser?.email}
            </p>
          </div>
          
          <Link
            href="/account-settings"
            className="flex items-center px-5 py-3 text-gray-700 hover:bg-gray-50 transition-colors text-base font-sans"
            onClick={() => setIsOpen(false)}
          >
            Manage Account
          </Link>
          
          <button
            onClick={handleLogout}
            className="flex items-center w-full text-left px-5 py-3 text-gray-700 hover:bg-gray-50 transition-colors text-base font-sans"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default UserButton;