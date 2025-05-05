"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSection } from "@/components/shared/ProfileSection";
import { SecuritySection } from "@/components/shared/SecuritySection"; 
import NotificationSection from "@/components/shared/NotificationSection";

export default function AccountSettingsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-900 md:text-4xl lg:text-5xl">
        Account Settings
      </h1>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-10 bg-gray-100 rounded-full p-1">
          <TabsTrigger 
            value="profile" 
            className="rounded-full py-3 text-gray-700 data-[state=active]:bg-white data-[state=active]:text-cyan-500 data-[state=active]:shadow"
          >
            Profile
          </TabsTrigger>
          <TabsTrigger 
            value="security" 
            className="rounded-full py-3 text-gray-700 data-[state=active]:bg-white data-[state=active]:text-cyan-500 data-[state=active]:shadow"
          >
            Security
          </TabsTrigger>
          <TabsTrigger 
            value="notifications" 
            className="rounded-full py-3 text-gray-700 data-[state=active]:bg-white data-[state=active]:text-cyan-500 data-[state=active]:shadow"
          >
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileSection />
        </TabsContent>

        <TabsContent value="security">
          <SecuritySection /> 
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}