"use client";

import { useAuth } from "@/lib/firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import Link from "next/link";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { FirebaseError } from 'firebase/app'; // Import FirebaseError for better type safety

export default function SignInPage() {
  const { user, loading: authLoading, emailLogin, googleLogin } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [errors, setErrors] = useState({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    let valid = true;
    const newErrors = { email: "", password: "" };

    if (!formData.email) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
      valid = false;
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
      valid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await emailLogin(formData.email.trim(), formData.password);
      toast.success("Welcome back!", { position: "top-center" });
    } catch (error) {
      const firebaseError = error as FirebaseError; // Cast error to FirebaseError for better type safety
      let errorMessage = "Sign in failed. Please try again.";
      
      switch (firebaseError.code) {
        case "auth/invalid-credential":
          errorMessage = "Invalid email or password";
          setErrors({
            email: "Invalid credentials",
            password: "Invalid credentials"
          });
          break;
        case "auth/user-not-found":
          errorMessage = "No account found with this email";
          setErrors({ ...errors, email: errorMessage });
          break;
        case "auth/wrong-password":
          errorMessage = "Incorrect password";
          setErrors({ ...errors, password: errorMessage });
          break;
        case "auth/too-many-requests":
          errorMessage = "Account temporarily locked. Try again later";
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid email format";
          setErrors({ ...errors, email: errorMessage });
          break;
      }
      
      toast.error(errorMessage, { position: "bottom-center" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const result = await googleLogin();
      const user = result.user;
      
      // Save user data to Firestore
      await setDoc(doc(db, "users", user.uid), {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL || "/assets/icons/default-avatar.svg",
        provider: 'google',
        lastLogin: new Date().toISOString()
      }, { merge: true });
      
      toast.success("Signed in with Google successfully!", { position: "top-center" });
    } catch (error) {
      const firebaseError = error as FirebaseError; // Cast error to FirebaseError for better type safety
      console.error("Google sign in error:", firebaseError);
      
      let errorMessage = "Google sign in failed. Please try again.";
      if (firebaseError.code === "auth/popup-closed-by-user") {
        errorMessage = "Google sign in popup was closed";
      } else if (firebaseError.code === "auth/account-exists-with-different-credential") {
        errorMessage = "An account already exists with this email";
      }
      
      toast.error(errorMessage, { position: "bottom-center" });
    } finally {
      setGoogleLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 via-white to-blue-50">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg animate-fade space-y-6">
        <h2 className="text-2xl font-bold text-center text-gray-800">Sign In to Your Account</h2>
        <p className="text-center text-sm text-gray-600">
          Access your events and start exploring!
        </p>

        {/* Google Sign-In Button */}
        <Button
          variant="outline"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="w-full h-12 rounded-full flex items-center justify-center gap-2 border-gray-300 hover:bg-gray-50 transition-colors duration-300 shadow-sm hover:shadow-md"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span>{googleLoading ? "Signing in..." : "Continue with Google"}</span>
        </Button>

        <div className="flex items-center">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-4 text-gray-500 text-sm">or</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Email</Label>
            <Input
              type="email"
              name="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleChange}
              className={`h-12 rounded-full px-4 ${errors.email ? "border-red-500" : "border-gray-300"} focus:ring-cyan-500 focus:border-cyan-500 shadow-sm transition-shadow duration-300 hover:shadow-md`}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Password</Label>
            <Input
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className={`h-12 rounded-full px-4 ${errors.password ? "border-red-500" : "border-gray-300"} focus:ring-cyan-500 focus:border-cyan-500 shadow-sm transition-shadow duration-300 hover:shadow-md`}
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className={`w-full h-12 rounded-full bg-cyan-500 hover:bg-cyan-600 text-white transition-colors duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 ${
              loading ? "cursor-not-allowed opacity-75" : ""
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 text-white" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <div className="text-center text-sm text-gray-600 space-y-2">
          <div>
            <Link 
              href="/forgot-password" 
              className="text-cyan-600 hover:text-cyan-500 hover:underline transition-colors duration-300"
            >
              Forgot password?
            </Link>
          </div>
          <div>
            Don't have an account?{" "}
            <Link 
              href="/sign-up" 
              className="text-cyan-600 hover:text-cyan-500 hover:underline font-medium transition-colors duration-300"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}