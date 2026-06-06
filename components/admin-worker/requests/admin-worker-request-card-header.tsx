"use client";

import { useCallback } from "react";
import type { RequestGroup } from "@/stores/useRequestStore";
import { getTypeLabel } from "@/constants/requests";

export function AdminWorkerRequestCardHeader({ requestGroup }: { requestGroup: RequestGroup }) {
  return (
    <div className="pb-3 px-5 pt-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base leading-tight line-clamp-2 text-gray-900">
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
      </div>
    </div>
  );
}

export function useAdminWorkerRequestCardHeader() {
  return useCallback(
    (requestGroup: RequestGroup) => (
      <AdminWorkerRequestCardHeader requestGroup={requestGroup} />
    ),
    []
  );
}
