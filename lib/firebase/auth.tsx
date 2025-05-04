// lib/firebase/auth.ts
import {
    User,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    GoogleAuthProvider,
    updateProfile
  } from "firebase/auth";
  import { auth } from "../firebase";
  import { useEffect, useState } from "react";
  
  export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setLoading(false);
      });
      return unsubscribe;
    }, []);
  
    const emailLogin = async (email: string, password: string) => {
      return signInWithEmailAndPassword(auth, email, password);
    };
  
    const googleLogin = async () => {
      const provider = new GoogleAuthProvider();
      return signInWithPopup(auth, provider);
    };
  
    const logout = async () => {
      return signOut(auth);
    };
  
    const updateUserProfile = async (data: { displayName?: string; photoURL?: string }) => {
      if (!auth.currentUser) return;
      return updateProfile(auth.currentUser, data);
    };
  
    return {
      user,
      loading,
      emailLogin, // Now properly exposed
      googleLogin, // Now properly exposed
      logout,
      updateProfile: updateUserProfile
    };
  };