"use client";

import { useState, useEffect, useCallback } from "react";
import { getMeetingRooms, type MeetingRoom, type Office } from "@/lib/api";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  GUEST_DEMO_OFFICES,
  GUEST_DEMO_ROOMS,
  type MeetingRoomsMobileSubTab,
  type MeetingRoomsMobileTab,
} from "@/components/meeting-rooms/meeting-rooms-constants";

/** Mobile /meeting-rooms: офисы, переговорные офиса и выбранная комната (бронь — RoomBookingSheet). */
export function useMeetingRoomsMobilePage() {
  const isGuest = useAuthStore((s) => s.isGuest);

  const [activeTab, setActiveTab] = useState<MeetingRoomsMobileTab>("book");
  const [activeSubTab, setActiveSubTab] = useState<MeetingRoomsMobileSubTab>("offices");
  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedOffice, setSelectedOffice] = useState<Office | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<MeetingRoom | null>(null);
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const fetchOffices = useCallback(async () => {
    try {
      if (isGuest) {
        setOffices(GUEST_DEMO_OFFICES);
        return;
      }
      const response = await api.get("/offices");
      setOffices(response.data || []);
    } catch (error) {
      console.error("Error fetching offices:", error);
    } finally {
      setLoading(false);
    }
  }, [isGuest]);

  useEffect(() => {
    fetchOffices();
  }, [fetchOffices]);

  const fetchRooms = useCallback(
    async (officeId: number) => {
      setLoadingRooms(true);
      try {
        if (isGuest) {
          setRooms(GUEST_DEMO_ROOMS);
          return;
        }
        const response = await getMeetingRooms(officeId);
        const activeRooms = (response.data || []).filter((room) => room.isActive && room.room_type !== "cabinet");
        setRooms(activeRooms);
      } catch (error) {
        console.error("Error fetching rooms:", error);
        setRooms([]);
      } finally {
        setLoadingRooms(false);
      }
    },
    [isGuest],
  );

  const handleOfficeClick = (office: Office) => {
    setSelectedOffice(office);
    fetchRooms(office.id);
  };

  const handleRoomClick = (room: MeetingRoom) => {
    setSelectedRoom(room);
  };

  const closeOfficeModal = () => {
    setSelectedOffice(null);
    setRooms([]);
  };

  const closeRoomModal = () => {
    setSelectedRoom(null);
  };

  /** Бронь создана — к «Моим бронированиям». */
  const handleBooked = () => {
    setSelectedRoom(null);
    setSelectedOffice(null);
    setActiveTab("my-bookings");
  };

  return {
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
    handleBooked,
  };
}

export type UseMeetingRoomsMobilePageResult = ReturnType<typeof useMeetingRoomsMobilePage>;
