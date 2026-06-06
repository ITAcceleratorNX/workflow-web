"use client";

import { useDepartmentHeadRequestsList } from "@/hooks/use-department-head-requests-list";
import { DepartmentHeadRequestsDesktop } from "./department-head-requests-desktop";
import { DepartmentHeadRequestsMobile } from "./department-head-requests-mobile";
import { DepartmentHeadRequestsModals } from "./department-head-requests-modals";

export function DepartmentHeadRequestsView() {
  const state = useDepartmentHeadRequestsList();

  return (
    <>
      {state.isDesktop ? (
        <DepartmentHeadRequestsDesktop {...state} />
      ) : (
        <DepartmentHeadRequestsMobile {...state} />
      )}
      {state.isDesktop && (
        <DepartmentHeadRequestsModals
          categories={state.categories}
          executors={state.executors}
          userServiceCategoryId={state.userServiceCategoryId}
          showAssignExecutorsModal={state.showAssignExecutorsModal}
          closeAssignExecutorsModal={state.closeAssignExecutorsModal}
          selectedSubRequestForAssignment={state.selectedSubRequestForAssignment}
          handleAssignExecutorsSuccess={state.handleAssignExecutorsSuccess}
          showChangeExecutorsModal={state.showChangeExecutorsModal}
          closeChangeExecutorsModal={state.closeChangeExecutorsModal}
          selectedSubRequestForChange={state.selectedSubRequestForChange}
          handleChangeExecutorsSuccess={state.handleChangeExecutorsSuccess}
          showRedirectModal={state.showRedirectModal}
          selectedRequestForRedirect={state.selectedRequestForRedirect}
          handleCloseRedirectModal={state.handleCloseRedirectModal}
          handleRedirectRequest={state.handleRedirectRequest}
          selectedCategoryId={state.selectedCategoryId}
          setSelectedCategoryId={state.setSelectedCategoryId}
          isRedirecting={state.isRedirecting}
          redirectError={state.redirectError}
        />
      )}
    </>
  );
}
