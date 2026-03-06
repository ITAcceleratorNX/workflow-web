"use client";

import React, { useState, useEffect } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
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
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [meetingRoomsTab, setMeetingRoomsTab] = useState<"book" | "my-bookings">("book");
  const [selectedOffice, setSelectedOffice] = useState<any | null>(null);
  const [offices, setOffices] = useState<any[]>([]);

  useEffect(() => {
    if (isDesktop) {
      getOffices()
        .then((res) => setOffices(res.data || []))
        .catch(() => setOffices([]));
    }
  }, [isDesktop]);

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

          {meetingRoomsTab === "book" && (
            <div className="mb-8">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-white">Выбрать офис</h2>
                <p className="text-sm text-white/60 mt-0.5">Выберите офис для бронирования переговорной комнаты</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {offices.map((office: any) => (
                  <Card
                    key={office.id}
                    className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-[#3A3A3C] bg-[#2C2C2E] hover:border-[#E85D2B]/50 rounded-xl overflow-hidden"
                    onClick={() => setSelectedOffice(office)}
                  >
                    <CardContent className="p-0">
                      <div className="relative aspect-[4/3] bg-[#1C1C1E] overflow-hidden">
                        {office.photo ? (
                          <Image
                            src={office.photo}
                            alt={office.name}
                            fill
                            sizes="(max-width: 1200px) 50vw, 33vw"
                            className="object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Building2 className="w-16 h-16 text-[#E85D2B]/50" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-white">{office.name}</h3>
                        <p className="text-sm text-[#E85D2B] mt-1">{office.city}</p>
                        <p className="text-sm text-white/60">{office.address}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className={meetingRoomsTab === "book" ? "rounded-xl border border-[#3A3A3C] bg-[#2C2C2E]/30 p-6" : ""}>
            <MeetingRoomsCatalog
            initialOffice={selectedOffice}
            onOfficeChange={setSelectedOffice}
            initialTab={meetingRoomsTab === "book" ? "book" : "my-bookings"}
            onTabChange={(tab) => setMeetingRoomsTab(tab === "book" ? "book" : "my-bookings")}
            variant="dark"
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
