"use client";

import type { RequestGroup, SubRequest } from "@/lib/types/request";
import {
  formatServiceCategoryDisplayName,
  getStatusLabel,
  getTypeLabel,
  isLongTermRequestGroup,
} from "@/constants/requests";
import { LongTermBadge } from "./long-term-badge";
import { RequestDetailPhotoGrid } from "./request-detail-photo-grid";

function DetailBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="text-foreground text-base leading-snug">{children}</div>
    </div>
  );
}

function collectAllPhotos(request: RequestGroup): Array<{ photo_url: string; created_at?: string }> {
  const before =
    request.photos?.filter((p) => p.type === "before").map((p) => ({
      photo_url: p.photo_url,
      created_at: p.created_at,
    })) ?? [];
  const after =
    request.photos?.filter((p) => p.type === "after").map((p) => ({
      photo_url: p.photo_url,
      created_at: p.created_at,
    })) ?? [];
  if (before.length || after.length) return [...before, ...after];
  const sub = request.requests?.[0];
  return (sub?.photos ?? []).map((p) => ({
    photo_url: p.photo_url,
    created_at: p.created_at,
  }));
}

function formatPlannedDate(date: string): string {
  return new Date(date).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatCreatedDate(date: string | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getExecutorNames(sub: SubRequest): string[] {
  if (sub.executors?.length) {
    return sub.executors.map((e) => e.user?.full_name ?? "—");
  }
  if (sub.executor?.user?.full_name) {
    return [sub.executor.user.full_name];
  }
  return [];
}

type RequestDetailMobileBodyProps = {
  request: RequestGroup;
  onPhotoClick: (photo: { url: string; created_at?: string }) => void;
};

/**
 * Контент детали заявки на mobile web — parity с workflow-mobile app/(tabs)/requests/[id].tsx
 * (без inline-форм принятия/отклонения — только меню действий).
 */
export function RequestDetailMobileBody({
  request,
  onPhotoClick,
}: RequestDetailMobileBodyProps) {
  const subRequests = request.requests ?? [];
  const allPhotos = collectAllPhotos(request);
  const isLongTerm = isLongTermRequestGroup(request);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-lg bg-[#F35713] px-2.5 py-1 text-xs font-semibold text-white">
          {getStatusLabel(request.status)}
        </span>
        <span className="inline-flex items-center rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
          {getTypeLabel(request.request_type ?? "normal")}
        </span>
        {isLongTerm ? <LongTermBadge detail /> : null}
      </div>

      {request.request_type === "planned" && request.planned_date ? (
        <DetailBlock label="Запланировано на">
          {formatPlannedDate(request.planned_date)}
        </DetailBlock>
      ) : null}

      {subRequests.map((sr) => (
        <div key={sr.id} className="space-y-4">
          {(sr.title || sr.category?.name) && (
            <DetailBlock label={`Заявка #${sr.id}`}>
              <p className="font-medium">
                {sr.title || formatServiceCategoryDisplayName(sr.category?.name)}
              </p>
              {sr.category?.name && sr.title ? (
                <p className="text-sm text-muted-foreground mt-1">
                  {formatServiceCategoryDisplayName(sr.category.name)}
                </p>
              ) : null}
            </DetailBlock>
          )}

          {sr.description ? (
            <DetailBlock label="Описание">
              <p className="whitespace-pre-wrap break-words">{sr.description}</p>
            </DetailBlock>
          ) : null}

          {(sr.complexity || sr.sla) && (
            <DetailBlock label="Доп. информация">
              <p>
                {[sr.complexity && `Сложность: ${sr.complexity}`, sr.sla && `Срок: ${sr.sla}`]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </DetailBlock>
          )}

          {getExecutorNames(sr).length > 0 && (
            <DetailBlock label="Исполнители">
              <div className="space-y-0.5">
                {getExecutorNames(sr).map((name, i) => (
                  <p key={i}>{name}</p>
                ))}
              </div>
            </DetailBlock>
          )}

          {sr.status === "completed" && sr.comment ? (
            <DetailBlock label="Комментарий по выполнению">
              <p className="whitespace-pre-wrap break-words">{sr.comment}</p>
            </DetailBlock>
          ) : null}
        </div>
      ))}

      {request.location_detail ? (
        <DetailBlock label="Локация в офисе">{request.location_detail}</DetailBlock>
      ) : null}

      <DetailBlock label="Офис">{request.office?.name || "—"}</DetailBlock>

      <DetailBlock label="Дата создания">
        {formatCreatedDate(request.created_date)}
      </DetailBlock>

      {allPhotos.length > 0 && (
        <RequestDetailPhotoGrid photos={allPhotos} onPhotoClick={onPhotoClick} />
      )}
    </div>
  );
}
