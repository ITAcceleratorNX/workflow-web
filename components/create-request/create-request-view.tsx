"use client";

import FullScreenLoading from "@/components/FullScreenLoading";
import { CreateRequestModal } from "@/components/CreateRequestModal";
import type { UseCreateRequestPageResult } from "@/hooks/use-create-request-page";

type CreateRequestViewProps = UseCreateRequestPageResult;

/** Standalone create page — mobile parity с workflow-mobile `(tabs)/requests/create.tsx`. */
export function CreateRequestView(props: CreateRequestViewProps) {
  const {
    user,
    isDesktop,
    isLoading,
    isOpen,
    isSubmitting,
    formErrors,
    categories,
    executors,
    offices,
    userCabinetRooms,
    createMode,
    setCreateMode,
    handleSubmit,
    handleClose,
    translateType,
  } = props;

  if (!user) {
    return null;
  }

  if (isLoading) {
    return <FullScreenLoading />;
  }

  return (
    <div className="min-h-screen">
      <CreateRequestModal
        isOpen={isOpen}
        onClose={handleClose}
        userRole={user.role as "client" | "admin-worker" | "department-head" | "executor" | "manager"}
        categories={categories}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        formErrors={formErrors}
        clientLocation=""
        translateType={translateType}
        executors={executors}
        userServiceCategoryId={user.service_category_id}
        createMode={createMode}
        onModeChange={setCreateMode}
        offices={offices}
        userCabinetRooms={userCabinetRooms}
        isFullScreen={!isDesktop}
        isStandalonePage
      />
    </div>
  );
}
