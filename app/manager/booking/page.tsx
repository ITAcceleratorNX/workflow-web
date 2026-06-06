"use client";

import React from "react";
import { useIsDesktop } from "@/hooks/use-media-query";
import { BottomNav } from "@/components/BottomNav";
import { MeetingRoomsAdmin } from "@/components/meeting-rooms/MeetingRoomsAdmin";
import { MeetingRoomStatistics } from "@/components/meeting-rooms/MeetingRoomStatistics";
import { MeetingRoomCalendar } from "@/components/meeting-rooms/MeetingRoomCalendar";
import { Tabs, TabsContent, TabsList, TabsListScrollArea, TabsTrigger } from "@/components/ui/tabs";
import { Building2, BarChart3, Calendar } from "lucide-react";

export default function ManagerBookingPage() {
  const isDesktop = useIsDesktop();

  return (
    <div className="min-h-screen bg-[#1A1A1A] pb-20">
      <div className="w-full max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-white mb-6">Бронь переговорных</h1>

        <Tabs defaultValue="rooms" className="space-y-6">
          <TabsListScrollArea>
            <TabsList className="flex flex-nowrap flex-shrink-0 gap-1 min-w-0 bg-[#2C2C2E] border border-white/10 p-1">
              <TabsTrigger
              value="rooms"
              className="flex-shrink-0 whitespace-nowrap data-[state=active]:bg-[#E85D2B] data-[state=active]:text-white data-[state=inactive]:text-white/70"
            >
              <Building2 className="w-4 h-4 mr-2" />
              Переговорные
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="flex-shrink-0 whitespace-nowrap data-[state=active]:bg-[#E85D2B] data-[state=active]:text-white data-[state=inactive]:text-white/70"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Аналитика
            </TabsTrigger>
            <TabsTrigger
              value="heatmap"
              className="flex-shrink-0 whitespace-nowrap data-[state=active]:bg-[#E85D2B] data-[state=active]:text-white data-[state=inactive]:text-white/70"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Пики занятости
            </TabsTrigger>
          </TabsList>
          </TabsListScrollArea>

          <TabsContent value="rooms">
            <MeetingRoomsAdmin variant="dark" />
          </TabsContent>
          <TabsContent value="analytics">
            <MeetingRoomStatistics variant="dark" />
          </TabsContent>
          <TabsContent value="heatmap">
            <MeetingRoomCalendar variant="dark" />
          </TabsContent>
        </Tabs>
      </div>
      {!isDesktop && <BottomNav activeTab="booking" />}
    </div>
  );
}
