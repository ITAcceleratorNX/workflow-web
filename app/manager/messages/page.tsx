"use client";

import React from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useIsDesktop } from "@/hooks/use-media-query";
import { BottomNav } from "@/components/BottomNav";
import { AdminManagerMessagesDesktop } from "@/components/layout/AdminManagerMessagesDesktop";
import { AdminMessages } from "@/components/support-chat/AdminMessages";

export default function ManagerMessagesPage() {
  const { user, role } = useAuthStore();
  const isDesktop = useIsDesktop();

  if (!user || role !== "manager") {
    return null;
  }

  if (isDesktop) {
    return <AdminManagerMessagesDesktop canRespond={false} />;
  }

  return (
    <div className="min-h-screen flex flex-col pb-20 bg-[#1A1A1A]">
      <div
        className="sticky top-0 z-10 shrink-0 px-4 py-3 border-b border-white/10"
      >
        <h1 className="font-semibold text-2xl text-white">Сообщения</h1>
      </div>
      <div className="flex-1 min-h-0 p-4 flex flex-col">
        <AdminMessages canRespond={false} />
      </div>
      <BottomNav activeTab="help" />
    </div>
  );
}
