"use client";

import React, { useState, useEffect } from "react";
import { useIsDesktop } from "@/hooks/use-media-query";
import { BottomNav } from "@/components/BottomNav";
import { MeetingRoomsAdmin } from "@/components/meeting-rooms/MeetingRoomsAdmin";
import { MeetingRoomStatistics } from "@/components/meeting-rooms/MeetingRoomStatistics";
import { MeetingRoomCalendar } from "@/components/meeting-rooms/MeetingRoomCalendar";
import { MeetingRoomsCatalog } from "@/components/meeting-rooms/MeetingRoomsCatalog";
import { Tabs, TabsContent, TabsList, TabsListScrollArea, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, BarChart3, Calendar } from "lucide-react";
import Image from "next/image";
import { getOffices } from "@/lib/api";

export default function DepartmentHeadBookingPage() {
  const isDesktop = useIsDesktop();
  const [meetingRoomsTab, setMeetingRoomsTab] = useState<"book" | "my-bookings">("book");
  const [selectedOffice, setSelectedOffice] = useState<any | null>(null);

  if (isDesktop) {
    return (
      <div className="min-h-screen bg-[#1A1A1A]">
        <div className="w-full max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-8 client-desktop-dark">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-1">Бронь переговорных</h1>
            <p className="text-sm text-white/60">Бронируйте переговорные комнаты и управляйте своими бронированиями</p>
          </div>

          <div className="flex gap-3 mb-8 p-1 rounded-xl bg-[#2C2C2E] border border-[#3A3A3C] w-fit">
            <Button
              onClick={() => setMeetingRoomsTab("book")}
              className={`h-11 px-6 rounded-lg font-medium transition-all duration-200 ${
                meetingRoomsTab === "book"
                  ? "bg-[#E85D2B] hover:bg-[#D94F15] text-white shadow-lg"
                  : "bg-transparent hover:bg-white/5 text-white/70 hover:text-white"
              }`}
            >
              Забронировать
            </Button>
            <Button
              onClick={() => setMeetingRoomsTab("my-bookings")}
              className={`h-11 px-6 rounded-lg font-medium transition-all duration-200 ${
                meetingRoomsTab === "my-bookings"
                  ? "bg-[#E85D2B] hover:bg-[#D94F15] text-white shadow-lg"
                  : "bg-transparent hover:bg-white/5 text-white/70 hover:text-white"
              }`}
            >
              Мои бронирования
            </Button>
          </div>

          <div className={meetingRoomsTab === "book" ? "rounded-xl border border-[#3A3A3C] bg-[#2C2C2E]/30 p-6" : ""}>
          <MeetingRoomsCatalog
            initialOffice={selectedOffice}
            onOfficeChange={setSelectedOffice}
            initialTab={meetingRoomsTab === "book" ? "book" : "my-bookings"}
            onTabChange={(tab) => setMeetingRoomsTab(tab === "book" ? "book" : "my-bookings")}
          />
          </div>
        </div>
      </div>
    );
  }

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
      <BottomNav activeTab="booking" />
    </div>
  );
}
