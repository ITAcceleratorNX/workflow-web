"use client";

import { useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import {
  BOOKING_TAB_SCENE_UNDERLAY,
  MOBILE_BOOKING_GRADIENT,
  MOBILE_BOTTOM_NAV_PADDING,
} from "@/constants/mobile-layout";
import { useBottomNavLayout } from "@/hooks/use-bottom-nav-layout";
import { MyBookings } from "@/components/meeting-rooms/MyBookings";
import { DeskHeightCalculatorMobile } from "@/components/meeting-rooms/desk-height-calculator-mobile";
import { MeetingRoomsMobileOfficeGrid } from "@/components/meeting-rooms/meeting-rooms-mobile-office-grid";
import { MeetingRoomsMobileOfficeRoomsModal } from "@/components/meeting-rooms/meeting-rooms-mobile-office-rooms-modal";
import { MeetingRoomsMobileRoomBookingModal } from "@/components/meeting-rooms/meeting-rooms-mobile-room-booking-modal";
import { MEETING_ROOMS_MOBILE_SUB_TABS } from "@/components/meeting-rooms/meeting-rooms-constants";
import { useMeetingRoomsMobilePage } from "@/hooks/use-meeting-rooms-mobile-page";
import { useIsDesktop } from "@/hooks/use-media-query";
import { useBookingTabUiStore } from "@/stores/booking-tab-ui-store";

/** Mobile meeting-rooms entry — parity с workflow-mobile `(tabs)/booking.tsx`. */
export function MeetingRoomsMobileView() {
  const isDesktop = useIsDesktop();
  const { showNav } = useBottomNavLayout();
  const page = useMeetingRoomsMobilePage();
  const setHideBottomNavForBookingForm = useBookingTabUiStore(
    (s) => s.setHideBottomNavForBookingForm
  );
  const {
    activeTab,
    setActiveTab,
    activeSubTab,
    setActiveSubTab,
    offices,
    loading,
    selectedOffice,
    selectedRoom,
    rooms,
    loadingRooms,
    handleOfficeClick,
    handleRoomClick,
    closeOfficeModal,
    closeRoomModal,
  } = page;

  useEffect(() => {
    setHideBottomNavForBookingForm(!!selectedRoom);
    return () => {
      setHideBottomNavForBookingForm(false);
    };
  }, [selectedRoom, setHideBottomNavForBookingForm]);

  const navPadding = showNav ? MOBILE_BOTTOM_NAV_PADDING : undefined;

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{
        paddingBottom: navPadding,
        background: MOBILE_BOOKING_GRADIENT,
        ...(showNav ? { backgroundColor: BOOKING_TAB_SCENE_UNDERLAY } : {}),
      }}
    >
      <div className="pt-12 px-3">
        <h1 className="text-xl font-bold text-foreground mb-4">Бронь</h1>
      </div>

      <div className="px-3 mb-4">
        <div className="flex bg-[#262626] rounded-[10px] overflow-hidden">
          <button
            type="button"
            onClick={() => setActiveTab("book")}
            className={`flex-1 py-2.5 px-4 text-[8px] font-medium transition-all ${
              activeTab === "book" ? "bg-[#909090] text-white" : "text-white"
            }`}
            style={{ borderRadius: "10px" }}
          >
            Забронировать комнату
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("my-bookings")}
            className={`flex-1 py-2.5 px-4 text-[8px] font-medium transition-all ${
              activeTab === "my-bookings" ? "bg-[#909090] text-white" : "text-white"
            }`}
            style={{ borderRadius: "10px" }}
          >
            Мои бронирования
          </button>
        </div>
      </div>

      {activeTab === "book" && (
        <div className="px-3 mb-6">
          <div className="flex gap-3">
            {MEETING_ROOMS_MOBILE_SUB_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveSubTab(tab.key)}
                className="flex flex-col gap-3"
              >
                <span
                  className={`text-[10px] font-medium ${
                    activeSubTab === tab.key ? "text-[#FE7F47]" : "text-[#7C7C7C]"
                  }`}
                >
                  {tab.label}
                </span>
                <div
                  className={`h-[1px] w-full ${
                    activeSubTab === tab.key ? "bg-[#F35713]" : "bg-transparent"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 px-3 overflow-y-auto">
        {activeTab === "book" ? (
          <>
            {activeSubTab === "offices" && (
              <MeetingRoomsMobileOfficeGrid
                offices={offices}
                loading={loading}
                onOfficeClick={handleOfficeClick}
              />
            )}

            {activeSubTab === "rooms" && (
              <div className="text-center py-12">
                <p className="text-gray-400 text-sm">
                  Выберите офис для просмотра свободных комнат
                </p>
              </div>
            )}

            {activeSubTab === "calculator" && <DeskHeightCalculatorMobile />}
          </>
        ) : (
          <div className="space-y-4">
            <MyBookings variant="mobile" />
          </div>
        )}
      </div>

      {selectedOffice && !selectedRoom && (
        <MeetingRoomsMobileOfficeRoomsModal
          office={selectedOffice}
          rooms={rooms}
          loadingRooms={loadingRooms}
          onClose={closeOfficeModal}
          onRoomClick={handleRoomClick}
        />
      )}

      {selectedRoom && (
        <MeetingRoomsMobileRoomBookingModal
          office={selectedOffice}
          room={selectedRoom}
          page={page}
        />
      )}

      {!isDesktop && <BottomNav activeTab="booking" />}
    </div>
  );
}
