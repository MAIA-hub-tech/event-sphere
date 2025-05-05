"use client";

import { useState } from "react";
import { useAuth } from "@/lib/firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword, signOut } from "firebase/auth";
import { getAuth } from "firebase/auth";

export function SecuritySection() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const auth = getAuth();
      const credential = EmailAuthProvider.credential(user.email || "", currentPassword);

      // 1. Re-authenticate
      await reauthenticateWithCredential(user, credential);
      
      // 2. Update password
      await updatePassword(user, newPassword);
      
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Password change failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOutOtherDevices = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const auth = getAuth();
      await signOut(auth);
      toast.success("Signed out from other devices. Please log in again.");
      // Redirect to login page
      window.location.href = "/sign-in";
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to sign out from other devices");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Password Change Card */}
      <div className="bg-gray-50 p-6 rounded-2xl shadow-sm">
        <h3 className="text-2xl font-semibold text-gray-900 mb-4">Change Password</h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <Input
              id="currentPassword"
              type="password"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="bg-gray-50 h-12 px-4 rounded-full text-base focus:ring-cyan-500 focus:border-cyan-500 border-none shadow-sm"
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
              New Password (min 6 characters)
            </label>
            <Input
              id="newPassword"
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              className="bg-gray-50 h-12 px-4 rounded-full text-base focus:ring-cyan-500 focus:border-cyan-500 border-none shadow-sm"
            />
          </div>
          <Button 
            onClick={handlePasswordChange}
            disabled={isLoading || !currentPassword || newPassword.length < 6}
            className="w-full bg-cyan-500 text-white hover:bg-cyan-600 rounded-full h-12 text-base font-medium transition-colors shadow-sm mt-4"
          >
            {isLoading ? "Updating..." : "Update Password"}
          </Button>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="bg-gray-50 p-6 rounded-2xl shadow-sm">
        <h3 className="text-2xl font-semibold text-gray-900 mb-4">Active Sessions</h3>
        <p className="text-sm text-gray-600 mb-4">
          You're logged in on this device ({typeof window !== 'undefined' ? navigator.userAgent : 'Unknown device'})
        </p>
        <Button 
          onClick={handleSignOutOtherDevices}
          disabled={isLoading}
          className="w-full bg-cyan-500 text-white hover:bg-cyan-600 rounded-full h-12 text-base font-medium transition-colors shadow-sm"
        >
          {isLoading ? "Signing Out..." : "Sign Out from Other Devices"}
        </Button>
      </div>
    </div>
  );
}