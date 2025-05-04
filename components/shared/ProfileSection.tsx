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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Updated: Centered avatar (h-32 w-32) with button below */}
      <div className="flex flex-col items-center mt-10">
        <Avatar className="h-32 w-32">
          <AvatarImage src={user?.photoURL || ""} />
          <AvatarFallback>
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
            className="bg-cyan-500 rounded-full h-[54px]  text-[16px] font-medium leading-[24px] hidden sm:flex text-white"
          >
            {isUploading ? "Uploading..." : "Change Photo"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 mt-19">
        <div>
          <label htmlFor="displayName" className="b text-[16px] font-medium leading-[24px]">
            Full Name
          </label>
          <Input
            id="displayName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            disabled={isUploading}
            className="bg-gray-50 h-[54px] focus-visible:ring-offset-0 placeholder:text-gray-500 rounded-full text-[16px] font-medium leading-[24px px-4 py-3 border-none focus-visible:ring-transparent border-0 bg-gray-50"
          />
        </div>

        <div>
          <label className=" text-[16px] font-medium leading-[24px]">Email</label>
          <Input
            value={user?.email || ""}
            readOnly
            className="bg-gray-50 h-[54px] focus-visible:ring-offset-0 placeholder:text-gray-500 rounded-full text-[16px] font-medium leading-[24px px-4 py-3 border-none focus-visible:ring-transparent border-0 bg-gray-50"
          />
        </div>

        <Button type="submit" disabled={isUploading}
         size="lg"
         className="bg-cyan-500 rounded-full h-[54px] text-[16px] font-normal leading-[24px]  hover:bg-cyan-700 hover:w-full hover:py-6"
        >
          {isUploading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}