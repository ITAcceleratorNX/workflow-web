"use client";

import {
  CompleteTaskModal,
  RedirectRequestModal,
  RejectSubRequestModal,
} from "@/components/requests";
import type { UseExecutorRequestsListResult } from "@/hooks/use-executor-requests-list";

export type ExecutorRequestModalsState = Pick<
  UseExecutorRequestsListResult,
  | "categories"
  | "showCompleteTaskModal"
  | "closeCompleteTaskModal"
  | "selectedTaskForComplete"
  | "handleCompleteTaskSubmit"
  | "isSubmittingComplete"
  | "showRejectSubRequestModal"
  | "closeRejectSubRequestModal"
  | "selectedSubRequestForReject"
  | "handleRejectSubRequestSubmit"
  | "isRejecting"
  | "rejectError"
  | "showRedirectModal"
  | "selectedRequestForRedirect"
  | "handleCloseRedirectModal"
  | "handleRedirectRequest"
  | "selectedCategoryId"
  | "setSelectedCategoryId"
  | "isRedirecting"
  | "redirectError"
>;

type ExecutorRequestsModalsProps = ExecutorRequestModalsState;

export function ExecutorRequestsModals(props: ExecutorRequestsModalsProps) {
  const {
    categories,
    showCompleteTaskModal,
    closeCompleteTaskModal,
    selectedTaskForComplete,
    handleCompleteTaskSubmit,
    isSubmittingComplete,
    showRejectSubRequestModal,
    closeRejectSubRequestModal,
    selectedSubRequestForReject,
    handleRejectSubRequestSubmit,
    isRejecting,
    rejectError,
    showRedirectModal,
    selectedRequestForRedirect,
    handleCloseRedirectModal,
    handleRedirectRequest,
    selectedCategoryId,
    setSelectedCategoryId,
    isRedirecting,
    redirectError,
  } = props;

  return (
    <>
      <CompleteTaskModal
        isOpen={showCompleteTaskModal}
        onClose={closeCompleteTaskModal}
        onComplete={handleCompleteTaskSubmit}
        task={selectedTaskForComplete}
        isSubmitting={isSubmittingComplete}
      />
      <RejectSubRequestModal
        isOpen={showRejectSubRequestModal}
        onClose={closeRejectSubRequestModal}
        onReject={handleRejectSubRequestSubmit}
        request={selectedSubRequestForReject}
        isSubmitting={isRejecting}
        error={rejectError}
      />
      <RedirectRequestModal
        isOpen={showRedirectModal && !!selectedRequestForRedirect}
        onClose={handleCloseRedirectModal}
        onSubmit={handleRedirectRequest}
        categories={categories}
        currentCategoryId={selectedRequestForRedirect?.category_id ?? 0}
        selectedCategoryId={selectedCategoryId}
        onCategoryChange={setSelectedCategoryId}
        isSubmitting={isRedirecting}
        error={redirectError}
        usePortal
      />
    </>
  );
}
