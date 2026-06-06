"use client";

import { BottomNav } from "@/components/BottomNav";
import { useManagerCabinet } from "@/hooks/use-manager-cabinet";
import { ManagerCabinetMobile } from "./manager-cabinet-mobile";

export function ManagerCabinetView() {
  const state = useManagerCabinet();

  if (state.isDesktop) {
    return null;
  }

  return (
    <>
      <ManagerCabinetMobile {...state} />
      <BottomNav activeTab="home" />
    </>
  );
}
