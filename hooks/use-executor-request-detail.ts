"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useIsDesktop } from "@/hooks/use-media-query";
import api from "@/lib/api";
import type { RequestGroup } from "@/stores/useRequestStore";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCategoryStore } from "@/stores/useCategoryStore";

export function useExecutorRequestDetail() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const isDesktop = useIsDesktop();
  const { toast } = useToast();
  const { token } = useAuthStore();
  const { categories, fetchCategories } = useCategoryStore();

  const [request, setRequest] = useState<RequestGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    if (isDesktop && id) {
      router.replace(`/executor/requests?requestId=${id}`);
    }
  }, [isDesktop, router, id]);

  useEffect(() => {
    if (token && !isDesktop) fetchCategories(token);
  }, [token, isDesktop, fetchCategories]);

  useEffect(() => {
    if (!id || isDesktop) return;

    const fetchRequest = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/request-groups/${id}`);
        setRequest(response.data);
      } catch (err) {
        console.error("Ошибка загрузки заявки:", err);
        setError("Не удалось загрузить заявку");
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [id, isDesktop]);

  const refreshRequest = useCallback(async () => {
    if (!id) return;
    const response = await api.get(`/request-groups/${id}`);
    setRequest(response.data);
  }, [id]);

  const handleClose = useCallback(() => {
    router.push("/executor/requests");
  }, [router]);

  const handleRequestUpdated = useCallback(() => {
    router.push("/executor/requests");
  }, [router]);

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
        });
      } catch (err: unknown) {
        console.error("Ошибка при начале выполнения задачи:", err);
        toast({
          title: "Ошибка",
          description: "Не удалось начать выполнение задачи",
          variant: "destructive",
        });
      }
    },
    [request, toast]
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
      const categoryName = categories.find((c) => c.id === selectedCategoryId)?.name;
      toast({
        title: "Подзаявка перенаправлена",
        description: `Подзаявка успешно перенаправлена руководителям категории "${categoryName}"`,
      });
      handleCloseRedirectModal();
      await refreshRequest();
    } catch (err: unknown) {
      console.error("Ошибка при перенаправлении:", err);
      setRedirectError("Не удалось перенаправить подзаявку");
      toast({
        title: "Ошибка",
        description: "Не удалось перенаправить подзаявку",
        variant: "destructive",
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
          variant: "destructive",
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
        toast({ title: "Успешно", description: "Заявка успешно завершена" });
      } catch (err) {
        console.error("Ошибка при завершении задачи", err);
        toast({
          title: "Ошибка",
          description: "Не удалось завершить задачу",
          variant: "destructive",
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
