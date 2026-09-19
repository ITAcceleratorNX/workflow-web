"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Eye,
  Loader2,
  MapPin,
  MessageCircle,
  Play,
  Send,
  User,
  XCircle,
  Zap,
  Calendar as CalendarLucid,
} from "lucide-react";
import { RequestGroup, SubRequest } from "@/stores/useRequestStore";
import { formatDateOnly, formatDateTime } from "@/lib/dateTimeUtils";
import Executors from "@/components/Executors";
import {
  AdminAcceptRequestModal,
  AdminRejectRequestModal,
  StaffCompleteModal,
  type AdminAcceptRequestPayload,
} from "./admin-request-decision-modals";
import { EditRequestGroupModal, type UpdateRequestGroupPayload } from "./edit-request-group-modal";
import { RequestActionMenu } from "./request-action-menu-sheet";
import { RequestDetailMobileBody } from "./request-detail-mobile-body";
import { CompletedTaskReport } from "@/components/CompletedTaskReport";
import { getPreviewUrl } from "@/lib/imageOptimization";
import { IconInfoModal } from "@/components/IconInfoModal";
import { CommentsModal } from "./comments-modal";
import { MapModal } from "@/components/MapModal";
import PhotoModal from "@/components/photo/PhotoModal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RatingModal } from "@/components/RatingModal";
import ClientRatingModal from "@/components/ClientRatingModal";
import api, { getOffices } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/useAuthStore";
import { getServiceCategories } from "@/lib/service-categories-api";
import {
  isStaffCompletableSubRequest,
  type RequestUserRole,
} from "@/lib/request-action-config";
import {
  getStatusLabel,
  getTypeLabel,
  isAdministrativeRequestGroup,
} from "@/constants/requests";
import { getRoleBasePath } from "@/constants/roles";
import { useIsDesktop } from "@/hooks/use-media-query";

const getTypeBadgeClass = (type: string) => {
  switch (type) {
    case "urgent":
      return "text-white bg-[#B8400E]";
    case "planned":
      return "text-white bg-[#114A65]";
    default:
      return "text-white bg-[#114A65]";
  }
};

const getStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case "completed":
      return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    case "in_progress":
    case "execution":
      return <Zap className="w-4 h-4 text-[#114A65]" />;
    case "awaiting_assignment":
    case "awaiting_sla":
      return <Clock className="w-4 h-4 text-[#B8400E]" />;
    case "assigned":
      return <User className="w-4 h-4 text-[#114A65]" />;
    case "rejected":
      return <XCircle className="w-4 h-4 text-[#B8400E]" />;
    default:
      return null;
  }
};


export type RequestDetailsUserRole = "admin-worker" | "department-head" | "executor" | "client" | "manager";

export interface RequestDetailsProps {
  request: RequestGroup;
  onClose: () => void;
  onRequestUpdated?: () => void;
  sourceTab?: "incoming" | "my-requests" | "tasks" | "myTasks" | "completed";
  hideFullModeButton?: boolean;
  userRole?: RequestDetailsUserRole;
  fullModeRedirectBase?: string;
  /** admin-worker / department-head: назначить исполнителя */
  onAssignExecutor?: (subRequest: SubRequest) => void;
  /** department-head: перенаправить в другой отдел */
  onRedirectToOtherDepartment?: (subRequest: any) => void;
  /** department-head: изменить исполнителей */
  onChangeExecutors?: (subRequest: SubRequest) => void;
  /** executor: отклонить подзаявку */
  onReject?: (request: any) => void;
  /** executor: начать задачу */
  onStartTask?: (id: string) => void;
  /** executor: завершить задачу */
  onCompleteTask?: (request: any) => void;
  /** executor: перенаправить подзаявку */
  onExecutorRedirect?: (request: any) => void;
  /** executor/client: переключить долгосрочная */
  onToggleLongTerm?: (requestId: number, requestGroupId: number, currentStatus: boolean) => void;
  /** executor: оценить клиента */
  onRateClient?: (requestGroup: any) => void;
  /** executor/client: оценить заявку */
  onRateRequest?: (request: any) => void;
  /** executor/client: удалить подзаявку */
  onDelete?: (request: any) => void;
  /** встроить в боковую панель (десктоп) — без fixed, как в мобилке */
  embedInPanel?: boolean;
}

export function RequestDetails({
  request: selectedRequest,
  onClose,
  onRequestUpdated,
  sourceTab = "incoming",
  hideFullModeButton = false,
  userRole: userRoleProp = "admin-worker",
  fullModeRedirectBase,
  onAssignExecutor: onAssignExecutorProp,
  onRedirectToOtherDepartment: onRedirectToOtherDepartmentProp,
  onChangeExecutors: onChangeExecutorsProp,
  onReject: onRejectProp,
  onStartTask: onStartTaskProp,
  onCompleteTask: onCompleteTaskProp,
  onExecutorRedirect: onExecutorRedirectProp,
  onToggleLongTerm: onToggleLongTermProp,
  onRateClient: onRateClientProp,
  onRateRequest: onRateRequestProp,
  onDelete: onDeleteProp,
  embedInPanel = false,
}: RequestDetailsProps) {
  const isDesktop = useIsDesktop();
  const actionMenuVariant = isDesktop ? "dialog" : "sheet";
  const basePath = fullModeRedirectBase ?? getRoleBasePath(userRoleProp);
  const router = useRouter();
  const { toast } = useToast();
  const { user, token } = useAuthStore();
  const [showComments, setShowComments] = useState<number | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<{
    url: string;
    created_at?: string;
  } | null>(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapLocation, setMapLocation] = useState({ lat: 0, lon: 0, accuracy: 0 });
  const [showIconInfo, setShowIconInfo] = useState<{
    type: "status" | "longTerm";
    value: string;
  } | null>(null);

  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<string | null>(null);

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [requestToRate, setRequestToRate] = useState<SubRequest | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [showClientRatingModal, setShowClientRatingModal] = useState(false);
  const [clientRatingValue, setClientRatingValue] = useState(0);
  const [clientRatingComment, setClientRatingComment] = useState("");

  const [showAcceptGroupModal, setShowAcceptGroupModal] = useState(false);
  const [showRejectGroupModal, setShowRejectGroupModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStaffCompleteModal, setShowStaffCompleteModal] = useState(false);
  const [staffCompleteCount, setStaffCompleteCount] = useState(0);
  const [adminModalError, setAdminModalError] = useState<string | null>(null);
  const [offices, setOffices] = useState<{ id: number; name: string }[]>([]);
  const [editCategories, setEditCategories] = useState<{ id: number; name: string }[]>([]);
  /** Офис, выбранный в модалке принятия: категории грузятся под него. */
  const [acceptOfficeId, setAcceptOfficeId] = useState<number | null>(null);
  const [acceptCategories, setAcceptCategories] = useState<{ id: number; name: string }[]>([]);
  const [acceptCategoriesLoading, setAcceptCategoriesLoading] = useState(false);

  useEffect(() => {
    if (!showEditModal || !selectedRequest) {
      if (!showEditModal) setEditCategories([]);
      return;
    }
    const officeId = selectedRequest.office_id ?? selectedRequest.office?.id;
    if (!officeId) {
      setEditCategories([]);
      return;
    }
    let cancelled = false;
    void getServiceCategories(officeId).then((res) => {
      if (cancelled) return;
      if (res.ok) {
        setEditCategories(res.data.map((c) => ({ id: c.id, name: c.name })));
      } else {
        setEditCategories([]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [showEditModal, selectedRequest]);

  useEffect(() => {
    if (userRoleProp !== "admin-worker" || !showAcceptGroupModal) return;
    getOffices()
      .then((res) => setOffices(res.data || []))
      .catch(() => setOffices([]));
  }, [userRoleProp, showAcceptGroupModal]);

  /** Категории привязаны к офису: перезагружаем их при смене офиса в модалке принятия. */
  useEffect(() => {
    if (!showAcceptGroupModal || acceptOfficeId == null) {
      if (!showAcceptGroupModal) {
        setAcceptCategories([]);
        setAcceptCategoriesLoading(false);
      }
      return;
    }
    let cancelled = false;
    setAcceptCategoriesLoading(true);
    void getServiceCategories(acceptOfficeId).then((res) => {
      if (cancelled) return;
      setAcceptCategories(res.ok ? res.data.map((c) => ({ id: c.id, name: c.name })) : []);
      setAcceptCategoriesLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [showAcceptGroupModal, acceptOfficeId]);

  /** Административную заявку ведёт офис-менеджер; администратор только наблюдает. */
  const isAdministrative = isAdministrativeRequestGroup(selectedRequest);

  const staffCompleteDefaultComment =
    userRoleProp === "department-head"
      ? "Завершено офис-менеджером"
      : "Завершено администратором";

  /** «Взять в работу»: администратор закрепляет КТО/Клининг заявку за собой. */
  const handleAdminTakeGroup = async () => {
    try {
      setIsSubmitting(true);
      setFormErrors(null);
      await api.patch(`/request-groups/${selectedRequest.id}/take`);
      toast({ title: "Заявка закреплена за вами" });
      onRequestUpdated?.();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Ошибка при взятии заявки в работу";
      setFormErrors(msg);
      toast({ title: msg, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Взять административную заявку в работу без назначения исполнителя. */
  const handleStaffStartRequest = async (subReq: SubRequest) => {
    try {
      setIsSubmitting(true);
      setFormErrors(null);
      await api.patch(`/requests/${subReq.id}/admin-start`);
      toast({ title: "Заявка взята в работу" });
      onRequestUpdated?.();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Ошибка при изменении статуса";
      setFormErrors(msg);
      toast({ title: msg, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminCompleteRequest = async (comment?: string) => {
    try {
      setIsSubmitting(true);
      setFormErrors(null);
      setAdminModalError(null);
      const completionComment = comment?.trim() || rejectionReason || staffCompleteDefaultComment;
      const targets = selectedRequest.requests.filter(isStaffCompletableSubRequest);
      if (!targets.length) {
        const msg = "Нет подзаявок для завершения";
        setFormErrors(msg);
        setAdminModalError(msg);
        return;
      }
      for (const subReq of targets) {
        await api.patch(`/requests/${subReq.id}/admin-complete`, {
          comment: completionComment,
        });
      }
      toast({
        title:
          userRoleProp === "department-head"
            ? "Заявка завершена"
            : "Заявка завершена администратором",
      });
      setShowStaffCompleteModal(false);
      onRequestUpdated?.();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Ошибка при завершении заявки";
      setFormErrors(msg);
      setAdminModalError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminAcceptFromModal = async (payload: AdminAcceptRequestPayload) => {
    try {
      setIsSubmitting(true);
      setAdminModalError(null);
      await api.patch(`/request-groups/${selectedRequest.id}`, {
        patch_code: 1,
        sub_requests: payload.sub_requests,
        request_type: payload.request_type,
        location_detail: payload.location_detail,
        office_id: payload.office_id,
      });
      toast({ title: "Заявка передана офис-менеджеру" });
      setShowAcceptGroupModal(false);
      onRequestUpdated?.();
      onClose();
    } catch {
      setAdminModalError("Ошибка при принятии заявки");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminRejectFromModal = async (reason: string) => {
    try {
      setIsSubmitting(true);
      setAdminModalError(null);
      await api.patch(`/request-groups/${selectedRequest.id}`, {
        patch_code: 2,
        rejection_reason: reason,
      });
      toast({ title: "Заявка отклонена" });
      setShowRejectGroupModal(false);
      onRequestUpdated?.();
      onClose();
    } catch {
      setAdminModalError("Ошибка при отклонении заявки");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditRequestGroup = async (body: UpdateRequestGroupPayload) => {
    try {
      setIsSubmitting(true);
      setAdminModalError(null);
      await api.put(`/request-groups/${selectedRequest.id}`, body);
      toast({ title: "Заявка обновлена" });
      setShowEditModal(false);
      onRequestUpdated?.();
    } catch {
      setAdminModalError("Ошибка при сохранении заявки");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openStaffCompleteModal = () => {
    const targets = selectedRequest.requests.filter(isStaffCompletableSubRequest);
    if (!targets.length) {
      toast({ title: "Нет подзаявок для завершения", variant: "destructive" });
      return;
    }
    setStaffCompleteCount(targets.length);
    setAdminModalError(null);
    setShowStaffCompleteModal(true);
  };

  const handleRateExecutor = async () => {
    if (!requestToRate || ratingValue <= 0) return;
    try {
      const existing = userRatings[requestToRate.id]?.rating;
      const isUpdate = !!existing;
      await api[isUpdate ? "put" : "post"]("/ratings", {
        rating: ratingValue,
        request_id: requestToRate.id,
        comment: ratingComment,
      });
      toast({ title: "Оценка отправлена" });
      setShowRatingModal(false);
      setRequestToRate(null);
      setRatingValue(0);
      setRatingComment("");
      onRequestUpdated?.();
    } catch (err) {
      toast({ title: "Ошибка при отправке оценки", variant: "destructive" });
    }
  };

  const handleRateClient = async () => {
    if (!selectedRequest || clientRatingValue <= 0) return;
    try {
      const existing = selectedRequest.clientRatings?.[0]?.rating;
      const isUpdate = !!existing;
      await api[isUpdate ? "put" : "post"]("/client-ratings", {
        rating: clientRatingValue,
        request_group_id: selectedRequest.id,
        comment: clientRatingComment,
      });
      toast({ title: "Оценка клиента отправлена" });
      setShowClientRatingModal(false);
      setClientRatingValue(0);
      setClientRatingComment("");
      onRequestUpdated?.();
    } catch (err) {
      toast({ title: "Ошибка при отправке оценки клиента", variant: "destructive" });
    }
  };

  const userRatings: Record<number, { rating: number }> = {};
  selectedRequest.requests.forEach((subReq) => {
    if (subReq.ratings?.[0]?.rating != null) {
      userRatings[subReq.id] = { rating: subReq.ratings[0].rating };
    }
  });

  const subRequest = selectedRequest.requests?.[0];

  const isExecutorLeader = !!subRequest?.executors?.some(
    (executor) =>
      executor?.user?.id === user?.id && executor?.RequestExecutor?.role === "leader",
  );

  const handleToggleLongTerm = async (
    requestId: number,
    requestGroupId: number,
    currentStatus: boolean
  ) => {
    try {
      await api.patch(`/requests/${requestId}/long-term`, {
        is_long_term: !currentStatus,
      });
      toast({
        title: currentStatus
          ? "Задача снята с долгосрочных"
          : "Задача помечена как долгосрочная",
      });
      onRequestUpdated?.();
    } catch (error) {
      toast({ title: "Ошибка", variant: "destructive" });
    }
  };

  const handleDeleteSubRequest = async (subRequestToDelete: SubRequest) => {
    try {
      await api.delete(`/requests/${subRequestToDelete.id}`);
      toast({ title: "Подзаявка удалена" });
      onClose();
      onRequestUpdated?.();
    } catch (error) {
      toast({ title: "Ошибка при удалении", variant: "destructive" });
    }
  };

  const openFullMode = () => {
    const tab = sourceTab === "myTasks" ? "myTasks" : sourceTab === "completed" ? "completed" : "tasks";
    router.push(`${basePath}?tab=${tab}&requestId=${selectedRequest.id}`);
    onClose();
  };

  // КТО/Клининг ждёт решения администратора: взять в работу или передать офис-менеджеру.
  // Административную заявку он не обрабатывает — её ведёт офис-менеджер.
  const showAcceptReject =
    embedInPanel &&
    userRoleProp === "admin-worker" &&
    !isAdministrative &&
    !selectedRequest.taken_by_admin_id &&
    selectedRequest.status === "in_progress" &&
    hideFullModeButton;

  // Заявку, взятую администратором в работу, он же и закрывает — из «Исполнения».
  const showAdminComplete =
    embedInPanel &&
    userRoleProp === "admin-worker" &&
    !isAdministrative &&
    (["awaiting_assignment", "assigned"].includes(selectedRequest.status) ||
      (selectedRequest.status === "execution" && !!selectedRequest.taken_by_admin_id)) &&
    hideFullModeButton;

  if (!hideFullModeButton) {
    return null;
  }

  if (!subRequest) {
    const wrapperClass = embedInPanel
      ? "flex flex-col h-full bg-[#1C1C1E]"
      : "fixed inset-0 z-[100] bg-[#040404] flex flex-col";
    return (
      <div
        className={wrapperClass}
        style={embedInPanel ? undefined : { paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {!embedInPanel && (
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
            <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-muted/50" aria-label="Назад к заявкам">
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>
            <h1 className="text-xl font-bold text-foreground">Заявка #{selectedRequest.id}</h1>
          </div>
        )}
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-muted-foreground">Нет данных заявки</p>
        </div>
      </div>
    );
  }

  const actionBar = (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => setShowComments(subRequest.id)}
        className="p-2 rounded-full hover:bg-muted/50"
        aria-label="Комментарии"
      >
        <MessageCircle
          className={`w-5 h-5 ${
            showComments === subRequest.id ? "text-[#F35713]" : "text-muted-foreground"
          }`}
        />
      </button>
      <RequestActionMenu
        request={selectedRequest}
        subRequest={subRequest}
        userRole={userRoleProp as RequestUserRole}
        variant={actionMenuVariant}
        userId={user?.id}
        userServiceCategoryId={user?.service_category_id}
        isExecutorLeader={isExecutorLeader}
        onRateRequest={
          onRateRequestProp
            ? (sr) => onRateRequestProp(sr)
            : (sr) => {
                setRequestToRate(sr);
                setRatingValue(userRatings[sr.id]?.rating || 0);
                setRatingComment("");
                setShowRatingModal(true);
              }
        }
        onRateClient={
          onRateClientProp
            ? () => onRateClientProp(selectedRequest)
            : () => {
                setClientRatingValue(selectedRequest.clientRatings?.[0]?.rating || 0);
                setClientRatingComment("");
                setShowClientRatingModal(true);
              }
        }
        onDelete={onDeleteProp ?? handleDeleteSubRequest}
        onToggleLongTerm={onToggleLongTermProp ?? handleToggleLongTerm}
        onAssignExecutor={
          onAssignExecutorProp
            ? (sr) => onAssignExecutorProp(sr)
            : undefined
        }
        onChangeExecutors={
          onChangeExecutorsProp
            ? (sr) => onChangeExecutorsProp(sr)
            : undefined
        }
        onRedirect={
          onRedirectToOtherDepartmentProp
            ? (sr) => onRedirectToOtherDepartmentProp(sr)
            : onExecutorRedirectProp
              ? (sr) => onExecutorRedirectProp(sr)
              : undefined
        }
        onReject={onRejectProp ? (sr) => onRejectProp(sr) : undefined}
        onStartTask={
          onStartTaskProp ? (id) => onStartTaskProp(String(id)) : undefined
        }
        onCompleteTask={onCompleteTaskProp ? (sr) => onCompleteTaskProp(sr) : undefined}
        onOpenComments={() => setShowComments(subRequest.id)}
        onAdminAcceptGroup={
          userRoleProp === "admin-worker" && selectedRequest.status === "in_progress"
            ? () => {
                setAdminModalError(null);
                setShowAcceptGroupModal(true);
              }
            : undefined
        }
        onAdminRejectGroup={
          userRoleProp === "admin-worker" && selectedRequest.status === "in_progress"
            ? () => {
                setAdminModalError(null);
                setShowRejectGroupModal(true);
              }
            : undefined
        }
        onAdminCompleteGroup={
          userRoleProp === "admin-worker" || userRoleProp === "department-head"
            ? openStaffCompleteModal
            : undefined
        }
        onStaffStartGroup={
          userRoleProp === "department-head"
            ? (sr) => void handleStaffStartRequest(sr)
            : undefined
        }
        onAdminTakeGroup={
          userRoleProp === "admin-worker" ? () => void handleAdminTakeGroup() : undefined
        }
        onEditRequestGroup={
          (userRoleProp === "admin-worker" || userRoleProp === "manager") &&
          selectedRequest.status !== "completed"
            ? () => {
                setAdminModalError(null);
                setShowEditModal(true);
              }
            : undefined
        }
      />
    </div>
  );

  const wrapperClass = embedInPanel
    ? "flex flex-col h-full bg-[#1C1C1E] min-h-0"
    : "fixed inset-0 z-[100] bg-[#040404] flex flex-col";
  const wrapperStyle = embedInPanel
    ? undefined
    : { paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" };
  const contentPaddingBottom = embedInPanel
    ? "pb-4"
    : "pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]";

  return (
    <>
      <div className={wrapperClass} style={wrapperStyle}>
        <div className="flex flex-col h-full min-h-0">
          {!embedInPanel && (
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowComments(null);
                  onClose();
                }}
                className="p-2 rounded-full hover:bg-muted/50"
                aria-label="Назад к заявкам"
              >
                <ArrowLeft className="w-6 h-6 text-foreground" />
              </button>
              <h1 className="text-xl font-bold text-foreground flex-1">
                Заявка #{selectedRequest.id}
              </h1>
              {actionBar}
            </div>
          )}
          {embedInPanel && (
            <div className="flex items-center justify-end gap-1 p-2 border-b border-gray-800 shrink-0">
              {actionBar}
            </div>
          )}

          <div className={`flex-1 overflow-y-auto p-4 min-h-0 ${contentPaddingBottom}`}>
            {!embedInPanel ? (
              <RequestDetailMobileBody
                request={selectedRequest}
                onPhotoClick={(photo) => setSelectedPhoto(photo)}
                userRole={userRoleProp}
              />
            ) : (
            <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {getStatusIcon(selectedRequest.status)}
              <span className="text-white">
                {getStatusLabel(selectedRequest.status)}
              </span>
              <span
                className={`text-xs font-medium px-3 py-1 rounded-full ${getTypeBadgeClass(
                  selectedRequest.request_type
                )}`}
              >
                {getTypeLabel(selectedRequest.request_type)}
              </span>
              {(subRequest.is_long_term ||
                selectedRequest.requests?.some(
                  (r: SubRequest) => r.is_long_term
                )) && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full text-[#114A65] border border-[#114A65]">
                  Долгосрочная
                </span>
              )}
            </div>

            {selectedRequest.request_type === "planned" &&
              selectedRequest.planned_date && (
                <div className="bg-[#1C1C1E] rounded-xl p-4 flex items-center gap-2">
                  <CalendarLucid className="w-4 h-4 text-[#114A65]" />
                  <div>
                    <p className="text-gray-400 text-sm">Запланировано на</p>
                    <p className="text-white">
                    {formatDateOnly(selectedRequest.planned_date)}
                    </p>
                  </div>
                </div>
              )}

            {subRequest.title && (
              <div className="bg-[#1C1C1E] rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-1">Заявка</p>
                <p className="text-white font-medium">{subRequest.title}</p>
                {subRequest.category?.name && (
                  <p className="text-gray-400 text-sm mt-1">
                    {subRequest.category.name}
                  </p>
                )}
              </div>
            )}

            {!subRequest.title && subRequest.category?.name && (
              <div className="bg-[#1C1C1E] rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-1">Категория</p>
                <p className="text-white">{subRequest.category.name}</p>
              </div>
            )}

            {subRequest.description && (
              <div className="bg-[#1C1C1E] rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-1">Описание</p>
                <p className="text-white whitespace-pre-wrap break-words">
                  {subRequest.description}
                </p>
              </div>
            )}

            {(subRequest.complexity || subRequest.sla) && (
              <div className="bg-[#1C1C1E] rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-2">Доп. информация</p>
                <div className="flex flex-wrap gap-3 text-white text-sm">
                  {subRequest.complexity && (
                    <span>
                      Сложность:{" "}
                      {subRequest.complexity === "complex"
                        ? "комплексный"
                        : subRequest.complexity === "simple"
                          ? "простой"
                          : subRequest.complexity === "medium"
                            ? "средний"
                            : subRequest.complexity}
                    </span>
                  )}
                  {subRequest.sla && (
                    <span>Срок: {subRequest.sla}</span>
                  )}
                </div>
              </div>
            )}

            <div className="bg-[#1C1C1E] rounded-xl p-4 [&_.text-gray-900]:text-white [&_.text-gray-800]:text-gray-200 [&_.text-gray-600]:text-gray-300 [&_.text-gray-500]:text-gray-400 [&_.bg-gray-50]:bg-gray-800/50 [&_.bg-gray-100]:bg-gray-800 [&_.border-gray-100]:border-gray-700 [&_.border-gray-200]:border-gray-600">
              {(subRequest.executors && subRequest.executors.length > 0) ||
              subRequest.executor ? (
                <Executors
                  subRequest={subRequest}
                  userRatings={userRatings}
                />
              ) : (
                <>
                  <p className="text-gray-400 text-sm mb-1">Исполнители</p>
                  <p className="text-white/80 text-sm">
                    Исполнители не назначены
                  </p>
                </>
              )}
            </div>

            {subRequest.status === "completed" && (
              <div className="bg-[#1C1C1E] rounded-xl p-4 [&_.bg-white]:bg-gray-800/50 [&_.text-gray-700]:text-gray-200 [&_.text-gray-400]:text-gray-400 [&_.border-gray-200]:border-gray-600">
                <CompletedTaskReport
                  subRequest={subRequest}
                  isDesktop={embedInPanel}
                  onPhotoClick={(url) =>
                    setSelectedPhoto({ url, created_at: undefined })
                  }
                />
              </div>
            )}

            {isAdministrative && userRoleProp === "admin-worker" && (
              <div className="bg-[#114A65]/20 border border-[#114A65]/40 rounded-xl p-4 flex items-start gap-3">
                <Eye className="w-4 h-4 mt-0.5 shrink-0 text-[#8AB4C8]" />
                <p className="text-sm text-[#CDE3EE]">
                  Административная заявка. Её ведёт офис-менеджер офиса — вы видите её
                  для контроля статуса и истории.
                </p>
              </div>
            )}

            {selectedRequest.takenByAdmin?.full_name && (
              <div className="bg-[#1C1C1E] rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-1">Ответственный</p>
                <p className="text-white">{selectedRequest.takenByAdmin.full_name}</p>
              </div>
            )}

            {selectedRequest.office?.name && (
              <div className="bg-[#1C1C1E] rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-1">Офис</p>
                <p className="text-white">{selectedRequest.office.name}</p>
                {selectedRequest.office.address && (
                  <p className="text-gray-400 text-sm mt-1">{selectedRequest.office.address}</p>
                )}
              </div>
            )}

            {selectedRequest.location_detail && (
              <div className="bg-[#1C1C1E] rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-1">Локация в офисе</p>
                <p className="text-white">{selectedRequest.location_detail}</p>
              </div>
            )}

            {selectedRequest.location && (
              <div className="bg-[#1C1C1E] rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <p className="text-white text-sm">Координаты заявки</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const locText = selectedRequest.location;
                    const latMatch = locText.match(/Широта: (-?\d+\.\d+)/);
                    const lonMatch = locText.match(/Долгота: (-?\d+\.\d+)/);
                    const accMatch = locText.match(/±(\d+) м/);
                    if (latMatch && lonMatch && accMatch) {
                      setMapLocation({
                        lat: parseFloat(latMatch[1]),
                        lon: parseFloat(lonMatch[1]),
                        accuracy: parseInt(accMatch[1]),
                      });
                      setShowMapModal(true);
                    } else {
                      toast({
                        title: "Ошибка",
                        description: "Не удалось определить координаты",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-[#262626] border border-gray-600 text-white text-sm font-medium active:bg-gray-700"
                >
                  <MapPin className="w-4 h-4" />
                  Показать на карте
                </button>
              </div>
            )}

            <div className="bg-[#1C1C1E] rounded-xl p-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <p className="text-white">
                {formatDateTime(selectedRequest.created_date)}
              </p>
            </div>

            {showAcceptReject && (
              <div className="bg-[#1C1C1E] rounded-xl p-4 space-y-3 border border-[#3A3A3C]">
                <h3 className="text-white font-medium">Действия по заявке</h3>
                <p className="text-gray-400 text-sm">
                  Возьмите заявку в работу и ведите её сами или передайте
                  офис-менеджеру офиса заявки.
                </p>
                {formErrors && <p className="text-[#F35713] text-sm">{formErrors}</p>}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    onClick={() => void handleAdminTakeGroup()}
                    disabled={isSubmitting}
                    className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Взять в работу
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAdminModalError(null);
                      setShowAcceptGroupModal(true);
                    }}
                    disabled={isSubmitting}
                    className="flex-1 border-white/20 text-white hover:bg-white/10"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Передать Офис-менеджеру
                  </Button>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAdminModalError(null);
                    setShowRejectGroupModal(true);
                  }}
                  disabled={isSubmitting}
                  className="w-full border-red-500/50 text-red-400 hover:bg-red-500/20"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Отклонить заявку
                </Button>
              </div>
            )}

            {/* Блок завершения задачи админом для awaiting_assignment/assigned статусов */}
            {showAdminComplete && (
              <div className="bg-[#1C1C1E] rounded-xl p-4 space-y-4 border border-[#3A3A3C]">
                <h3 className="text-white font-medium">Завершение задачи администратором</h3>
                <div>
                  <Label className="text-xs text-gray-400">Комментарий (опционально)</Label>
                  <Textarea
                    placeholder="Укажите комментарий к завершению..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="mt-1 bg-[#1C1C1E] border-[#3A3A3C] text-white placeholder:text-gray-500 min-h-[80px]"
                  />
                </div>
                {formErrors && (
                  <p className="text-[#F35713] text-sm">{formErrors}</p>
                )}
                <Button
                  onClick={() => void handleAdminCompleteRequest()}
                  disabled={isSubmitting}
                  className="w-full bg-[#114A65] hover:bg-[#0d3a4f] text-white"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Завершить задачу (без исполнителя)
                    </>
                  )}
                </Button>
                <p className="text-gray-500 text-xs text-center">
                  Завершите задачу сразу без назначения исполнителя и отправки руководителю
                </p>
              </div>
            )}

            {selectedRequest.photos && selectedRequest.photos.filter((p: any) => p.type === "before").length > 0 && (
              <div className="bg-[#1C1C1E] rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-3">Фотографии (до выполнения)</p>
                <div className="grid grid-cols-3 gap-2">
                  {selectedRequest.photos
                    .filter((p: any) => p.type === "before")
                    .map((photo: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() =>
                          setSelectedPhoto({
                            url: photo.photo_url,
                            created_at: photo.created_at,
                          })
                        }
                        className="aspect-square rounded-lg overflow-hidden bg-gray-800"
                      >
                        <img
                          src={getPreviewUrl(photo.photo_url)}
                          alt={`До ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                </div>
              </div>
            )}

            {selectedRequest.photos && selectedRequest.photos.filter((p: any) => p.type === "after").length > 0 && (
              <div className="bg-[#1C1C1E] rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-3">Фотографии (после выполнения)</p>
                <div className="grid grid-cols-3 gap-2">
                  {selectedRequest.photos
                    .filter((p: any) => p.type === "after")
                    .map((photo: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() =>
                          setSelectedPhoto({
                            url: photo.photo_url,
                            created_at: photo.created_at,
                          })
                        }
                        className="aspect-square rounded-lg overflow-hidden bg-gray-800"
                      >
                        <img
                          src={getPreviewUrl(photo.photo_url)}
                          alt={`После ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                </div>
              </div>
            )}

            {(!selectedRequest.photos || selectedRequest.photos.length === 0) &&
              subRequest.photos &&
              subRequest.photos.length > 0 && (
                <div className="bg-[#1C1C1E] rounded-xl p-4">
                  <p className="text-gray-400 text-sm mb-3">Фотографии</p>
                  <div className="grid grid-cols-3 gap-2">
                    {subRequest.photos.map((photo: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() =>
                          setSelectedPhoto({
                            url: photo.photo_url,
                            created_at: photo.created_at,
                          })
                        }
                        className="aspect-square rounded-lg overflow-hidden bg-gray-800"
                      >
                        <img
                          src={getPreviewUrl(photo.photo_url)}
                          alt={`Фото ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            )}
          </div>
        </div>
      </div>

      <CommentsModal
        isOpen={!!showComments}
        onClose={() => setShowComments(null)}
        requestId={showComments}
        currentUserId={user?.id ?? null}
        isDesktop={isDesktop}
        variant={isDesktop ? "admin" : "default"}
      />

      {showIconInfo && (
        <IconInfoModal
          isOpen={!!showIconInfo}
          iconInfo={showIconInfo}
          onClose={() => setShowIconInfo(null)}
          isDesktop={embedInPanel}
        />
      )}

      <MapModal
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        mapLocation={mapLocation}
      />

      {selectedPhoto && (
        <PhotoModal
          selectedPhoto={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}

      <RatingModal
        isOpen={showRatingModal && !!requestToRate}
        onClose={() => {
          setShowRatingModal(false);
          setRequestToRate(null);
          setRatingValue(0);
          setRatingComment("");
        }}
        ratingValue={ratingValue}
        onRatingChange={setRatingValue}
        onSubmit={handleRateExecutor}
        currentRating={requestToRate ? userRatings[requestToRate.id]?.rating : undefined}
        comment={ratingComment}
        onCommentChange={setRatingComment}
        title="Оценка заявки"
        description="Поставьте оценку выполненной работе"
        variant="dark"
      />

      <ClientRatingModal
        isOpen={showClientRatingModal}
        onClose={() => {
          setShowClientRatingModal(false);
          setClientRatingValue(0);
          setClientRatingComment("");
        }}
        ratingValue={clientRatingValue}
        onRatingChange={setClientRatingValue}
        onSubmit={handleRateClient}
        currentRating={selectedRequest.clientRatings?.[0]?.rating}
        comment={clientRatingComment}
        onCommentChange={setClientRatingComment}
        title="Оценить клиента"
        description="Поставьте оценку клиенту за сотрудничество"
        variant="dark"
      />

      <AdminAcceptRequestModal
        isOpen={showAcceptGroupModal}
        request={selectedRequest}
        offices={offices}
        categories={acceptCategories}
        categoriesLoading={acceptCategoriesLoading}
        loading={isSubmitting}
        error={adminModalError}
        onClose={() => {
          setShowAcceptGroupModal(false);
          setAdminModalError(null);
          setAcceptOfficeId(null);
        }}
        onOfficeChange={setAcceptOfficeId}
        onAccept={handleAdminAcceptFromModal}
      />

      <AdminRejectRequestModal
        isOpen={showRejectGroupModal}
        loading={isSubmitting}
        error={adminModalError}
        onClose={() => {
          setShowRejectGroupModal(false);
          setAdminModalError(null);
        }}
        onReject={handleAdminRejectFromModal}
      />

      <StaffCompleteModal
        isOpen={showStaffCompleteModal}
        requestId={selectedRequest.id}
        subCount={staffCompleteCount}
        loading={isSubmitting}
        error={adminModalError}
        onClose={() => {
          setShowStaffCompleteModal(false);
          setAdminModalError(null);
        }}
        onConfirm={handleAdminCompleteRequest}
      />

      <EditRequestGroupModal
        isOpen={showEditModal}
        request={selectedRequest}
        categories={editCategories}
        loading={isSubmitting}
        error={adminModalError}
        onClose={() => {
          setShowEditModal(false);
          setAdminModalError(null);
        }}
        onSubmit={handleEditRequestGroup}
      />
    </>
  );
}
