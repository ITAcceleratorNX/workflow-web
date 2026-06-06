"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { RequestDetails } from "@/components/requests";
import { MOBILE_PAGE_GRADIENTS } from "@/constants/mobile-layout";
import type { UseManagerRequestDetailResult } from "@/hooks/use-manager-request-detail";

type ManagerRequestDetailMobileProps = UseManagerRequestDetailResult;

/** Mobile detail — parity с workflow-mobile requests detail (manager). */
export function ManagerRequestDetailMobile({
  request,
  loading,
  error,
  handleClose,
  handleRequestUpdated,
}: ManagerRequestDetailMobileProps) {
  if (loading) {
    return (
      <>
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: MOBILE_PAGE_GRADIENTS.plain }}
        >
          <p className="text-gray-400">Загрузка...</p>
        </div>
        <BottomNav activeTab="requests" />
      </>
    );
  }

  if (error || !request) {
    return (
      <>
        <div
          className="min-h-screen p-4 pt-[max(1rem,env(safe-area-inset-top))]"
          style={{ background: MOBILE_PAGE_GRADIENTS.plain }}
        >
          <Button variant="ghost" className="text-white mb-4 -ml-2" onClick={handleClose}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            Назад
          </Button>
          <p className="text-red-400">{error || "Заявка не найдена"}</p>
        </div>
        <BottomNav activeTab="requests" />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen" style={{ background: MOBILE_PAGE_GRADIENTS.plain }}>
        <RequestDetails
          request={request}
          onClose={handleClose}
          onRequestUpdated={handleRequestUpdated}
          sourceTab="incoming"
          userRole="manager"
          hideFullModeButton
          displayMode="fullscreen"
        />
      </div>
      <BottomNav activeTab="requests" />
    </>
  );
}
