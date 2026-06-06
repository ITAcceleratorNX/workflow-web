"use client";

import { MeetingRoomCalendar } from "@/components/meeting-rooms/MeetingRoomCalendar";
import { MeetingRoomStatistics } from "@/components/meeting-rooms/MeetingRoomStatistics";
import { MeetingRoomsAdmin } from "@/components/meeting-rooms/MeetingRoomsAdmin";
import { Tabs, TabsContent, TabsList, TabsListScrollArea, TabsTrigger } from "@/components/ui/tabs";
import {
  ROLE_BOOKING_TABS,
  ROLE_BOOKING_TABS_LIST_CLASS,
  ROLE_BOOKING_TAB_TRIGGER_CLASS,
} from "./booking-constants";

interface RoleBookingTabsViewProps {
  title?: string;
}

/** Admin-worker / manager mobile booking — tabs: rooms, analytics, heatmap. */
export function RoleBookingTabsView({
  title = "Бронь переговорных",
}: RoleBookingTabsViewProps) {
  return (
    <div className="min-h-screen bg-[#1A1A1A] pb-20">
      <div className="w-full max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-white mb-6">{title}</h1>

        <Tabs defaultValue="rooms" className="space-y-6">
          <TabsListScrollArea>
            <TabsList className={ROLE_BOOKING_TABS_LIST_CLASS}>
              {ROLE_BOOKING_TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={ROLE_BOOKING_TAB_TRIGGER_CLASS}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </TabsTrigger>
                );
              })}
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
    </div>
  );
}
