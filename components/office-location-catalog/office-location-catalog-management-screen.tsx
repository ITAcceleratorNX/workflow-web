"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Building2,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  MapPin,
  Plus,
  Search,
  SearchX,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import {
  OfficeLocationCatalogFormDialog,
  type OfficeLocationCatalogFormValues,
} from "@/components/office-location-catalog/office-location-catalog-form-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogFooter,
  AlertDialogHeader,
} from "@/components/ui/alert-dialog";
import {
  ManagementAlertDialogCancel,
  ManagementAlertDialogContent,
  ManagementAlertDialogDescription,
  ManagementAlertDialogTitle,
} from "@/components/layout/management-alert-dialog";
import { ManagementModalShell } from "@/components/layout/management-modal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useIsDesktop } from "@/hooks/use-media-query";
import {
  createOfficeLocationCatalogRow,
  deleteOfficeLocationCatalogRow,
  getOfficeLocationCatalog,
  updateOfficeLocationCatalogRow,
} from "@/lib/office-location-catalog-api";
import {
  buildLocationCatalogSections,
  countLocationCatalogStats,
  getBlockFilterOptions,
  getFloorFilterOptions,
  type LocationCatalogSort,
  type LocationVisibilityFilter,
  type OfficeLocationCatalogRow,
} from "@/lib/office-location-catalog-utils";
import { fetchOffices } from "@/lib/service-categories-api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";

export type OfficeLocationCatalogVariant = "department-head" | "admin-worker";

const VISIBILITY_FILTERS: { value: LocationVisibilityFilter; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "active", label: "Активные" },
  { value: "hidden", label: "Скрытые" },
];

const SORT_OPTIONS: { value: LocationCatalogSort; label: string }[] = [
  { value: "order", label: "По порядку" },
  { value: "room", label: "По помещению" },
  { value: "block", label: "По блоку" },
];

const COUNT_BADGE_CLASS =
  "flex h-7 min-w-7 items-center justify-center rounded-full bg-[rgba(243,87,19,0.2)] px-2 text-xs font-bold text-[#F35713]";

function normalizeSearch(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function LocationCatalogFilterButton({
  filterPanelCount,
  onClick,
}: {
  filterPanelCount: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex h-11 w-11 items-center justify-center rounded-lg active:opacity-70"
      aria-label="Фильтры"
    >
      <SlidersHorizontal className="h-6 w-6 text-[#F35713]" />
      {filterPanelCount > 0 ? (
        <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#F35713] px-1 text-[11px] font-bold text-white">
          {filterPanelCount}
        </span>
      ) : null}
    </button>
  );
}

function FilterPill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors",
        active
          ? "border-[#F35713] bg-[rgba(243,87,19,0.13)] text-[#F35713]"
          : "border-border text-foreground",
      )}
    >
      {label}
    </button>
  );
}

type OfficeLocationCatalogManagementScreenProps = {
  variant: OfficeLocationCatalogVariant;
  onRegisterRefresh?: (refetch: () => Promise<void>) => void;
  /** Кнопка фильтра в ScreenHeader (как RN rightSlot). */
  onRegisterHeaderSlot?: (slot: React.ReactNode | null) => void;
};

/** Шаблоны локаций — parity с workflow-mobile OfficeLocationCatalogManagementScreen. */
export function OfficeLocationCatalogManagementScreen({
  variant,
  onRegisterRefresh,
  onRegisterHeaderSlot,
}: OfficeLocationCatalogManagementScreenProps) {
  const router = useRouter();
  const { toast } = useToast();
  const role = useAuthStore((s) => s.role);
  const userOfficeId = useAuthStore((s) => s.user?.office_id);

  const isAdmin = variant === "admin-worker";
  const isDesktop = useIsDesktop();

  const [offices, setOffices] = useState<{ id: number; name: string }[]>([]);
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>(
    isAdmin ? "" : String(userOfficeId ?? ""),
  );

  useEffect(() => {
    if (!isAdmin) return;
    void fetchOffices().then((result) => {
      if (result.ok) setOffices(result.data);
    });
  }, [isAdmin]);

  const manageOfficeId = isAdmin
    ? selectedOfficeId
      ? Number(selectedOfficeId)
      : null
    : userOfficeId != null && userOfficeId > 0
      ? userOfficeId
      : null;

  const [rows, setRows] = useState<OfficeLocationCatalogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<LocationVisibilityFilter>("all");
  const [blockFilterKey, setBlockFilterKey] = useState<string | null>(null);
  const [floorFilterKey, setFloorFilterKey] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<LocationCatalogSort>("order");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formDefaults, setFormDefaults] = useState({
    block: "",
    floor_zone: "",
    room: "",
    sort_order: 0,
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [draftVisibility, setDraftVisibility] = useState<LocationVisibilityFilter>("all");
  const [draftBlockKey, setDraftBlockKey] = useState<string | null>(null);
  const [draftFloorKey, setDraftFloorKey] = useState<string | null>(null);
  const [draftSortBy, setDraftSortBy] = useState<LocationCatalogSort>("order");

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const autoOpenedCreateRef = useRef(false);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const allowed =
    (variant === "department-head" && role === "department-head") ||
    (variant === "admin-worker" && role === "admin-worker");

  useEffect(() => {
    if (!allowed) router.back();
  }, [allowed, router]);

  const stats = useMemo(() => countLocationCatalogStats(rows), [rows]);
  const blockOptions = useMemo(() => getBlockFilterOptions(rows), [rows]);
  const draftFloorOptions = useMemo(
    () => getFloorFilterOptions(rows, draftBlockKey),
    [rows, draftBlockKey],
  );

  const filterPanelCount = useMemo(() => {
    let count = 0;
    if (visibilityFilter !== "all") count += 1;
    if (blockFilterKey != null) count += 1;
    if (floorFilterKey != null) count += 1;
    if (sortBy !== "order") count += 1;
    return count;
  }, [visibilityFilter, blockFilterKey, floorFilterKey, sortBy]);

  const sections = useMemo(
    () =>
      buildLocationCatalogSections(rows, {
        searchQuery,
        visibility: visibilityFilter,
        blockKey: blockFilterKey,
        floorKey: blockFilterKey != null ? floorFilterKey : null,
        sortBy,
      }),
    [rows, searchQuery, visibilityFilter, blockFilterKey, floorFilterKey, sortBy],
  );

  const filteredCount = useMemo(
    () => sections.reduce((sum, s) => sum + s.data.length, 0),
    [sections],
  );

  const hasActiveFilters =
    normalizeSearch(searchQuery).length > 0 || filterPanelCount > 0;

  const load = useCallback(async () => {
    if (manageOfficeId == null) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await getOfficeLocationCatalog(manageOfficeId, { includeInactive: true });
    if (res.ok) setRows(res.data);
    else {
      setRows([]);
      toast({ title: res.error, variant: "destructive" });
    }
    setLoading(false);
  }, [manageOfficeId, toast]);

  useEffect(() => {
    if (!allowed) return;
    void load();
  }, [allowed, load]);

  useEffect(() => {
    onRegisterRefresh?.(load);
  }, [onRegisterRefresh, load]);

  useEffect(() => {
    if (isAdmin) return;
    if (loading || manageOfficeId == null || rows.length > 0 || autoOpenedCreateRef.current) return;
    autoOpenedCreateRef.current = true;
    setEditingId(null);
    setModalMode("create");
    setSaveError(null);
    setFormDefaults({ block: "", floor_zone: "", room: "", sort_order: 0 });
    setModalOpen(true);
  }, [loading, manageOfficeId, rows.length, isAdmin]);

  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setVisibilityFilter("all");
    setBlockFilterKey(null);
    setFloorFilterKey(null);
    setSortBy("order");
  }, []);

  const openFilterSheet = useCallback(() => {
    setDraftVisibility(visibilityFilter);
    setDraftBlockKey(blockFilterKey);
    setDraftFloorKey(floorFilterKey);
    setDraftSortBy(sortBy);
    setFilterSheetOpen(true);
  }, [visibilityFilter, blockFilterKey, floorFilterKey, sortBy]);

  useEffect(() => {
    if (!onRegisterHeaderSlot) return;
    onRegisterHeaderSlot(
      <LocationCatalogFilterButton
        filterPanelCount={filterPanelCount}
        onClick={openFilterSheet}
      />,
    );
    return () => onRegisterHeaderSlot(null);
  }, [onRegisterHeaderSlot, filterPanelCount, openFilterSheet]);

  const applyFilterSheet = () => {
    setVisibilityFilter(draftVisibility);
    setBlockFilterKey(draftBlockKey);
    setFloorFilterKey(draftFloorKey);
    setSortBy(draftSortBy);
    setFilterSheetOpen(false);
  };

  const openAdd = useCallback(() => {
    setEditingId(null);
    setModalMode("create");
    setSaveError(null);
    setFormDefaults({
      block: "",
      floor_zone: "",
      room: "",
      sort_order: rows.length > 0 ? Math.max(...rows.map((r) => r.sort_order ?? 0)) + 1 : 0,
    });
    setModalOpen(true);
  }, [rows]);

  const openEdit = (item: OfficeLocationCatalogRow) => {
    setEditingId(item.id);
    setModalMode("edit");
    setSaveError(null);
    setFormDefaults({
      block: item.block,
      floor_zone: item.floor_zone,
      room: item.room,
      sort_order: item.sort_order ?? 0,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setSaveError(null);
  };

  const handleModalSubmit = async (values: OfficeLocationCatalogFormValues) => {
    if (manageOfficeId == null) return;
    setSaving(true);
    setSaveError(null);
    try {
      if (editingId == null) {
        const res = await createOfficeLocationCatalogRow(manageOfficeId, {
          ...values,
          is_active: true,
        });
        if (!res.ok) {
          setSaveError(res.error);
          return;
        }
        toast({ title: "Шаблон добавлен" });
      } else {
        const res = await updateOfficeLocationCatalogRow(manageOfficeId, editingId, values);
        if (!res.ok) {
          setSaveError(res.error);
          return;
        }
        toast({ title: "Сохранено" });
      }
      closeModal();
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteId == null || manageOfficeId == null) return;
    setIsDeleting(true);
    const res = await deleteOfficeLocationCatalogRow(manageOfficeId, deleteId);
    setIsDeleting(false);
    if (!res.ok) {
      toast({ title: res.error, variant: "destructive" });
      return;
    }
    toast({ title: "Удалено" });
    setDeleteId(null);
    await load();
  };

  const toggleActive = async (item: OfficeLocationCatalogRow) => {
    if (manageOfficeId == null) return;
    const res = await updateOfficeLocationCatalogRow(manageOfficeId, item.id, {
      is_active: !item.is_active,
    });
    if (!res.ok) {
      toast({ title: res.error, variant: "destructive" });
      return;
    }
    await load();
  };

  if (!allowed) return null;

  const needsPickOffice = isAdmin && manageOfficeId == null;
  const noOfficeAccount = !isAdmin && manageOfficeId == null;

  const resetDraftFilters = () => {
    setDraftVisibility("all");
    setDraftBlockKey(null);
    setDraftFloorKey(null);
    setDraftSortBy("order");
  };

  const fabButton =
    !needsPickOffice && !noOfficeAccount && !loading && portalReady ? (
      <button
        type="button"
        onClick={openAdd}
        className="fixed bottom-[calc(72px+env(safe-area-inset-bottom,0px))] right-5 z-[190] flex h-14 w-14 items-center justify-center rounded-full bg-[#F35713] text-white shadow-lg active:scale-95"
        aria-label="Добавить шаблон"
      >
        <Plus className="h-7 w-7" />
      </button>
    ) : null;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col pb-24">
      {isAdmin ? (
        <div className="mb-3">
          <Select
            value={selectedOfficeId || undefined}
            onValueChange={setSelectedOfficeId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите офис" />
            </SelectTrigger>
            <SelectContent>
              {offices.map((o) => (
                <SelectItem key={o.id} value={String(o.id)}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {needsPickOffice ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground" />
          <p className="text-base font-semibold text-foreground">Выберите офис</p>
          <p className="text-sm text-muted-foreground">
            Шаблоны локаций настраиваются отдельно для каждого офиса
          </p>
        </div>
      ) : noOfficeAccount ? (
        <div className="flex flex-1 items-center justify-center px-6 py-12 text-center text-sm text-muted-foreground">
          У вашей учётной записи не указан офис. Обратитесь к администратору.
        </div>
      ) : loading ? (
        <div className="flex flex-1 items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#F35713]" />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">
            {stats.total} {stats.total === 1 ? "шаблон" : stats.total < 5 ? "шаблона" : "шаблонов"}
            {" · "}
            {stats.blocks} {stats.blocks === 1 ? "блок" : stats.blocks < 5 ? "блока" : "блоков"}
            {" · "}
            {stats.active} активн.
            {stats.hidden > 0 ? ` · ${stats.hidden} скрыт.` : ""}
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3">
            <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
            <Input
              className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              placeholder="Поиск по блоку, этажу, помещению…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery ? (
              <button type="button" onClick={() => setSearchQuery("")} aria-label="Очистить">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            ) : null}
          </div>

          {hasActiveFilters ? (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Найдено: {filteredCount}
                {filterPanelCount > 0 ? ` · фильтров: ${filterPanelCount}` : ""}
              </span>
              <button
                type="button"
                onClick={resetFilters}
                className="font-semibold text-[#F35713]"
              >
                Сбросить
              </button>
            </div>
          ) : null}

          {sections.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              {rows.length === 0 ? (
                <button
                  type="button"
                  onClick={openAdd}
                  className="w-full rounded-2xl border border-border bg-card p-6 active:opacity-90"
                >
                  <MapPin className="mx-auto h-8 w-8 text-[#F35713]" />
                  <p className="mt-3 text-base font-bold text-foreground">Добавить первый шаблон</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Укажите блок, этаж и помещение — клиенты выберут их при создании заявки
                  </p>
                </button>
              ) : (
                <>
                  <SearchX className="h-10 w-10 text-muted-foreground" />
                  <p className="font-semibold text-foreground">Ничего не найдено</p>
                  <p className="text-sm text-muted-foreground">Измените поиск или фильтр</p>
                  <Button variant="outline" onClick={resetFilters}>
                    Сбросить фильтры
                  </Button>
                </>
              )}
            </div>
          ) : (
            sections.map((section) => (
              <div key={section.blockKey || "__empty__"}>
                <div className="sticky top-0 z-10 flex items-center justify-between bg-background py-2">
                  <p className="text-sm font-bold text-foreground">{section.blockLabel}</p>
                  <span className={COUNT_BADGE_CLASS}>{section.data.length}</span>
                </div>
                <div className="space-y-2">
                  {section.data.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border border-border bg-card",
                        !item.is_active && "opacity-75",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="flex min-w-0 flex-1 items-center gap-3 p-3 text-left active:opacity-80"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[rgba(243,87,19,0.2)]">
                          <MapPin className="h-5 w-5 text-[#F35713]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {item.room?.trim() || item.floor_zone?.trim() || "Помещение не указано"}
                            </p>
                            {!item.is_active ? (
                              <span className="shrink-0 rounded border border-border px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                                Скрыт
                              </span>
                            ) : null}
                          </div>
                          {item.floor_zone?.trim() ? (
                            <p className="truncate text-sm text-muted-foreground">
                              {item.floor_zone.trim()}
                            </p>
                          ) : null}
                          <p className="text-xs text-muted-foreground">
                            Порядок: {item.sort_order ?? 0}
                          </p>
                        </div>
                      </button>
                      <div className="flex shrink-0 items-center gap-0.5 pr-2">
                        <button
                          type="button"
                          onClick={() => void toggleActive(item)}
                          className="p-2 active:opacity-70"
                          aria-label={item.is_active ? "Скрыть шаблон" : "Показать шаблон"}
                        >
                          {item.is_active ? (
                            <EyeOff className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <Eye className="h-5 w-5 text-muted-foreground" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(item.id)}
                          className="p-2 active:opacity-70"
                          aria-label="Удалить шаблон"
                        >
                          <Trash2 className="h-5 w-5 text-destructive" />
                        </button>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <OfficeLocationCatalogFormDialog
        open={modalOpen}
        mode={modalMode}
        loading={saving}
        error={saveError}
        defaultBlock={formDefaults.block}
        defaultFloorZone={formDefaults.floor_zone}
        defaultRoom={formDefaults.room}
        defaultSortOrder={formDefaults.sort_order}
        onClose={closeModal}
        onSubmit={handleModalSubmit}
      />

      <ManagementModalShell
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        title="Фильтры"
        maxWidthClass="max-w-md"
        sheetMaxHeightClass="max-h-[min(85vh,720px)]"
        bodyClassName="overflow-y-auto"
      >
        {!isDesktop ? (
          <div className="sticky top-0 z-10 -mx-4 mb-4 flex items-center justify-between border-b border-border bg-card px-4 pb-3">
            <button
              type="button"
              onClick={() => setFilterSheetOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
            <p className="text-base font-bold text-foreground">Фильтры</p>
            <button
              type="button"
              onClick={applyFilterSheet}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F35713] text-white"
            >
              <span className="sr-only">Применить</span>✓
            </button>
          </div>
        ) : null}

        <p className="mb-2 mt-3 text-xs font-semibold uppercase text-muted-foreground">Статус</p>
        <div className="flex flex-wrap gap-2">
          {VISIBILITY_FILTERS.map((opt) => {
            const count =
              opt.value === "all"
                ? stats.total
                : opt.value === "active"
                  ? stats.active
                  : stats.hidden;
            return (
              <FilterPill
                key={opt.value}
                active={draftVisibility === opt.value}
                label={`${opt.label} (${count})`}
                onClick={() => setDraftVisibility(opt.value)}
              />
            );
          })}
        </div>

        {blockOptions.length > 0 ? (
          <>
            <p className="mb-2 mt-4 text-xs font-semibold uppercase text-muted-foreground">
              Блок
            </p>
            <div className="flex flex-wrap gap-2">
              <FilterPill
                active={draftBlockKey === null}
                label="Все"
                onClick={() => {
                  setDraftBlockKey(null);
                  setDraftFloorKey(null);
                }}
              />
              {blockOptions.map((opt) => (
                <FilterPill
                  key={opt.key || "__empty__"}
                  active={draftBlockKey === opt.key}
                  label={`${opt.label} (${opt.count})`}
                  onClick={() => {
                    setDraftBlockKey(opt.key);
                    setDraftFloorKey(null);
                  }}
                />
              ))}
            </div>
          </>
        ) : null}

        {draftBlockKey != null && draftFloorOptions.length > 0 ? (
          <>
            <p className="mb-2 mt-4 text-xs font-semibold uppercase text-muted-foreground">
              Этаж / зона
            </p>
            <div className="flex flex-wrap gap-2">
              <FilterPill
                active={draftFloorKey === null}
                label="Все"
                onClick={() => setDraftFloorKey(null)}
              />
              {draftFloorOptions.map((opt) => (
                <FilterPill
                  key={opt.key || "__empty_floor__"}
                  active={draftFloorKey === opt.key}
                  label={`${opt.label} (${opt.count})`}
                  onClick={() => setDraftFloorKey(opt.key)}
                />
              ))}
            </div>
          </>
        ) : null}

        <p className="mb-2 mt-4 text-xs font-semibold uppercase text-muted-foreground">
          Сортировка
        </p>
        <div className="flex flex-wrap gap-2">
          {SORT_OPTIONS.map((opt) => (
            <FilterPill
              key={opt.value}
              active={draftSortBy === opt.value}
              label={opt.label}
              onClick={() => setDraftSortBy(opt.value)}
            />
          ))}
        </div>

        {isDesktop ? (
          <div className="mt-6 flex gap-3 border-t border-[#3A3A3C] pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={resetDraftFilters}>
              Сбросить
            </Button>
            <Button type="button" className="flex-1" onClick={applyFilterSheet}>
              Применить
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={resetDraftFilters}
            className="mt-6 w-full py-3 text-center text-sm font-semibold text-[#F35713]"
          >
            Сбросить фильтры
          </button>
        )}
      </ManagementModalShell>

      {portalReady && fabButton ? createPortal(fabButton, document.body) : null}

      <AlertDialog
        open={deleteId != null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleteId(null);
        }}
      >
        <ManagementAlertDialogContent>
          <AlertDialogHeader>
            <ManagementAlertDialogTitle>Удалить шаблон?</ManagementAlertDialogTitle>
            <ManagementAlertDialogDescription>
              Действие нельзя отменить.
            </ManagementAlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <ManagementAlertDialogCancel disabled={isDeleting}>Отмена</ManagementAlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                void handleConfirmDelete();
              }}
            >
              {isDeleting ? "Удаление..." : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </ManagementAlertDialogContent>
      </AlertDialog>
    </div>
  );
}
