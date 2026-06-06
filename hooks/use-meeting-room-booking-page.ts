"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getMeetingRoomById } from "@/lib/api";
import { mapApiMeetingRoomToStore, type MeetingRoom } from "@/stores/meetingRoomsStore";

export function useMeetingRoomBookingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [room, setRoom] = useState<MeetingRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const roomId = searchParams.get("roomId");

  useEffect(() => {
    if (!roomId) {
      router.back();
      setLoading(false);
      return;
    }

    let cancelled = false;

    getMeetingRoomById(parseInt(roomId, 10))
      .then((response) => {
        if (!cancelled) {
          setRoom(mapApiMeetingRoomToStore(response.data));
        }
      })
      .catch((error) => {
        console.error("Ошибка при загрузке комнаты:", error);
        if (!cancelled) router.back();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [roomId, router]);

  const handleClose = () => {
    router.back();
  };

  return { room, loading, handleClose };
}

export type UseMeetingRoomBookingPageResult = ReturnType<typeof useMeetingRoomBookingPage>;
