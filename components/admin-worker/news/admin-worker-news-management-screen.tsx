"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  ThumbsUp,
  Heart,
  Flame,
  Trash2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { NewsListItem } from "@/components/news/news-list-item";
import { useToast } from "@/hooks/use-toast";
import { formatNewsScheduleDateTime } from "@/lib/dateTimeUtils";
import {
  archiveNews,
  deleteNews,
  getNewsAdminList,
  hideNews,
  unhideNews,
  type AdminNewsDisplayItem,
} from "@/lib/news-admin-api";
import { NEWS_REACTION_OPTIONS, emptyReactionCounts } from "@/lib/news-reactions";

const MONTHS = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

function formatNewsDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const STATUS_OPTIONS = [
  { value: "", label: "Все" },
  { value: "active", label: "Активные" },
  { value: "scheduled", label: "Запланированные" },
  { value: "hidden", label: "Скрытые" },
  { value: "archived", label: "Архив" },
] as const;

const REACTION_ICONS = {
  thumb: ThumbsUp,
  heart: Heart,
  eyes: Eye,
  fire: Flame,
} as const;

type StatusFilter = "" | "active" | "hidden" | "archived" | "scheduled";

type AdminWorkerNewsManagementScreenProps = {
  onRegisterRefresh?: (refetch: () => Promise<void>) => void;
};

export function AdminWorkerNewsManagementScreen({
  onRegisterRefresh,
}: AdminWorkerNewsManagementScreenProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState<AdminNewsDisplayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [actionId, setActionId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminNewsDisplayItem | null>(null);

  const loadList = useCallback(async () => {
    setLoading(true);
    const res = await getNewsAdminList(
      statusFilter || undefined,
    );
    if (res.ok) setItems(res.data);
    else setItems([]);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    onRegisterRefresh?.(loadList);
  }, [onRegisterRefresh, loadList]);

  const openCreate = () => {
    router.push("/admin-worker/management/news/editor?mode=create");
  };

  const openEdit = (item: AdminNewsDisplayItem) => {
    const params = new URLSearchParams({
      mode: "edit",
      id: item.id,
      title: item.title,
      content: item.desc,
      imageUrl: item.image || "",
      status: item.status ?? "active",
      publishedAt: item.publishedAtIso ?? "",
    });
    router.push(`/admin-worker/management/news/editor?${params.toString()}`);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const numId = parseInt(deleteTarget.id, 10);
    if (Number.isNaN(numId)) return;
    setActionId(deleteTarget.id);
    const res = await deleteNews(numId);
    setActionId(null);
    setDeleteTarget(null);
    if (res.ok) {
      toast({ title: "Удалено", description: "Новость удалена" });
      loadList();
    } else {
      toast({ title: "Ошибка", description: res.error, variant: "destructive" });
    }
  };

  const handleHide = async (id: string) => {
    const numId = parseInt(id, 10);
    if (Number.isNaN(numId)) return;
    setActionId(id);
    const res = await hideNews(numId);
    setActionId(null);
    if (res.ok) {
      toast({ title: "Скрыто", description: "Новость скрыта с главной" });
      loadList();
    } else {
      toast({ title: "Ошибка", description: res.error, variant: "destructive" });
    }
  };

  const handleArchive = async (id: string) => {
    const numId = parseInt(id, 10);
    if (Number.isNaN(numId)) return;
    setActionId(id);
    const res = await archiveNews(numId);
    setActionId(null);
    if (res.ok) {
      toast({ title: "Архивировано", description: "Новость архивирована" });
      loadList();
    } else {
      toast({ title: "Ошибка", description: res.error, variant: "destructive" });
    }
  };

  const handleUnhide = async (id: string) => {
    const numId = parseInt(id, 10);
    if (Number.isNaN(numId)) return;
    setActionId(id);
    const res = await unhideNews(numId);
    setActionId(null);
    if (res.ok) {
      toast({ title: "Восстановлено", description: "Новость снова активна" });
      loadList();
    } else {
      toast({ title: "Ошибка", description: res.error, variant: "destructive" });
    }
  };

  const sortedItems = [...items].sort((a, b) =>
    (b.publishedAtIso ?? b.date ?? "").localeCompare(a.publishedAtIso ?? a.date ?? ""),
  );

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border p-3">
        <p className="mb-2 text-sm text-muted-foreground">Статус</p>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => {
            const active = statusFilter === opt.value;
            return (
              <button
                key={opt.value || "all"}
                type="button"
                onClick={() => setStatusFilter(opt.value as StatusFilter)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  active
                    ? "bg-[#F35713] text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={openCreate}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F35713] py-2.5 font-semibold text-white"
      >
        <Plus className="h-6 w-6" />
        Добавить новость
      </button>

      {loading ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#F35713]" />
          <p className="text-sm text-muted-foreground">Загрузка...</p>
        </div>
      ) : sortedItems.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">Нет новостей. Добавьте первую.</p>
      ) : (
        <div className="space-y-3">
          {sortedItems.map((item) => {
            const status = item.status ?? "active";
            const isBusy = actionId === item.id;
            const statusLabel =
              status === "active"
                ? "Активна"
                : status === "scheduled"
                  ? "Запланирована"
                  : status === "hidden"
                    ? "Скрыта"
                    : "Архив";
            const dateLabel =
              status === "scheduled" && item.publishedAtIso
                ? formatNewsScheduleDateTime(item.publishedAtIso)
                : item.date
                  ? formatNewsDate(item.date)
                  : null;
            const rc = item.reaction_counts ?? emptyReactionCounts();

            const statusClass =
              status === "active"
                ? "bg-emerald-500/85"
                : status === "scheduled"
                  ? "bg-blue-500/85"
                  : status === "hidden"
                    ? "bg-amber-500/85"
                    : "bg-gray-500/85";

            return (
              <div key={item.id} className="space-y-2">
                <NewsListItem
                  title={item.title}
                  tag={item.tag || "Новость"}
                  dateLabel={dateLabel}
                  description={item.desc}
                  imageUrl={item.image}
                  onPress={() => openEdit(item)}
                  rightSlot={
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold text-white ${statusClass}`}
                      >
                        {statusLabel}
                      </span>
                      <div className="flex overflow-hidden rounded-full bg-gray-900/55">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(item);
                          }}
                          disabled={isBusy}
                          className="flex h-[34px] w-[34px] items-center justify-center text-white"
                          aria-label="Редактировать"
                        >
                          <Pencil className="h-[18px] w-[18px]" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(item);
                          }}
                          disabled={isBusy}
                          className="flex h-[34px] w-[34px] items-center justify-center text-white"
                          aria-label="Удалить"
                        >
                          <Trash2 className="h-[18px] w-[18px]" />
                        </button>
                        {status === "active" || status === "scheduled" ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleHide(item.id);
                            }}
                            disabled={isBusy}
                            className="flex h-[34px] w-[34px] items-center justify-center text-white"
                            aria-label="Скрыть"
                          >
                            {isBusy ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <EyeOff className="h-[18px] w-[18px]" />
                            )}
                          </button>
                        ) : null}
                        {(status === "active" || status === "hidden" || status === "scheduled") && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleArchive(item.id);
                            }}
                            disabled={isBusy}
                            className="flex h-[34px] w-[34px] items-center justify-center text-white"
                            aria-label="Архивировать"
                          >
                            <Archive className="h-[18px] w-[18px]" />
                          </button>
                        )}
                        {(status === "hidden" || status === "archived") && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnhide(item.id);
                            }}
                            disabled={isBusy}
                            className="flex h-[34px] w-[34px] items-center justify-center text-white"
                            aria-label="Восстановить"
                          >
                            <Eye className="h-[18px] w-[18px]" />
                          </button>
                        )}
                      </div>
                    </div>
                  }
                />
                <div className="rounded-xl border border-border bg-card p-2.5">
                  <p className="text-[13px] text-muted-foreground">
                    Просмотры: {item.view_count ?? 0}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-3">
                    <span className="text-[13px] text-muted-foreground">Реакции:</span>
                    {NEWS_REACTION_OPTIONS.map((o) => {
                      const Icon = REACTION_ICONS[o.kind];
                      return (
                        <span key={o.kind} className="inline-flex items-center gap-1 text-[13px] font-semibold text-muted-foreground">
                          <Icon className="h-[15px] w-[15px]" />
                          {rc[o.kind]}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog open={deleteTarget != null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить новость?</AlertDialogTitle>
            <AlertDialogDescription>
              «{deleteTarget?.title}» будет удалена безвозвратно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
