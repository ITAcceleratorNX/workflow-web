"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

export interface AdminManagerRequestsDesktopFrameProps {
  /** Content for filters row */
  filtersSlot: React.ReactNode;
  /** Optional tabs row (e.g. Входящие / Мои / Повторяющиеся for admin) */
  tabsSlot?: React.ReactNode;
  /** Content for the list area */
  listSlot: React.ReactNode;
  /** Right panel content (RequestDetails) when a request is selected */
  detailSlot: React.ReactNode | null;
  /** Request ID for panel header */
  displayRequestId?: number;
  onCloseDetail: () => void;
}

export function AdminManagerRequestsDesktopFrame({
  filtersSlot,
  tabsSlot,
  listSlot,
  detailSlot,
  displayRequestId,
  onCloseDetail,
}: AdminManagerRequestsDesktopFrameProps) {
  return (
    <div className="h-full flex flex-col bg-[#1A1A1A]">
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <h1 className="text-xl font-bold text-white">Заявки</h1>
            <Link href="/create-request">
              <Button className="bg-[#E85D2B] hover:bg-[#E85D2B]/90 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Создать
              </Button>
            </Link>
          </div>
          <div className="p-4 flex gap-2 flex-wrap">{filtersSlot}</div>
          {tabsSlot && (
            <div className="px-4 py-2 flex gap-2 border-b border-white/5 shrink-0">
              {tabsSlot}
            </div>
          )}
          <div className="flex-1 overflow-auto p-4 space-y-4 min-h-0">{listSlot}</div>
        </div>
        {detailSlot && (
          <div className="w-[420px] shrink-0 border-l border-white/10 flex flex-col bg-[#1A1A1A]">
            <div className="p-3 border-b border-white/10 flex justify-between items-center shrink-0">
              <span className="font-semibold text-white">
                Заявка #{displayRequestId}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="text-white/70 hover:text-white"
                onClick={onCloseDetail}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-auto min-h-0">{detailSlot}</div>
          </div>
        )}
      </div>
    </div>
  );
}
