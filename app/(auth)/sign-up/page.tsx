"use client";

import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { setDoc, doc, getDoc } from "firebase/firestore";
import { toast } from "sonner";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { FirebaseError } from 'firebase/app';
import { useAuth } from "@/lib/firebase/auth";

const SignUp = () => {
  const { googleLogin } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: ""
  });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: ""
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();

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
    const newErrors = {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: ""
    };

    if (!formData.firstName) {
      newErrors.firstName = "First name is required";
      valid = false;
    }

    if (!formData.lastName) {
      newErrors.lastName = "Last name is required";
      valid = false;
    }

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

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
      valid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // 2. Update user profile
      await updateProfile(userCredential.user, {
        displayName: `${formData.firstName} ${formData.lastName}`.trim(),
        photoURL: "/assets/icons/default-avatar.svg"
      });

      // 3. Create user document in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        displayName: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        emailVerified: false,
        provider: 'email',
        photoURL: "/assets/icons/default-avatar.svg",
        uid: userCredential.user.uid
      }, { merge: true });

      toast.success(`Welcome ${formData.firstName}! Account created successfully`, {
        position: "top-center"
      });

      router.push("/");
    } catch (error) {
      const firebaseError = error as FirebaseError;
      console.error("Signup error:", firebaseError);
      
      let errorMessage = "Signup failed. Please try again.";
      switch (firebaseError.code) {
        case "auth/email-already-in-use":
          errorMessage = "Email already in use.";
          setErrors(prev => ({ ...prev, email: errorMessage }));
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid email address.";
          setErrors(prev => ({ ...prev, email: errorMessage }));
          break;
        case "auth/weak-password":
          errorMessage = "Password should be at least 6 characters.";
          setErrors(prev => ({ ...prev, password: errorMessage }));
          break;
      }
      
      toast.error(errorMessage, { position: "bottom-center" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    try {
      const result = await googleLogin();
      const user = result.user;
      
      // Check if the user document exists and update firstName/lastName if necessary
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      let firstName = '';
      let lastName = '';

      if (userDoc.exists()) {
        const userData = userDoc.data();
        // If firstName or lastName are missing or default, parse from displayName
        if (
          (!userData.firstName || userData.firstName === 'Unknown') &&
          (!userData.lastName || userData.lastName === 'Organizer') &&
          user.displayName
        ) {
          const nameParts = user.displayName.trim().split(/\s+/);
          firstName = nameParts[0] || user.email?.split('@')[0] || '';
          lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
        } else {
          firstName = userData.firstName || '';
          lastName = userData.lastName || '';
        }
      } else {
        // New user, parse displayName
        if (user.displayName) {
          const nameParts = user.displayName.trim().split(/\s+/);
          firstName = nameParts[0] || user.email?.split('@')[0] || '';
          lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
        } else {
          firstName = user.email?.split('@')[0] || '';
          lastName = '';
        }
      }

      // Save or update user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        displayName: user.displayName || '',
        firstName: firstName || user.email?.split('@')[0] || '',
        lastName: lastName || '',
        email: user.email || '',
        photoURL: user.photoURL || "/assets/icons/default-avatar.svg",
        provider: 'google',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        emailVerified: user.emailVerified || false,
        uid: user.uid
      }, { merge: true });

      toast.success(`Welcome ${firstName}! Account created successfully`, {
        position: "top-center"
      });

      router.push("/");
    } catch (error) {
      const firebaseError = error as FirebaseError;
      console.error("Google signup error:", firebaseError);
      
      let errorMessage = "Google signup failed. Please try again.";
      if (firebaseError.code === "auth/popup-closed-by-user") {
        errorMessage = "Google signup popup was closed";
      } else if (firebaseError.code === "auth/account-exists-with-different-credential") {
        errorMessage = "An account already exists with this email";
      }
      
      toast.error(errorMessage, { position: "bottom-center" });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-lg animate-fade">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Create Your Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join Event Sphere and start exploring events!
          </p>
        </div>
        
        {/* Google Sign-Up Button */}
        <Button
          variant="outline"
          onClick={handleGoogleSignUp}
          disabled={googleLoading}
          className="w-full h-12 rounded-full flex items-center justify-center gap-2 border-gray-300 hover:bg-gray-50 transition-colors duration-300 shadow-sm hover:shadow-md"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span>{googleLoading ? "Signing up..." : "Sign Up with Google"}</span>
        </Button>

        <div className="flex items-center">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-4 text-gray-500 text-sm">or</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                First Name
              </Label>
              <Input
                id="firstName"
                name="firstName"
                type="text"
                required
                placeholder="John"
                value={formData.firstName}
                onChange={handleChange}
                className={`h-12 rounded-full px-4 ${errors.firstName ? "border-red-500" : "border-gray-300"} focus:ring-cyan-500 focus:border-cyan-500 shadow-sm transition-shadow duration-300 hover:shadow-md`}
              />
              {errors.firstName && (
                <p className="text-sm text-red-600">{errors.firstName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                Last Name
              </Label>
              <Input
                id="lastName"
                name="lastName"
                type="text"
                required
                placeholder="Doe"
                value={formData.lastName}
                onChange={handleChange}
                className={`h-12 rounded-full px-4 ${errors.lastName ? "border-red-500" : "border-gray-300"} focus:ring-cyan-500 focus:border-cyan-500 shadow-sm transition-shadow duration-300 hover:shadow-md`}
              />
              {errors.lastName && (
                <p className="text-sm text-red-600">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email Address
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              className={`h-12 rounded-full px-4 ${errors.email ? "border-red-500" : "border-gray-300"} focus:ring-cyan-500 focus:border-cyan-500 shadow-sm transition-shadow duration-300 hover:shadow-md`}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              placeholder="••••••"
              value={formData.password}
              onChange={handleChange}
              className={`h-12 rounded-full px-4 ${errors.password ? "border-red-500" : "border-gray-300"} focus:ring-cyan-500 focus:border-cyan-500 shadow-sm transition-shadow duration-300 hover:shadow-md`}
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              placeholder="••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`h-12 rounded-full px-4 ${errors.confirmPassword ? "border-red-500" : "border-gray-300"} focus:ring-cyan-500 focus:border-cyan-500 shadow-sm transition-shadow duration-300 hover:shadow-md`}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-600">{errors.confirmPassword}</p>
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
                Creating account...
              </>
            ) : (
              "Sign Up"
            )}
          </Button>
        </form>

        <div className="text-center text-sm text-gray-600">
          <p>
            Already have an account?{' '}
            <Link 
              href="/sign-in" 
              className="font-medium text-cyan-600 hover:text-cyan-500 transition-colors duration-300"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;