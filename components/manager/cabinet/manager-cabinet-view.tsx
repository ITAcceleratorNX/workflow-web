"use client";

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
    </>
  );
}
