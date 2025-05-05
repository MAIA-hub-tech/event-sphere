"use client";

import { useAuth } from "@/lib/firebase/auth";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAuth, getIdToken, updateProfile } from "firebase/auth";

export function ProfileSection() {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [name, setName] = useState(user?.displayName || "");

  const handleImageUpload = async (file: File) => {
    const uploadToast = toast.loading("Uploading profile photo...");
    
    try {
      setIsUploading(true);
      const token = await getIdToken(getAuth().currentUser!);

      // 1. Get presigned URL
      const urlRes = await fetch('/api/generate-upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          pathPrefix: `users/${user?.uid}`
        })
      });

      if (!urlRes.ok) throw new Error(await urlRes.text());
      const { uploadUrl, key } = await urlRes.json();

      // 2. Upload to S3
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      });
      if (!uploadRes.ok) throw new Error('Upload failed');

      // 3. Update Firebase
      const imageUrl = `https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${key}`;
      
      await Promise.all([
        updateProfile(user!, { 
          displayName: name,
          photoURL: imageUrl 
        }),
        updateDoc(doc(db, "users", user!.uid), {
          displayName: name,
          photoURL: imageUrl,
          updatedAt: new Date().toISOString()
        })
      ]);

      toast.success("Profile updated successfully!", { id: uploadToast });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Profile update failed",
        { id: uploadToast }
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updateToast = toast.loading("Updating profile...");
    
    try {
      await updateProfile(user!, { displayName: name });
      await updateDoc(doc(db, "users", user!.uid), {
        displayName: name,
        updatedAt: new Date().toISOString()
      });
      toast.success("Profile saved!", { id: updateToast });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save profile",
        { id: updateToast }
      );
    }
  };

  return (
    <div className="bg-gray-50 p-6 rounded-2xl shadow-sm">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Profile Information</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Centered avatar with button below */}
        <div className="flex flex-col items-center">
          <Avatar className="h-24 w-24">
            <AvatarImage src={user?.photoURL || ""} />
            <AvatarFallback className="bg-gradient-to-br from-cyan-400 to-blue-500 text-white text-2xl">
              {user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="mt-4">
            <input
              type="file"
              id="profile-upload"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
              className="hidden"
              disabled={isUploading}
            />
            <Button
              type="button"
              variant="outline"
              disabled={isUploading}
              onClick={() => document.getElementById('profile-upload')?.click()}
              className="bg-cyan-500 text-white hover:bg-cyan-600 rounded-full px-6 py-2 text-base font-medium transition-colors shadow-sm"
            >
              {isUploading ? "Uploading..." : "Change Photo"}
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <Input
              id="displayName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              disabled={isUploading}
              className="bg-gray-50 h-12 px-4 rounded-full text-base focus:ring-cyan-500 focus:border-cyan-500 border-none shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <Input
              value={user?.email || ""}
              readOnly
              className="bg-gray-100 h-12 px-4 rounded-full text-base text-gray-500 border-none shadow-sm"
            />
          </div>

          <Button 
            type="submit" 
            disabled={isUploading}
            className="w-full bg-cyan-500 text-white hover:bg-cyan-600 rounded-full h-12 text-base font-medium transition-colors shadow-sm"
          >
            {isUploading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}