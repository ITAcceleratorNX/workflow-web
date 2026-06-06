"use client";

import { AdminMessages } from "@/components/support-chat/AdminMessages";

export function AdminWorkerMessagesMobile() {
  return (
    <div className="min-h-screen flex flex-col bg-[#1A1A1A]">
      <div className="sticky top-0 z-10 shrink-0 px-4 py-3 border-b border-white/10">
        <h1 className="font-semibold text-2xl text-white">Сообщения</h1>
      </div>
      <div className="flex-1 min-h-0 p-4 flex flex-col">
        <AdminMessages canRespond={true} />
      </div>
    </div>
  );
}
