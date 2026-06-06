"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequestDetails } from "@/components/requests";
import { MOBILE_PAGE_GRADIENTS } from "@/constants/mobile-layout";
import type { UseClientRequestDetailResult } from "@/hooks/use-client-request-detail";

type ClientRequestDetailMobileProps = Pick<
  UseClientRequestDetailResult,
  "request" | "loading" | "error" | "handleClose" | "handleRequestUpdated" | "handleDelete"
>;

/** Mobile detail — parity с workflow-mobile `(tabs)/requests/[id].tsx` (client). */
export function ClientRequestDetailMobile({
  request,
  loading,
  error,
  handleClose,
  handleRequestUpdated,
  handleDelete,
}: ClientRequestDetailMobileProps) {
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: MOBILE_PAGE_GRADIENTS.client }}
      >
        <p className="text-gray-400">Загрузка...</p>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div
        className="min-h-screen p-4 pt-[max(1rem,env(safe-area-inset-top))]"
        style={{ background: MOBILE_PAGE_GRADIENTS.client }}
      >
        <Button variant="ghost" className="text-white mb-4 -ml-2" onClick={handleClose}>
          <ArrowLeft className="w-5 h-5 mr-2" />
          Назад
        </Button>
        <p className="text-red-400">{error || "Заявка не найдена"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: MOBILE_PAGE_GRADIENTS.client }}>
      <RequestDetails
        request={request}
        onClose={handleClose}
        onRequestUpdated={handleRequestUpdated}
        sourceTab="my-requests"
        hideFullModeButton
        userRole="client"
        fullModeRedirectBase="/client"
        onDelete={handleDelete}
      />
    </div>
  );
}
