"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequestDetails } from "@/components/requests";
import type { UseExecutorRequestDetailResult } from "@/hooks/use-executor-request-detail";
import { ExecutorRequestsModals } from "./executor-requests-modals";

type ExecutorRequestDetailMobileProps = UseExecutorRequestDetailResult;

/** Mobile detail — parity с workflow-mobile `(tabs)/requests/[id].tsx` (executor). */
export function ExecutorRequestDetailMobile(props: ExecutorRequestDetailMobileProps) {
  const {
    request,
    loading,
    error,
    handleClose,
    handleRequestUpdated,
    handleStartTask,
    handleCompleteTask,
    handleRejectSubRequest,
    handleOpenRedirectModal,
    categories,
    ...modalProps
  } = props;

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
    <>
      <RequestDetails
        request={request}
        onClose={handleClose}
        onRequestUpdated={handleRequestUpdated}
        sourceTab="tasks"
        hideFullModeButton
        userRole="executor"
        fullModeRedirectBase="/executor"
        onStartTask={handleStartTask}
        onCompleteTask={handleCompleteTask}
        onReject={handleRejectSubRequest}
        onRedirectToOtherDepartment={handleOpenRedirectModal}
      />
      <ExecutorRequestsModals categories={categories} {...modalProps} />
    </>
  );
}
