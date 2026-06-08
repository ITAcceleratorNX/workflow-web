"use client";

import { useCallback } from "react";
import { CardHeader } from "@/components/ui/card";
import { CheckCircle, Clock, User, XCircle } from "lucide-react";
import type { RequestGroup, SubRequest } from "@/stores/useRequestStore";
import { RequestActionMenu } from "@/components/requests";
import { getTypeLabel } from "@/constants/requests";
import { useAuthStore } from "@/stores/useAuthStore";

const getStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case "completed":
      return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    case "in_progress":
    case "execution":
      return <Clock className="w-4 h-4 text-[#114A65]" />;
    case "awaiting_assignment":
    case "awaiting_sla":
      return <Clock className="w-3 h-3" />;
    case "assigned":
      return <User className="w-3 h-3" />;
    case "rejected":
      return <XCircle className="w-3 h-3" />;
    default:
      return null;
  }
};

interface ClientRequestCardHeaderProps {
  requestGroup: RequestGroup;
  isDesktop: boolean;
  onViewDetails: (request: RequestGroup) => void;
  onRateRequest: (subRequest: SubRequest) => void;
  onDelete: (subRequest: SubRequest) => void;
}

export function ClientRequestCardHeader({
  requestGroup,
  isDesktop,
  onViewDetails,
  onRateRequest,
  onDelete,
}: ClientRequestCardHeaderProps) {
  const userId = useAuthStore((s) => s.user?.id);
  const primarySub =
    requestGroup.requests?.length === 1 ? requestGroup.requests[0] : null;

  return (
    <CardHeader className="pb-3 px-5 pt-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base leading-tight line-clamp-2 text-card-foreground">
            Заявка #{requestGroup.id}
          </h3>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              requestGroup.request_type === "urgent"
                ? "text-white bg-[#B8400E]"
                : requestGroup.request_type === "planned"
                  ? "text-white bg-[#114A65]"
                  : "text-white bg-[#114A65]"
            }`}
          >
            {getTypeLabel(requestGroup.request_type ?? "normal")}
          </span>
        </div>
        <div className="flex gap-1 items-center">
          {getStatusIcon(requestGroup.status)}
          <RequestActionMenu
            request={requestGroup}
            subRequest={primarySub}
            userRole="client"
            userId={userId}
            variant={isDesktop ? "dialog" : "sheet"}
            onRateRequest={onRateRequest}
            onDelete={onDelete}
            onOpenComments={() => onViewDetails(requestGroup)}
          />
        </div>
      </div>
    </CardHeader>
  );
}

export function useClientRequestCardHeader({
  isDesktop,
  onViewDetails,
  onRateRequest,
  onDelete,
}: Omit<ClientRequestCardHeaderProps, "requestGroup">) {
  return useCallback(
    (requestGroup: RequestGroup) => (
      <ClientRequestCardHeader
        requestGroup={requestGroup}
        isDesktop={isDesktop}
        onViewDetails={onViewDetails}
        onRateRequest={onRateRequest}
        onDelete={onDelete}
      />
    ),
    [isDesktop, onViewDetails, onRateRequest, onDelete],
  );
}
