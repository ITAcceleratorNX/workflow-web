"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminRequestDetailsModal } from "@/components/AdminRequestDetailsModal";
import type { UseAdminWorkerRequestDetailResult } from "@/hooks/use-admin-worker-request-detail";

type AdminWorkerRequestDetailMobileProps = UseAdminWorkerRequestDetailResult;

export function AdminWorkerRequestDetailMobile({
  request,
  loading,
  error,
  handleClose,
  handleRequestUpdated,
}: AdminWorkerRequestDetailMobileProps) {
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Button variant="ghost" className="text-foreground mb-4 -ml-2" onClick={handleClose}>
          <ArrowLeft className="w-5 h-5 mr-2" />
          Назад
        </Button>
        <p className="text-red-400">{error || "Заявка не найдена"}</p>
      </div>
    );
  }

  return (
    <AdminRequestDetailsModal
      request={request}
      onClose={handleClose}
      onRequestUpdated={handleRequestUpdated}
      sourceTab="incoming"
      hideFullModeButton
    />
  );
}
