"use client";

import { useState } from "react";
import { useIsDesktop } from "@/hooks/use-media-query";
import { BottomNav } from "@/components/BottomNav";
import { MeetingRoomsCatalog } from "@/components/meeting-rooms/MeetingRoomsCatalog";
import { Button } from "@/components/ui/button";
import type { Office } from "@/lib/api";
import { RoleBookingTabsView } from "./role-booking-tabs-view";

/** Department-head booking: desktop — catalog; mobile — admin tabs (RN parity). */
export function DepartmentHeadBookingView() {
  const isDesktop = useIsDesktop();
  const [meetingRoomsTab, setMeetingRoomsTab] = useState<"book" | "my-bookings">("book");
  const [selectedOffice, setSelectedOffice] = useState<Office | null>(null);

  if (isDesktop) {
    return (
      <div className="min-h-screen bg-[#1A1A1A]">
        <div className="w-full max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-8 client-desktop-dark">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-1">Бронь переговорных</h1>
            <p className="text-sm text-white/60">
              Бронируйте переговорные комнаты и управляйте своими бронированиями
            </p>
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

          <div
            className={
              meetingRoomsTab === "book"
                ? "rounded-xl border border-[#3A3A3C] bg-[#2C2C2E]/30 p-6"
                : ""
            }
          >
            <MeetingRoomsCatalog
              initialOffice={selectedOffice}
              onOfficeChange={setSelectedOffice}
              initialTab={meetingRoomsTab === "book" ? "book" : "my-bookings"}
              onTabChange={(tab) =>
                setMeetingRoomsTab(tab === "book" ? "book" : "my-bookings")
              }
            />
          </div>
        </div>
      </div>
    );
  }

  return <RoleBookingTabsView />;
}
