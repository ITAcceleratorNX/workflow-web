"use client";

import React from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useMediaQuery } from "@/hooks/use-media-query";
import { BottomNav } from "@/components/BottomNav";
import { AdminMessages } from "@/components/support-chat/AdminMessages";

export default function ManagerMessagesPage() {
  const { user, role } = useAuthStore();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (!user || role !== "manager") {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col pb-20 bg-[#1A1A1A]">
      <div
        className="sticky top-0 z-10 shrink-0 px-4 py-3 border-b border-white/10"
      >
        <h1 className="font-semibold text-2xl text-white">Сообщения</h1>
      </div>
      <div className="flex-1 min-h-0 p-4 flex flex-col">
        <AdminMessages />
      </div>
      {!isDesktop && <BottomNav activeTab="help" />}
    </div>
  );
}
