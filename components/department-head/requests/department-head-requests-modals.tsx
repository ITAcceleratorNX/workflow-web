"use client";

import { AssignExecutorsModal, RedirectRequestModal } from "@/components/requests";
import { ChangeExecutorsModal } from "@/components/ChangeExecutorsModal";
import type { DepartmentHeadExecutor } from "./department-head-requests-constants";

export interface DepartmentHeadRequestsModalsState {
  categories: { id: number; name: string }[];
  executors: DepartmentHeadExecutor[];
  userServiceCategoryId?: number;
  showAssignExecutorsModal: boolean;
  closeAssignExecutorsModal: () => void;
  selectedSubRequestForAssignment: any;
  handleAssignExecutorsSuccess: () => void;
  showChangeExecutorsModal: boolean;
  closeChangeExecutorsModal: () => void;
  selectedSubRequestForChange: any;
  handleChangeExecutorsSuccess: () => void;
  showRedirectModal: boolean;
  selectedRequestForRedirect: any;
  handleCloseRedirectModal: () => void;
  handleRedirectRequest: () => void;
  selectedCategoryId: number | null;
  setSelectedCategoryId: (id: number) => void;
  isRedirecting: boolean;
  redirectError: string | null;
}

export function DepartmentHeadRequestsModals(props: DepartmentHeadRequestsModalsState) {
  const {
    categories,
    executors,
    userServiceCategoryId,
    showAssignExecutorsModal,
    closeAssignExecutorsModal,
    selectedSubRequestForAssignment,
    handleAssignExecutorsSuccess,
    showChangeExecutorsModal,
    closeChangeExecutorsModal,
    selectedSubRequestForChange,
    handleChangeExecutorsSuccess,
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
      <AssignExecutorsModal
        isOpen={showAssignExecutorsModal}
        onClose={closeAssignExecutorsModal}
        subRequest={selectedSubRequestForAssignment}
        executors={executors}
        userServiceCategoryId={userServiceCategoryId}
        onSuccess={handleAssignExecutorsSuccess}
        variant="dark"
      />
      <ChangeExecutorsModal
        isOpen={showChangeExecutorsModal}
        onClose={closeChangeExecutorsModal}
        subRequest={selectedSubRequestForChange}
        executors={executors}
        userServiceCategoryId={userServiceCategoryId}
        onSuccess={handleChangeExecutorsSuccess}
        variant="dark"
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
        title={`Перенаправить заявку #${selectedRequestForRedirect?.id ?? ""}`}
        description="Выберите категорию, к которой нужно перенаправить заявку"
        variant="dark"
      />
    </>
  );
}
