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

export type { RequestUserRole };

export interface RequestActionMenuProps {
  request: RequestGroup;
  subRequest?: SubRequest | null;
  userRole: RequestUserRole;
  userServiceCategoryId?: number;
  userId?: number;
  isExecutorLeader?: boolean;
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

/** Bottom sheet меню действий — parity с workflow-mobile RequestActionMenu. */
export function RequestActionMenu({
  request,
  subRequest,
  userRole,
  userServiceCategoryId,
  userId,
  isExecutorLeader,
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
          <p className="text-sm text-muted-foreground mt-1">
            Заявка #
            {isSub && subRequest ? `${request.id}/${subRequest.id}` : request.id}
          </p>
        </div>
        <div className="p-2 space-y-1">
          {actions.map((action, index) => {
            const Icon = ACTION_ICONS[action.icon];
            return (
              <button
                key={index}
                type="button"
                className={`w-full flex items-center gap-4 h-14 text-left rounded-xl px-4 transition-colors ${
                  action.variant === "destructive"
                    ? "text-red-400 hover:bg-red-500/20 active:bg-red-500/30"
                    : action.variant === "primary"
                      ? "text-[#F35713] font-semibold hover:bg-[#F35713]/20 active:bg-[#F35713]/30"
                      : "text-foreground hover:bg-white/[0.08] active:bg-white/[0.12]"
                }`}
                onClick={() => handleAction(action)}
              >
                <div
                  className={`p-2 rounded-lg flex-shrink-0 ${
                    action.variant === "destructive"
                      ? "bg-red-500/20"
                      : action.variant === "primary"
                        ? "bg-[#F35713]/20"
                        : "bg-surface-elevated"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className="font-medium">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        className={MOBILE_REQUESTS_ACTION_TRIGGER}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label="Действия по заявке"
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>
      {sheet && createPortal(sheet, document.body)}
    </>
  );
}
