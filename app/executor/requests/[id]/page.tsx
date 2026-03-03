"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, useParams } from "next/navigation";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/lib/api";
import { RequestGroup } from "@/stores/useRequestStore";
import { RequestDetails } from "@/components/RequestDetails";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCategoryStore } from "@/stores/useCategoryStore";
import { CompleteTaskModal } from "@/components/CompleteTaskModal";
import { RejectSubRequestModal } from "@/components/RejectSubRequestModal";

export default function ExecutorRequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { toast } = useToast();
  const { token } = useAuthStore();
  const { categories, fetchCategories } = useCategoryStore();
  const [request, setRequest] = useState<RequestGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isDesktop) {
      router.replace(`/executor?tab=tasks&requestId=${id}`);
      return;
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

  const handleClose = () => {
    router.push("/executor/requests");
  };

  const handleRequestUpdated = () => {
    router.push("/executor/requests");
  };

  const handleStartTask = async (taskId: string) => {
    if (!request) return;
    try {
      await api.patch(`/requests/${taskId}/execute`);
      setRequest((prev) => {
        if (!prev) return prev;
        const updatedRequests = prev.requests.map((subReq) =>
          subReq.id === parseInt(taskId)
            ? { ...subReq, status: "execution" as const }
            : subReq
        );
        const allInExecution = updatedRequests.every(
          (subReq) =>
            subReq.status === "execution" || subReq.status === "completed"
        );
        const newGroupStatus = allInExecution ? "execution" : prev.status;
        return {
          ...prev,
          status: newGroupStatus,
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
  };

  const [showCompleteTaskModal, setShowCompleteTaskModal] = useState(false);
  const [selectedTaskForComplete, setSelectedTaskForComplete] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectSubRequestModal, setShowRejectSubRequestModal] = useState(false);
  const [selectedSubRequestForReject, setSelectedSubRequestForReject] = useState<any>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [selectedRequestForRedirect, setSelectedRequestForRedirect] = useState<any>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectError, setRedirectError] = useState<string | null>(null);

  const handleOpenRedirectModal = (subRequest: any) => {
    setSelectedRequestForRedirect(subRequest);
    setSelectedCategoryId(null);
    setRedirectError(null);
    setShowRedirectModal(true);
  };

  const handleCloseRedirectModal = () => {
    setShowRedirectModal(false);
    setSelectedRequestForRedirect(null);
    setSelectedCategoryId(null);
    setRedirectError(null);
  };

  const handleRedirectRequest = async () => {
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
      const updatedResponse = await api.get(`/request-groups/${id}`);
      setRequest(updatedResponse.data);
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
  };

  const handleCompleteTask = (task: any) => {
    setSelectedTaskForComplete({
      ...task,
      request_group_id: task.request_group_id ?? request?.id ?? parseInt(id),
    });
    setShowCompleteTaskModal(true);
  };

  const handleRejectSubRequest = (subRequest: any) => {
    setSelectedSubRequestForReject(subRequest);
    setShowRejectSubRequestModal(true);
  };

  const handleCompleteTaskSubmit = async (comment: string, photos: File[]) => {
    if (!selectedTaskForComplete || !request) return;
    if (photos.length === 0) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, добавьте хотя бы одну фотографию результата",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await api.patch(
        `/requests/${selectedTaskForComplete.id}/complete`,
        { comment }
      );
      if (photos.length > 0 && response.data?.requestGroup?.id) {
        const formData = new FormData();
        photos.forEach((photo) => formData.append("photos", photo));
        formData.append("type", "after");
        await api.post(
          `/request-photos/${response.data.requestGroup.id}/photos`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      }
      const updatedResponse = await api.get(`/request-groups/${id}`);
      setRequest(updatedResponse.data);
      setShowCompleteTaskModal(false);
      setSelectedTaskForComplete(null);
      toast({
        title: "Успешно",
        description: "Заявка успешно завершена",
      });
    } catch (err) {
      console.error("Ошибка при завершении задачи", err);
      toast({
        title: "Ошибка",
        description: "Не удалось завершить задачу",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectSubRequestSubmit = async (reason: string) => {
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
      const updatedResponse = await api.get(`/request-groups/${id}`);
      setRequest(updatedResponse.data);
      setShowRejectSubRequestModal(false);
      setSelectedSubRequestForReject(null);
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
  };

  if (isDesktop) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1C1C1E] flex items-center justify-center">
        <p className="text-gray-400">Загрузка...</p>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-[#1C1C1E] p-4">
        <Button
          variant="ghost"
          className="text-white mb-4"
          onClick={() => router.push("/executor/requests")}
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Назад
        </Button>
        <p className="text-red-400">{error || "Заявка не найдена"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1C1C1E]">
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
      <CompleteTaskModal
        isOpen={showCompleteTaskModal}
        onClose={() => {
          setShowCompleteTaskModal(false);
          setSelectedTaskForComplete(null);
        }}
        onComplete={handleCompleteTaskSubmit}
        task={selectedTaskForComplete}
        isSubmitting={isSubmitting}
      />
      <RejectSubRequestModal
        isOpen={showRejectSubRequestModal}
        onClose={() => {
          setShowRejectSubRequestModal(false);
          setSelectedSubRequestForReject(null);
          setRejectError(null);
        }}
        onReject={handleRejectSubRequestSubmit}
        request={selectedSubRequestForReject}
        isSubmitting={isRejecting}
        error={rejectError}
      />
      {showRedirectModal &&
        selectedRequestForRedirect &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50"
            onClick={(e) => e.target === e.currentTarget && handleCloseRedirectModal()}
          >
            <Card
              className="w-full max-w-md bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader>
                <CardTitle>Перенаправить к другой категории</CardTitle>
                <CardDescription>
                  Выберите категорию, к которой нужно перенаправить подзаявку
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="category">Категория</Label>
                  <Select
                    value={selectedCategoryId?.toString() ?? ""}
                    onValueChange={(value) => setSelectedCategoryId(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите категорию" />
                    </SelectTrigger>
                    <SelectContent className="z-[100001]">
                      {categories
                        .filter(
                          (category) =>
                            category.id !== selectedRequestForRedirect.category_id
                        )
                        .map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedCategoryId && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <span className="text-sm text-blue-800">
                        Подзаявка будет перенаправлена руководителям категории
                        &quot;{categories.find((c) => c.id === selectedCategoryId)?.name}&quot;
                      </span>
                    </div>
                  </div>
                )}
                {redirectError && (
                  <p className="text-sm text-red-500">{redirectError}</p>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handleCloseRedirectModal}>
                    Отмена
                  </Button>
                  <Button
                    onClick={handleRedirectRequest}
                    disabled={!selectedCategoryId || isRedirecting}
                  >
                    {isRedirecting ? "Перенаправление..." : "Перенаправить"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>,
          document.body
        )}
    </div>
  );
}
