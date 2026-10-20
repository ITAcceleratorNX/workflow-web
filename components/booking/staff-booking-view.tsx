"use client";

import { useState } from "react";
import { MeetingRoomCalendar } from "@/components/meeting-rooms/MeetingRoomCalendar";
import { MeetingRoomStatistics } from "@/components/meeting-rooms/MeetingRoomStatistics";
import { MeetingRoomsAdmin } from "@/components/meeting-rooms/MeetingRoomsAdmin";
import { MeetingRoomsCatalog } from "@/components/meeting-rooms/MeetingRoomsCatalog";
import { MyBookings } from "@/components/meeting-rooms/MyBookings";
import { Tabs, TabsContent, TabsList, TabsListScrollArea, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-media-query";
import { useOffices } from "@/hooks/use-offices";
import type { Office } from "@/lib/api";
import { getStaffBookingSubtitle, getStaffBookingTabs, type StaffBookingTab } from "@/lib/staff-booking-tabs";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  ROLE_BOOKING_TAB_TRIGGER_CLASS,
  ROLE_BOOKING_TABS_LIST_CLASS,
  STAFF_BOOKING_TAB_ICONS,
} from "./booking-constants";
import { OfficeBookings } from "./office-bookings";

/**
 * Раздел «Бронь» Администратора, Офис-менеджера и Руководителя — один экран на desktop и mobile.
 * Набор вкладок зависит от роли (lib/staff-booking-tabs.ts); область видимости броней задаёт бэкенд.
 */
export function StaffBookingView() {
  const role = useAuthStore((s) => s.user?.role ?? s.role);
  const tabs = getStaffBookingTabs(role);
  const [tab, setTab] = useState<StaffBookingTab>("book");
  const [selectedOffice, setSelectedOffice] = useState<Office | null>(null);
  // На desktop каталог показывает офисы сам; на mobile офис выбирается здесь, над каталогом.
  const isMobile = useIsMobile();
  const { offices } = useOffices({ enabled: isMobile });

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <div className="w-full max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-8">
        <h1 className="text-2xl font-bold text-white mb-1">Бронь переговорных</h1>
        <p className="text-sm text-white/60 mb-6">{getStaffBookingSubtitle(role)}</p>

        <Tabs value={tab} onValueChange={(value) => setTab(value as StaffBookingTab)} className="space-y-6">
          <TabsListScrollArea>
            <TabsList className={ROLE_BOOKING_TABS_LIST_CLASS}>
              {tabs.map((item) => {
                const Icon = STAFF_BOOKING_TAB_ICONS[item.value];
                return (
                  <TabsTrigger key={item.value} value={item.value} className={ROLE_BOOKING_TAB_TRIGGER_CLASS}>
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </TabsListScrollArea>

          <TabsContent value="book">
            {/* Тёмная тема каталога — как у Клиента. Не client-desktop-dark: его правило для
                [data-state="active"] красит активную вкладку каталога целиком в оранжевый. */}
            {isMobile && offices.length > 0 && (
              <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Офис">
                {offices.map((office) => (
                  <button
                    key={office.id}
                    type="button"
                    onClick={() => setSelectedOffice(office)}
                    aria-pressed={selectedOffice?.id === office.id}
                    className={cn(
                      "shrink-0 rounded-full border px-4 py-2 text-sm transition-colors",
                      selectedOffice?.id === office.id
                        ? "border-[#E85D2B] bg-[#E85D2B] text-white"
                        : "border-white/15 bg-[#2C2C2E] text-white/80",
                    )}
                  >
                    {office.name}
                  </button>
                ))}
              </div>
            )}
            <div className="client-desktop-content text-white">
              <MeetingRoomsCatalog
                initialOffice={selectedOffice}
                onOfficeChange={setSelectedOffice}
                initialTab="book"
                darkTheme
              />
            </div>
          </TabsContent>
          <TabsContent value="my-bookings">
            <MyBookings variant="default" />
          </TabsContent>
          <TabsContent value="bookings">
            <OfficeBookings />
          </TabsContent>
          {tabs.some((item) => item.value === "rooms") && (
            <TabsContent value="rooms">
              <MeetingRoomsAdmin variant="dark" />
            </TabsContent>
          )}
          <TabsContent value="analytics">
            <MeetingRoomStatistics variant="dark" />
          </TabsContent>
          <TabsContent value="heatmap">
            <MeetingRoomCalendar variant="dark" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
