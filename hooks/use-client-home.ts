"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useIsDesktop } from "@/hooks/use-media-query";
import { getOffices } from "@/lib/api";
import { getRequestNavigationUrl } from "@/lib/requestNavigation";

export type ClientHomeTab = "cabinet" | "meeting-rooms";

export interface ClientOffice {
  id: number;
  name: string;
  city?: string;
  address?: string;
  photo?: string | null;
}

export function useClientHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDesktop = useIsDesktop();

  const [activeTab, setActiveTab] = useState<ClientHomeTab>("cabinet");
  const [offices, setOffices] = useState<ClientOffice[]>([]);
  const [selectedOffice, setSelectedOffice] = useState<ClientOffice | null>(null);
  const [meetingRoomsTab, setMeetingRoomsTab] = useState<"book" | "my-bookings">("book");
  const [showDeskCalculator, setShowDeskCalculator] = useState(false);

  useEffect(() => {
    const requestId = searchParams.get("requestId");
    if (requestId) {
      const url = getRequestNavigationUrl({
        role: "client",
        isDesktop,
        requestId,
      });
      if (url) {
        router.replace(url);
        return;
      }
    }

    if (searchParams.get("createRequest") === "true") {
      router.replace("/create-request");
      return;
    }

    const tab = searchParams.get("tab");
    if (isDesktop && tab === "requests") {
      router.replace("/client/requests");
      return;
    }
    if (isDesktop && tab === "statistics") {
      router.replace("/client/statistics");
      return;
    }
    if (tab === "meeting-rooms") {
      setActiveTab("meeting-rooms");
    } else {
      setActiveTab("cabinet");
    }
  }, [searchParams, isDesktop, router]);

  const fetchOffices = useCallback(async () => {
    try {
      const res = await getOffices();
      setOffices(res.data || []);
    } catch (error) {
      console.error("Ошибка при загрузке офисов:", error);
    }
  }, []);

  useEffect(() => {
    fetchOffices();
  }, [fetchOffices]);

  const handleRefresh = useCallback(async () => {
    await fetchOffices();
  }, [fetchOffices]);

  return {
    isDesktop,
    activeTab,
    setActiveTab,
    offices,
    selectedOffice,
    setSelectedOffice,
    meetingRoomsTab,
    setMeetingRoomsTab,
    showDeskCalculator,
    setShowDeskCalculator,
    handleRefresh,
  };
}

export type UseClientHomeResult = ReturnType<typeof useClientHome>;
