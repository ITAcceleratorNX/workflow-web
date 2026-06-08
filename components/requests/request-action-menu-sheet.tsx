"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  CheckCircle,
  ClipboardCheck,
  Clock,
  ListChecks,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Play,
  Share2,
  Star,
  Trash2,
  UserPlus,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getRequestActions,
  type ActionItem,
  type RequestActionIcon,
  type RequestUserRole,
} from "@/lib/request-action-config";
import type { RequestGroup, SubRequest } from "@/lib/types/request";
import {
  MOBILE_REQUESTS_ACTION_SHEET,
  MOBILE_REQUESTS_ACTION_TRIGGER,
} from "@/constants/mobile-requests-ui";
import { MANAGEMENT_MODAL_DARK_CLASS } from "@/constants/management-modal-ui";
import { shareRequestWithContent } from "@/lib/shareRequest";
import { cn } from "@/lib/utils";

const ACTION_ICONS: Record<RequestActionIcon, LucideIcon> = {
  share: Share2,
  "chat-bubble-outline": MessageCircle,
  star: Star,
  delete: Trash2,
  "play-arrow": Play,
  "check-circle": CheckCircle,
  cancel: XCircle,
  "arrow-forward": ArrowRight,
  "person-add": UserPlus,
  "done-all": ListChecks,
  "playlist-add-check": ClipboardCheck,
  edit: Pencil,
  schedule: Clock,
};

export type RequestActionMenuVariant = "sheet" | "dialog";

export type { RequestUserRole };

export interface RequestActionMenuProps {
  request: RequestGroup;
  subRequest?: SubRequest | null;
  userRole: RequestUserRole;
  userServiceCategoryId?: number;
  userId?: number;
  isExecutorLeader?: boolean;
  variant?: RequestActionMenuVariant;
  triggerClassName?: string;
  onStartTask?: (id: number) => void;
  onCompleteTask?: (subReq: SubRequest) => void;
  onReject?: (subReq: SubRequest) => void;
  onDelete?: (subReq: SubRequest) => void;
  onAssignExecutor?: (subReq: SubRequest) => void;
  onChangeExecutors?: (subReq: SubRequest) => void;
  onRedirect?: (subReq: SubRequest) => void;
  onRateRequest?: (subReq: SubRequest) => void;
  onRateClient?: () => void;
  onToggleLongTerm?: (
    requestId: number,
    requestGroupId: number,
    currentStatus: boolean,
  ) => void;
  onAdminCompleteGroup?: () => void;
  onAdminAcceptGroup?: () => void;
  onAdminRejectGroup?: () => void;
  onEditRequestGroup?: () => void;
  onOpenComments?: () => void;
}

function actionButtonClass(action: ActionItem, isDialog: boolean) {
  const base = isDialog
    ? "w-full flex items-center gap-4 min-h-[52px] text-left rounded-xl px-4 transition-colors"
    : "w-full flex items-center gap-4 h-14 text-left rounded-xl px-4 transition-colors";

  if (action.variant === "destructive") {
    return cn(
      base,
      "text-red-400 hover:bg-red-500/20 active:bg-red-500/30",
    );
  }
  if (action.variant === "primary") {
    return cn(
      base,
      "text-[#F35713] font-semibold hover:bg-[#F35713]/20 active:bg-[#F35713]/30",
    );
  }
  return cn(
    base,
    isDialog
      ? "text-white hover:bg-[#2C2C2E] active:bg-[#3A3A3C]"
      : "text-foreground hover:bg-white/[0.08] active:bg-white/[0.12]",
  );
}

function actionIconWrapClass(action: ActionItem) {
  if (action.variant === "destructive") return "p-2 rounded-lg flex-shrink-0 bg-red-500/20";
  if (action.variant === "primary") return "p-2 rounded-lg flex-shrink-0 bg-[#F35713]/20";
  return "p-2 rounded-lg flex-shrink-0 bg-[#2C2C2E]";
}

function RequestActionList({
  actions,
  isDialog,
  onAction,
}: {
  actions: ActionItem[];
  isDialog: boolean;
  onAction: (action: ActionItem) => void;
}) {
  return (
    <div className={isDialog ? "p-2 space-y-1" : "p-2 space-y-1"}>
      {actions.map((action, index) => {
        const Icon = ACTION_ICONS[action.icon];
        return (
          <button
            key={index}
            type="button"
            className={actionButtonClass(action, isDialog)}
            onClick={() => onAction(action)}
          >
            <div className={actionIconWrapClass(action)}>
              <Icon className="h-5 w-5" />
            </div>
            <span className="font-medium">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Меню действий по заявке — parity с workflow-mobile RequestActionMenu. */
export function RequestActionMenu({
  request,
  subRequest,
  userRole,
  userServiceCategoryId,
  userId,
  isExecutorLeader,
  variant = "sheet",
  triggerClassName,
  onStartTask,
  onCompleteTask,
  onReject,
  onDelete,
  onAssignExecutor,
  onChangeExecutors,
  onRedirect,
  onRateRequest,
  onRateClient,
  onToggleLongTerm,
  onAdminCompleteGroup,
  onAdminAcceptGroup,
  onAdminRejectGroup,
  onEditRequestGroup,
  onOpenComments,
}: RequestActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const isDialog = variant === "dialog";

  useEffect(() => {
    setMounted(true);
  }, []);

  const isSub = !!subRequest;

  const handleShare = () => {
    void shareRequestWithContent(request, subRequest)
      .then(() => setOpen(false))
      .catch(() => setOpen(false));
  };

  const actions = getRequestActions({
    request,
    subRequest,
    userRole,
    userServiceCategoryId,
    userId,
    isExecutorLeader,
    onShare: handleShare,
    onStartTask,
    onCompleteTask,
    onReject,
    onDelete,
    onAssignExecutor,
    onChangeExecutors,
    onRedirect,
    onRateRequest,
    onRateClient,
    onToggleLongTerm,
    onAdminCompleteGroup,
    onAdminAcceptGroup,
    onAdminRejectGroup,
    onEditRequestGroup,
    onOpenComments,
  });

  if (actions.length === 0) return null;

  const handleAction = (action: ActionItem) => {
    const isShare = action.label === "Поделиться ссылкой";
    if (!isShare) setOpen(false);
    action.onClick();
  };

  const subtitle = `Заявка #${isSub && subRequest ? `${request.id}/${subRequest.id}` : request.id}`;

  const trigger = (
    <button
      type="button"
      className={cn(
        isDialog
          ? "h-9 w-9 rounded-full bg-[#2C2C2E] border border-[#3A3A3C] text-white hover:bg-[#3A3A3C] flex items-center justify-center transition-colors"
          : MOBILE_REQUESTS_ACTION_TRIGGER,
        triggerClassName,
      )}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOpen((v) => !v);
      }}
      aria-label="Действия по заявке"
    >
      <MoreHorizontal className={isDialog ? "h-4 w-4" : "h-5 w-5"} />
    </button>
  );

  if (isDialog) {
    return (
      <>
        {trigger}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent
            className="max-w-md border-[#3A3A3C] bg-[#1C1C1E] text-white sm:rounded-2xl p-0 gap-0 max-h-[min(85vh,640px)] overflow-hidden flex flex-col [&>button]:text-[#8E8E93] [&>button]:hover:text-white [&>button]:right-5 [&>button]:top-5"
            onClick={(e) => e.stopPropagation()}
          >
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#3A3A3C] shrink-0 text-left space-y-1">
              <DialogTitle className="text-lg font-bold text-white">Действия</DialogTitle>
              <p className="text-sm text-[#8E8E93] font-normal">{subtitle}</p>
            </DialogHeader>
            <div
              className={cn(
                "overflow-y-auto min-h-0 flex-1 py-1",
                MANAGEMENT_MODAL_DARK_CLASS,
              )}
            >
              <RequestActionList actions={actions} isDialog onAction={handleAction} />
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  const sheet = open && mounted ? (
    <div
      className="fixed inset-0 z-[99999] flex items-end"
      onClick={() => setOpen(false)}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        ref={sheetRef}
        className={cn(
          "relative w-full rounded-t-3xl shadow-2xl max-h-[80vh] overflow-y-auto",
          MOBILE_REQUESTS_ACTION_SHEET,
        )}
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 16px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={cn("flex justify-center pt-4 pb-2 sticky top-0", MOBILE_REQUESTS_ACTION_SHEET)}>
          <div className="w-12 h-1 rounded-full bg-border" />
        </div>
        <div className="px-4 pb-2 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Действия</h3>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <RequestActionList actions={actions} isDialog={false} onAction={handleAction} />
      </div>
    </div>
  ) : null;

  return (
    <>
      {trigger}
      {sheet && createPortal(sheet, document.body)}
    </>
  );
}
