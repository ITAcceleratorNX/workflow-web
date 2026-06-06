"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { MeetingRoomCard } from "@/components/meeting-rooms/MeetingRoomCard";
import { MeetingRoom, useMeetingRoomsStore } from "@/stores/meetingRoomsStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { BookingModal } from "@/components/meeting-rooms/BookingModal";
import { MyBookings } from "@/components/meeting-rooms/MyBookings";
import { OfficePickerSidebar } from "@/components/meeting-rooms/office-picker-sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useOffices } from "@/hooks/use-offices";
import { useRouter } from "next/navigation";
import { useIsMobile } from "@/hooks/use-media-query";
import type { Office } from "@/lib/api";

interface MeetingRoomsCatalogProps {
  initialOffice?: Office | null;
  onOfficeChange?: (office: Office | null) => void;
  initialTab?: "book" | "my-bookings";
  onTabChange?: (tab: "book" | "my-bookings") => void;
}

export function MeetingRoomsCatalog({
  initialOffice = null,
  onOfficeChange,
  initialTab = "book",
  onTabChange,
}: MeetingRoomsCatalogProps) {
  const rooms = useMeetingRoomsStore((state) => state.rooms);
  const fetchRooms = useMeetingRoomsStore((state) => state.fetchRooms);
  const [selectedOffice, setSelectedOffice] = useState<Office | null>(initialOffice);
  const [selectedRoom, setSelectedRoom] = useState<MeetingRoom | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"book" | "my-bookings">(initialTab);

  useEffect(() => {
    if (initialOffice !== selectedOffice) {
      setSelectedOffice(initialOffice);
    }
  }, [initialOffice, selectedOffice]);

  useEffect(() => {
    if (initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, activeTab]);

  const handleOfficeChange = (office: Office | null) => {
    setSelectedOffice(office);
    onOfficeChange?.(office);
  };

  const handleTabChange = (tab: "book" | "my-bookings") => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const { toast } = useToast();
  const router = useRouter();
  const isMobile = useIsMobile();
  const officeInfoRef = useRef<HTMLDivElement>(null);
  const { offices, loading: officesLoading } = useOffices({ enabled: !isMobile });

  useEffect(() => {
    if (selectedOffice) {
      fetchRooms(selectedOffice.id);
      if (isMobile && typeof window !== "undefined") {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (officeInfoRef.current) {
              officeInfoRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
            } else {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          });
        });
      }
    }
  }, [selectedOffice, fetchRooms, isMobile]);

  const visibleRooms = useMemo(
    () =>
      rooms.filter(
        (room) =>
          room.isActive &&
          (room.room_type === "meeting" || room.room_type === undefined),
      ),
    [rooms],
  );

  const totalAvailable = useMemo(
    () => rooms.filter((room) => room.status === "available").length,
    [rooms],
  );

  const totalBooked = useMemo(
    () => rooms.filter((room) => room.status === "booked").length,
    [rooms],
  );

  const handleRoomClick = (room: MeetingRoom) => {
    if (isMobile) {
      router.push(`/meeting-rooms/booking?roomId=${room.id}`);
    } else {
      setSelectedRoom(room);
      setIsBookingModalOpen(true);
    }
  };

  const handleBookingSuccess = () => {
    if (selectedOffice) {
      fetchRooms(selectedOffice.id);
    }
  };

  const handleBookingModalSuccess = (message: { title: string; message: string }) => {
    toast({
      title: message.title,
      description: message.message,
      duration: 3000,
    });
  };

  const closeBookingModal = () => {
    setIsBookingModalOpen(false);
    setSelectedRoom(null);
  };

  const roomListBlock = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="rounded-full px-4 py-1 text-sm">
          Доступно: {totalAvailable}
        </Badge>
        <Badge variant="outline" className="rounded-full px-4 py-1 text-sm">
          Забронировано: {totalBooked}
        </Badge>
      </div>
      <div className="space-y-4">
        {visibleRooms.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <h3 className="text-lg font-semibold">
              Нет доступных переговорных
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              В выбранном офисе пока нет активных переговорных комнат.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {visibleRooms.map((room) => (
              <div
                key={room.id}
                onClick={() => handleRoomClick(room)}
                className="cursor-pointer"
              >
                <MeetingRoomCard room={room} showOffice />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );

  const BookingContent = () => {
    if (!isMobile) {
      return (
        <div className="flex gap-6 min-h-0">
          <OfficePickerSidebar
            offices={offices}
            selectedOffice={selectedOffice}
            onSelect={handleOfficeChange}
            loading={officesLoading}
          />
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            {!selectedOffice ? (
              <div className="rounded-xl border border-dashed p-10 text-center flex-1 flex items-center justify-center">
                <div>
                  <h3 className="text-lg font-semibold">Выберите офис</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Выберите офис слева для просмотра переговорных комнат
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOfficeChange(null)}
                    className="shrink-0"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Сбросить
                  </Button>
                  <div>
                    <h2 className="text-lg font-semibold">{selectedOffice.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      {selectedOffice.city}, {selectedOffice.address}
                    </p>
                  </div>
                </div>
                {roomListBlock}
              </>
            )}
          </div>
        </div>
      );
    }

    if (!selectedOffice) {
      return (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <h3 className="text-lg font-semibold">Выберите офис</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Выберите офис выше для просмотра переговорных комнат
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-6">
        <div ref={officeInfoRef} className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => handleOfficeChange(null)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Назад к выбору офисов
          </Button>
          <div>
            <h2 className="text-xl font-semibold">{selectedOffice.name}</h2>
            <p className="text-sm text-muted-foreground">
              {selectedOffice.city}, {selectedOffice.address}
            </p>
          </div>
        </div>
        {roomListBlock}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <Tabs value={activeTab} onValueChange={(value) => handleTabChange(value as "book" | "my-bookings")}>
        <TabsContent value="book">
          <BookingContent />
        </TabsContent>

        <TabsContent value="my-bookings">
          <MyBookings variant="default" />
        </TabsContent>
      </Tabs>

      {!isMobile && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={closeBookingModal}
          room={selectedRoom}
          onBookingSuccess={handleBookingSuccess}
          onSuccess={handleBookingModalSuccess}
          variant="default"
        />
      )}
    </div>
  );
}
