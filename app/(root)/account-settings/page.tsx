"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSection } from "@/components/shared/ProfileSection";
import { SecuritySection } from "@/components/shared/SecuritySection"; 
import  NotificationSection  from "@/components/shared/NotificationSection";

export default function AccountSettingsPage() {
  return (
    <div className="container mx-auto py-8 max-w-4xl mt-15 ml">
      <h1 className="text-3xl font-bold mb-8 text-center text-[40px] leading-[48px] lg:text-[48px] lg:leading-[60px] xl:text-[58px] xl:leading-[74px]">Account Settings</h1>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
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