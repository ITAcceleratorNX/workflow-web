"use client";

import Link from "next/link";
import { MessageCircle, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MeetingRoomsCatalog } from "@/components/meeting-rooms/MeetingRoomsCatalog";
import { DeskHeightCalculator } from "@/components/meeting-rooms/DeskHeightCalculator";
import { ClientHomeDesktopCabinet } from "@/components/client/home/client-home-desktop-cabinet";
import type { UseClientHomeResult } from "@/hooks/use-client-home";

type ClientHomeDesktopProps = UseClientHomeResult;

export function ClientHomeDesktop({
  activeTab,
  selectedOffice,
  setSelectedOffice,
  meetingRoomsTab,
  setMeetingRoomsTab,
  showDeskCalculator,
  setShowDeskCalculator,
}: ClientHomeDesktopProps) {
  if (activeTab === "cabinet") {
    return (
      <>
        <ClientHomeDesktopCabinet />
        <Link
          href="/chat-bot"
          className="fixed bottom-4 right-4 z-50 flex items-center justify-center w-14 h-14 bg-[#114A65]/10 text-[#114A65] rounded-full shadow-lg hover:bg-[#114A65]/20 transition"
        >
          <MessageCircle className="w-7 h-7" />
        </Link>
      </>
    );
  }

  return (
    <>
      <div className="mb-6 space-y-4 client-desktop-dark">
        <div className="flex gap-4">
          <Button
            onClick={() => setMeetingRoomsTab("book")}
            className={`flex-1 h-12 rounded-lg font-medium transition-all duration-300 ${
              meetingRoomsTab === "book"
                ? "bg-[#E85D2B] hover:bg-[#D94F15] text-white"
                : "bg-[#2C2C2E] hover:bg-[#3A3A3C] text-white border border-[#212121]"
            }`}
          >
            Бронировать
          </Button>
          <Button
            onClick={() => setMeetingRoomsTab("my-bookings")}
            className={`flex-1 h-12 rounded-lg font-medium transition-all duration-300 ${
              meetingRoomsTab === "my-bookings"
                ? "bg-[#E85D2B] hover:bg-[#D94F15] text-white"
                : "bg-[#2C2C2E] hover:bg-[#3A3A3C] text-white border border-[#212121]"
            }`}
          >
            Мои бронирования
          </Button>
        </div>

        {meetingRoomsTab === "book" && (
          <>
            <Button
              onClick={() => setShowDeskCalculator(!showDeskCalculator)}
              variant="outline"
              className="w-full h-12 bg-[#2C2C2E] border-[#212121] hover:bg-[#3A3A3C] text-white rounded-lg flex items-center justify-center gap-2"
            >
              <Ruler className="h-5 w-5" />
              <span className="font-medium">Калькулятор высоты стола</span>
            </Button>
            <DeskHeightCalculator
              isOpen={showDeskCalculator}
              onToggle={() => setShowDeskCalculator(!showDeskCalculator)}
            />
          </>
        )}
      </div>

      <MeetingRoomsCatalog
        initialOffice={selectedOffice}
        onOfficeChange={setSelectedOffice}
        initialTab={meetingRoomsTab === "book" ? "book" : "my-bookings"}
        onTabChange={(tab) => setMeetingRoomsTab(tab === "book" ? "book" : "my-bookings")}
      />

      <Link
        href="/chat-bot"
        className="fixed bottom-4 right-4 z-50 flex items-center justify-center w-14 h-14 bg-[#114A65]/10 text-[#114A65] rounded-full shadow-lg hover:bg-[#114A65]/20 transition"
      >
        <MessageCircle className="w-7 h-7" />
      </Link>
    </>
  );
}
