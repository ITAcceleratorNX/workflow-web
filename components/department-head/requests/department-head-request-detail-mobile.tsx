"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminRequestDetailsModal } from "@/components/AdminRequestDetailsModal";
import { MOBILE_PAGE_GRADIENTS } from "@/constants/mobile-layout";
import type { UseDepartmentHeadRequestDetailResult } from "@/hooks/use-department-head-request-detail";
import { DepartmentHeadRequestsModals } from "./department-head-requests-modals";

type DepartmentHeadRequestDetailMobileProps = UseDepartmentHeadRequestDetailResult;

export function DepartmentHeadRequestDetailMobile(props: DepartmentHeadRequestDetailMobileProps) {
  const {
    request,
    loading,
    error,
    handleClose,
    handleRequestUpdated,
    categories,
    executors,
    userServiceCategoryId,
    showAssignModal,
    closeAssignModal,
    subRequestForAssign,
    handleAssignSuccess,
    showChangeModal,
    closeChangeModal,
    subRequestForChange,
    handleChangeSuccess,
    showRedirectModal,
    requestForRedirect,
    handleCloseRedirectModal,
    handleRedirectRequest,
    selectedCategoryId,
    setSelectedCategoryId,
    isRedirecting,
    redirectError,
    handleAssignExecutors,
    handleChangeExecutors,
    handleOpenRedirectModal,
  } = props;

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: MOBILE_PAGE_GRADIENTS.plain }}
      >
        <p className="text-gray-400">Загрузка...</p>
      </div>
    );
  }

  if (error || !request) {
    return (
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
    );
  }

  return (
    <div className="min-h-screen" style={{ background: MOBILE_PAGE_GRADIENTS.plain }}>
      <AdminRequestDetailsModal
        request={request}
        onClose={handleClose}
        onRequestUpdated={handleRequestUpdated}
        sourceTab="incoming"
        hideFullModeButton
        userRole="department-head"
        fullModeRedirectBase="/department-head"
        onAssignExecutor={handleAssignExecutors}
        onRedirectToOtherDepartment={handleOpenRedirectModal}
        onChangeExecutors={handleChangeExecutors}
      />

      <DepartmentHeadRequestsModals
        categories={categories}
        executors={executors}
        userServiceCategoryId={userServiceCategoryId}
        showAssignExecutorsModal={showAssignModal}
        closeAssignExecutorsModal={closeAssignModal}
        selectedSubRequestForAssignment={subRequestForAssign}
        handleAssignExecutorsSuccess={handleAssignSuccess}
        showChangeExecutorsModal={showChangeModal}
        closeChangeExecutorsModal={closeChangeModal}
        selectedSubRequestForChange={subRequestForChange}
        handleChangeExecutorsSuccess={handleChangeSuccess}
        showRedirectModal={showRedirectModal}
        selectedRequestForRedirect={requestForRedirect}
        handleCloseRedirectModal={handleCloseRedirectModal}
        handleRedirectRequest={handleRedirectRequest}
        selectedCategoryId={selectedCategoryId}
        setSelectedCategoryId={setSelectedCategoryId}
        isRedirecting={isRedirecting}
        redirectError={redirectError}
      />
    </div>
  );
}
