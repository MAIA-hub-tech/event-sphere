import {
  User,
  UserCredential, // Add this import
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../firebase";
import { useEffect, useState } from "react";

// Define the return type for the useAuth hook
interface AuthHook {
  user: User | null;
  loading: boolean;
  emailLogin: (email: string, password: string) => Promise<void>;
  googleLogin: () => Promise<UserCredential>; // Update return type to UserCredential
  logout: () => Promise<void>;
  updateProfile: (data: { displayName?: string; photoURL?: string }) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
}

export const useAuth = (): AuthHook => {
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
    await signInWithEmailAndPassword(auth, email, password);
  };

  const googleLogin = async () => {
    const provider = new GoogleAuthProvider();
    return await signInWithPopup(auth, provider); // This returns a UserCredential
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateUserProfile = async (data: { displayName?: string; photoURL?: string }) => {
    if (!auth.currentUser) throw new Error('No user is signed in');
    await updateProfile(auth.currentUser, data);
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  return {
    user,
    loading,
    emailLogin,
    googleLogin,
    logout,
    updateProfile: updateUserProfile,
    sendPasswordReset,
  };
};