"use client";

import { useCallback, useEffect, useState } from "react";
import { useRoleRequestDetail } from "@/hooks/use-role-request-detail";
import api from "@/lib/api";
import type { RequestGroup } from "@/stores/useRequestStore";
import { formatServiceCategoryDisplayName } from "@/constants/requests";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCategoryStore } from "@/stores/useCategoryStore";

export function useExecutorRequestDetail() {
  const { id, isDesktop, request, setRequest, loading, error, handleClose, handleRequestUpdated } =
    useRoleRequestDetail("/executor/requests");
  const { toast } = useToast();
  const { token } = useAuthStore();
  const { categories, fetchCategories } = useCategoryStore();

  const [showCompleteTaskModal, setShowCompleteTaskModal] = useState(false);
  const [selectedTaskForComplete, setSelectedTaskForComplete] = useState<any>(null);
  const [isSubmittingComplete, setIsSubmittingComplete] = useState(false);
  const [showRejectSubRequestModal, setShowRejectSubRequestModal] = useState(false);
  const [selectedSubRequestForReject, setSelectedSubRequestForReject] = useState<any>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [selectedRequestForRedirect, setSelectedRequestForRedirect] = useState<any>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectError, setRedirectError] = useState<string | null>(null);

  useEffect(() => {
    if (token && !isDesktop) fetchCategories(token);
  }, [token, isDesktop, fetchCategories]);

  const refreshRequest = useCallback(async () => {
    if (!id) return;
    const response = await api.get(`/request-groups/${id}`);
    setRequest(response.data);
  }, [id, setRequest]);

  const handleStartTask = useCallback(
    async (taskId: string) => {
      if (!request) return;
      try {
        await api.patch(`/requests/${taskId}/execute`);
        setRequest((prev) => {
          if (!prev) return prev;
          const updatedRequests = prev.requests.map((subReq) =>
            subReq.id === parseInt(taskId, 10)
              ? { ...subReq, status: "execution" as const }
              : subReq
          );
          const allInExecution = updatedRequests.every(
            (subReq) => subReq.status === "execution" || subReq.status === "completed"
          );
          return {
            ...prev,
            status: allInExecution ? "execution" : prev.status,
            requests: updatedRequests,
          };
        });
        toast({
          title: "Задача начата",
          description: "Вы успешно начали выполнение задачи",
          variant: "success",
        });
      } catch (err: unknown) {
        console.error("Ошибка при начале выполнения задачи:", err);
        toast({
          title: "Ошибка",
          description: "Не удалось начать выполнение задачи",
          variant: "error",
        });
      }
    },
    [request, setRequest, toast]
  );

  const handleCompleteTask = useCallback(
    (task: any) => {
      setSelectedTaskForComplete({
        ...task,
        request_group_id: task.request_group_id ?? request?.id ?? parseInt(id, 10),
      });
      setShowCompleteTaskModal(true);
    },
    [request?.id, id]
  );

  const closeCompleteTaskModal = useCallback(() => {
    setShowCompleteTaskModal(false);
    setSelectedTaskForComplete(null);
  }, []);

  const handleOpenRedirectModal = useCallback((subRequest: any) => {
    setSelectedRequestForRedirect(subRequest);
    setSelectedCategoryId(null);
    setRedirectError(null);
    setShowRedirectModal(true);
  }, []);

  const handleCloseRedirectModal = useCallback(() => {
    setShowRedirectModal(false);
    setSelectedRequestForRedirect(null);
    setSelectedCategoryId(null);
    setRedirectError(null);
  }, []);

  const handleRedirectRequest = useCallback(async () => {
    if (!selectedRequestForRedirect || !selectedCategoryId) return;
    setIsRedirecting(true);
    setRedirectError(null);
    try {
      await api.patch(`/requests/${selectedRequestForRedirect.id}`, {
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
      await refreshRequest();
    } catch (err: unknown) {
      console.error("Ошибка при перенаправлении:", err);
      setRedirectError("Не удалось перенаправить подзаявку");
      toast({
        title: "Ошибка",
        description: "Не удалось перенаправить подзаявку",
        variant: "error",
      });
    } finally {
      setIsRedirecting(false);
    }
  }, [selectedRequestForRedirect, selectedCategoryId, categories, handleCloseRedirectModal, refreshRequest, toast]);

  const handleRejectSubRequest = useCallback((subRequest: any) => {
    setSelectedSubRequestForReject(subRequest);
    setRejectError(null);
    setShowRejectSubRequestModal(true);
  }, []);

  const closeRejectSubRequestModal = useCallback(() => {
    setShowRejectSubRequestModal(false);
    setSelectedSubRequestForReject(null);
    setRejectError(null);
  }, []);

  const handleCompleteTaskSubmit = useCallback(
    async (comment: string, photos: File[]) => {
      if (!selectedTaskForComplete || !request) return;
      if (photos.length === 0) {
        toast({
          title: "Ошибка",
          description: "Пожалуйста, добавьте хотя бы одну фотографию результата",
          variant: "error",
        });
        return;
      }
      setIsSubmittingComplete(true);
      try {
        const response = await api.patch(`/requests/${selectedTaskForComplete.id}/complete`, {
          comment,
        });
        if (photos.length > 0 && response.data?.requestGroup?.id) {
          const formData = new FormData();
          photos.forEach((photo) => formData.append("photos", photo));
          formData.append("type", "after");
          await api.post(`/request-photos/${response.data.requestGroup.id}/photos`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }
        await refreshRequest();
        closeCompleteTaskModal();
        toast({ title: "Успешно", description: "Заявка успешно завершена", variant: "success" });
      } catch (err) {
        console.error("Ошибка при завершении задачи", err);
        toast({
          title: "Ошибка",
          description: "Не удалось завершить задачу",
          variant: "error",
        });
      } finally {
        setIsSubmittingComplete(false);
      }
    },
    [selectedTaskForComplete, request, refreshRequest, closeCompleteTaskModal, toast]
  );

  const handleRejectSubRequestSubmit = useCallback(
    async (reason: string) => {
      if (!selectedSubRequestForReject) return;
      setIsRejecting(true);
      setRejectError(null);
      try {
        await api.put(`/requests/${selectedSubRequestForReject.id}`, {
          status: "awaiting_assignment",
          patch_code: 1,
        });
        await api.post("/notifications/reject-assigned", {
          request_id: selectedSubRequestForReject.id,
          reason,
        });
        await refreshRequest();
        closeRejectSubRequestModal();
        toast({
          title: "Подзаявка отклонена",
          description: "Подзаявка успешно отклонена и возвращена в очередь назначения",
          variant: "success",
        });
      } catch (err: unknown) {
        console.error("Ошибка при отклонении заявки:", err);
        setRejectError("Не удалось отклонить подзаявку");
      } finally {
        setIsRejecting(false);
      }
    },
    [selectedSubRequestForReject, refreshRequest, closeRejectSubRequestModal, toast]
  );

  return {
    isDesktop,
    request,
    loading,
    error,
    categories,
    handleClose,
    handleRequestUpdated,
    handleStartTask,
    handleCompleteTask,
    handleRejectSubRequest,
    handleOpenRedirectModal,
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
  };
}

export type UseExecutorRequestDetailResult = ReturnType<typeof useExecutorRequestDetail>;
