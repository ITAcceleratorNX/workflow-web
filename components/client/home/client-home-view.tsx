"use client";

import { useClientHome } from "@/hooks/use-client-home";
import { ClientHomeDesktop } from "./client-home-desktop";
import { ClientHomeMobile } from "./client-home-mobile";

export function ClientHomeView() {
  const state = useClientHome();

  if (state.isDesktop) {
    return (
      <div className="min-h-screen pb-safe bg-[#1A1A1A] client-desktop-content">
        <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-4 lg:py-8">
          <ClientHomeDesktop {...state} />
        </div>
      </div>
    );
  }

  return <ClientHomeMobile {...state} />;
}
