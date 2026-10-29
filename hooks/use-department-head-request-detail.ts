"use client";

import { useCallback, useEffect, useState } from "react";
import { useRoleRequestDetail } from "@/hooks/use-role-request-detail";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCategoryStore } from "@/stores/useCategoryStore";
import { useToast } from "@/hooks/use-toast";
import { formatServiceCategoryDisplayName } from "@/constants/requests";
import {
  mapExecutorInCategoryToAssignModal,
  type DepartmentHeadExecutor,
} from "@/components/department-head/requests/department-head-requests-constants";
import { getExecutorsForSubRequestAssignment } from "@/lib/users-management-api";

export function useDepartmentHeadRequestDetail() {
  const {
    isDesktop,
    request,
    loading,
    error,
    reload: fetchRequest,
    handleClose,
  } = useRoleRequestDetail("/department-head/requests");
  const { user, token } = useAuthStore();
  const { categories, fetchCategories } = useCategoryStore();
  const { toast } = useToast();

  const [executors, setExecutors] = useState<DepartmentHeadExecutor[]>([]);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [subRequestForAssign, setSubRequestForAssign] = useState<any>(null);
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [subRequestForChange, setSubRequestForChange] = useState<any>(null);
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [requestForRedirect, setRequestForRedirect] = useState<any>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [redirectError, setRedirectError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (token) fetchCategories(token);
  }, [token, fetchCategories]);

  const subForExecutorList =
    showAssignModal && subRequestForAssign
      ? subRequestForAssign
      : showChangeModal && subRequestForChange
        ? subRequestForChange
        : null;

  useEffect(() => {
    if (isDesktop || !subForExecutorList) {
      if (!subForExecutorList) setExecutors([]);
      return;
    }
    let cancelled = false;
    const officeId = request?.office_id ?? request?.office?.id;
    void getExecutorsForSubRequestAssignment(subForExecutorList, officeId).then((res) => {
      if (cancelled) return;
      if (res.ok) {
        setExecutors(res.data.map(mapExecutorInCategoryToAssignModal));
      } else {
        setExecutors([]);
        console.error("Ошибка загрузки исполнителей:", res.error);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isDesktop, subForExecutorList, request?.office_id, request?.office?.id]);

  const handleRequestUpdated = useCallback(() => {
    fetchRequest();
  }, [fetchRequest]);

  const handleAssignExecutors = useCallback((subRequest: any) => {
    setSubRequestForAssign(subRequest);
    setShowAssignModal(true);
  }, []);

  const closeAssignModal = useCallback(() => {
    setShowAssignModal(false);
    setSubRequestForAssign(null);
  }, []);

  const handleAssignSuccess = useCallback(() => {
    toast({
      title: "Исполнители назначены",
      description: "Исполнители успешно назначены на заявку",
      variant: "success",
    });
    closeAssignModal();
    fetchRequest();
  }, [toast, closeAssignModal, fetchRequest]);

  const handleChangeExecutors = useCallback((subRequest: any) => {
    setSubRequestForChange(subRequest);
    setShowChangeModal(true);
  }, []);

  const closeChangeModal = useCallback(() => {
    setShowChangeModal(false);
    setSubRequestForChange(null);
  }, []);

  const handleChangeSuccess = useCallback(() => {
    toast({
      title: "Исполнители изменены",
      description: "Исполнители успешно изменены для подзаявки",
      variant: "success",
    });
    closeChangeModal();
    fetchRequest();
  }, [toast, closeChangeModal, fetchRequest]);

  const handleOpenRedirectModal = useCallback(
    (subRequest: any) => {
      setRequestForRedirect({ ...subRequest, requestGroup: request });
      setSelectedCategoryId(null);
      setRedirectError(null);
      setShowRedirectModal(true);
    },
    [request]
  );

  const handleCloseRedirectModal = useCallback(() => {
    setShowRedirectModal(false);
    setRequestForRedirect(null);
    setSelectedCategoryId(null);
    setRedirectError(null);
  }, []);

  const handleRedirectRequest = useCallback(async () => {
    if (!requestForRedirect || !selectedCategoryId) return;
    setIsRedirecting(true);
    setRedirectError(null);
    try {
      await api.patch(`/requests/${requestForRedirect.id}`, {
        status: "awaiting_assignment",
        executor_id: null,
        actual_completion_date: null,
        category_id: selectedCategoryId,
        patch_code: 1,
      });
      const categoryName = formatServiceCategoryDisplayName(
        categories.find((c) => c.id === selectedCategoryId)?.name
      );
      toast({
        title: "Подзаявка перенаправлена",
        description: `Подзаявка успешно перенаправлена руководителям категории "${categoryName}"`,
        variant: "success",
      });
      handleCloseRedirectModal();
      fetchRequest();
    } catch (err: any) {
      console.error("Ошибка при перенаправлении заявки:", err);
      setRedirectError(err.response?.data?.error || "Не удалось перенаправить заявку");
    } finally {
      setIsRedirecting(false);
    }
  }, [
    requestForRedirect,
    selectedCategoryId,
    categories,
    toast,
    handleCloseRedirectModal,
    fetchRequest,
  ]);

  return {
    isDesktop,
    request,
    loading,
    error,
    handleClose,
    handleRequestUpdated,
    categories,
    executors,
    userServiceCategoryId: user?.service_category_id,
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
  };
}

export type UseDepartmentHeadRequestDetailResult = ReturnType<typeof useDepartmentHeadRequestDetail>;
