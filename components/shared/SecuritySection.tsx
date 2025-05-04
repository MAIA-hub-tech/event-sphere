"use client";
import { useState } from "react"; // Added missing import
import { useAuth } from "@/lib/firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";
import { getAuth } from "firebase/auth";

export function SecuritySection() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handlePasswordChange = async () => {
    try {
      const auth = getAuth();
      const credential = EmailAuthProvider.credential(
        user?.email || "", 
        currentPassword
      );

      // 1. Re-authenticate
      await reauthenticateWithCredential(user!, credential);
      
      // 2. Update password
      await updatePassword(user!, newPassword);
      
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Password change failed");
    }
  };

  return (
    <div className="space-y-6 mt-12">
      {/* Password Change Card */}
      <div className="border rounded-lg p-6 shadow">
        <h3 className="text-lg font-medium mb-4">Change Password</h3>
        
        <div className="space-y-4">
          <Input
            type="password"
            placeholder="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            type="password"
            placeholder="New Password (min 6 characters)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={6}
          />
          <Button 
            onClick={handlePasswordChange}
            disabled={!currentPassword || newPassword.length < 6}
            className="mt-4 bg-cyan-500 rounded-md shadow hover:bg-cyan-700"
          >
            Update Password
          </Button>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="border rounded-lg p-6 shadow">
        <h3 className="text-lg font-medium mb-4">Active Sessions</h3>
        <p className="text-sm text-gray-600">
          You're logged in on this device ({typeof window !== 'undefined' ? navigator.userAgent : 'Unknown device'})
        </p>
        <Button variant="outline" className="mt-4 bg-cyan-500 rounded-md shadow hover:bg-cyan-700 text-white">
          Log out from other devices
        </Button>
      </div>
    </div>
  );
}