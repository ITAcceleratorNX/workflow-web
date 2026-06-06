"use client";

import { PrivacyViewDesktop } from "@/components/auth/privacy-view-desktop";
import { PrivacyViewMobile } from "@/components/auth/privacy-view-mobile";

export function PrivacyView() {
  return (
    <>
      <div className="hidden md:block">
        <PrivacyViewDesktop />
      </div>
      <div className="md:hidden">
        <PrivacyViewMobile />
      </div>
    </>
  );
}
