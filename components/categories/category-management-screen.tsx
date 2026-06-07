"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  FolderOpen,
  Hand,
  List,
  Loader2,
} from "lucide-react";
import { EditableCatalogRow } from "@/components/categories/editable-catalog-row";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  createServiceCategory,
  createSubcategory,
  deleteServiceCategory,
  deleteSubcategory,
  fetchOffices,
  getServiceCategories,
  type ServiceCategory,
  updateServiceCategory,
  updateSubcategory,
} from "@/lib/service-categories-api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";

export type CategoryManagementVariant = "department-head" | "admin-worker";

type TabType = "categories" | "subcategories";
type EditingKey = `category-${number}` | `subcategory-${number}`;

type DeleteTarget =
  | { type: "category"; item: ServiceCategory }
  | { type: "subcategory"; id: number; name: string };

function subcategoryCountLabel(count: number): string {
  if (count === 1) return "1 подкатегория";
  if (count > 1 && count < 5) return `${count} подкатегории`;
  return `${count} подкатегорий`;
}

function useCategories(officeId: number | null) {
  const [list, setList] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (officeId == null) {
      setList([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const result = await getServiceCategories(officeId);
    if (result.ok) setList(result.data);
    else setError(result.error);
    setLoading(false);
  }, [officeId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { categories: list, loading, error, refetch };
}

type CategoryManagementScreenProps = {
  variant: CategoryManagementVariant;
  onRegisterRefresh?: (refetch: () => Promise<void>) => void;
};

/** Явные цвета: в .admin-management-content [class*="bg-primary"] ломает bg-primary/10 */
const CATALOG_COUNT_BADGE_CLASS =
  "rounded-full bg-[rgba(243,87,19,0.2)] px-2.5 py-1 text-xs font-semibold text-[#F35713]";

/** Управление категориями и подкатегориями — parity с workflow-mobile CategoryManagementScreen. */
export function CategoryManagementScreen({
  variant,
  onRegisterRefresh,
}: CategoryManagementScreenProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const role = useAuthStore((s) => s.role);
  const userOfficeId = useAuthStore((s) => s.user?.office_id);

  const isAdmin = variant === "admin-worker";

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
    : (userOfficeId ?? null);

  const initialTab: TabType =
    searchParams.get("tab") === "subcategories" ? "subcategories" : "categories";
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  const { categories, loading, error, refetch } = useCategories(manageOfficeId);

  useEffect(() => {
    onRegisterRefresh?.(refetch);
  }, [onRegisterRefresh, refetch]);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [isCreatingSubcategory, setIsCreatingSubcategory] = useState(false);

  const [editingKey, setEditingKey] = useState<EditingKey | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [savingKey, setSavingKey] = useState<EditingKey | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const selectedCategory = useMemo(
    () => categories.find((c) => String(c.id) === selectedCategoryId),
    [categories, selectedCategoryId],
  );

  const subcategories = selectedCategory?.subcategories ?? [];

  const allowed =
    (variant === "department-head" && role === "department-head") ||
    (variant === "admin-worker" && role === "admin-worker");

  useEffect(() => {
    if (!allowed) router.back();
  }, [allowed, router]);

  const cancelEdit = useCallback(() => {
    setEditingKey(null);
    setEditDraft("");
    setOriginalName("");
    setSavingKey(null);
  }, []);

  const startEdit = useCallback((key: EditingKey, name: string) => {
    setEditingKey(key);
    setEditDraft(name);
    setOriginalName(name);
    setSavingKey(null);
  }, []);

  const handleCreateCategory = useCallback(async () => {
    const name = newCategoryName.trim();
    if (!name || manageOfficeId == null) return;
    setIsCreatingCategory(true);
    const result = await createServiceCategory({ name }, manageOfficeId);
    setIsCreatingCategory(false);
    if (result.ok) {
      toast({ title: "Категория создана" });
      setNewCategoryName("");
      void refetch();
    } else {
      toast({ title: result.error, variant: "destructive" });
    }
  }, [newCategoryName, manageOfficeId, toast, refetch]);

  const handleCreateSubcategory = useCallback(async () => {
    const name = newSubcategoryName.trim();
    const catId = Number(selectedCategoryId);
    if (!name || !catId || manageOfficeId == null) return;
    setIsCreatingSubcategory(true);
    const result = await createSubcategory({ name, category_id: catId }, manageOfficeId);
    setIsCreatingSubcategory(false);
    if (result.ok) {
      toast({ title: "Подкатегория создана" });
      setNewSubcategoryName("");
      void refetch();
    } else {
      toast({ title: result.error, variant: "destructive" });
    }
  }, [newSubcategoryName, selectedCategoryId, manageOfficeId, toast, refetch]);

  const handleSaveEdit = useCallback(async () => {
    if (!editingKey || manageOfficeId == null) return;
    const name = editDraft.trim();
    if (!name) return;
    if (name === originalName) {
      cancelEdit();
      return;
    }

    setSavingKey(editingKey);
    const isCategory = editingKey.startsWith("category-");
    const id = Number(editingKey.split("-")[1]);

    const result = isCategory
      ? await updateServiceCategory(id, { name }, manageOfficeId)
      : await updateSubcategory(id, { name }, manageOfficeId);

    setSavingKey(null);

    if (result.ok) {
      toast({
        title: isCategory ? "Категория обновлена" : "Подкатегория обновлена",
      });
      cancelEdit();
      void refetch();
    } else {
      toast({ title: result.error, variant: "destructive" });
    }
  }, [editDraft, editingKey, originalName, manageOfficeId, toast, refetch, cancelEdit]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget || manageOfficeId == null) return;
    setIsDeleting(true);

    if (deleteTarget.type === "category") {
      if (editingKey === `category-${deleteTarget.item.id}`) cancelEdit();
      const result = await deleteServiceCategory(deleteTarget.item.id, manageOfficeId);
      setIsDeleting(false);
      if (result.ok) {
        toast({ title: "Категория удалена" });
        if (selectedCategoryId === String(deleteTarget.item.id)) setSelectedCategoryId("");
        setDeleteTarget(null);
        void refetch();
      } else {
        toast({ title: result.error, variant: "destructive" });
      }
      return;
    }

    if (editingKey === `subcategory-${deleteTarget.id}`) cancelEdit();
    const result = await deleteSubcategory(deleteTarget.id, manageOfficeId);
    setIsDeleting(false);
    if (result.ok) {
      toast({ title: "Подкатегория удалена" });
      setDeleteTarget(null);
      void refetch();
    } else {
      toast({ title: result.error, variant: "destructive" });
    }
  }, [
    deleteTarget,
    manageOfficeId,
    editingKey,
    cancelEdit,
    toast,
    selectedCategoryId,
    refetch,
  ]);

  if (!allowed) return null;

  const needsOffice = isAdmin && manageOfficeId == null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {isAdmin ? (
        <div className="mb-3 px-0">
          <Select
            value={selectedOfficeId || undefined}
            onValueChange={(v) => {
              cancelEdit();
              setSelectedOfficeId(v);
            }}
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

      <div className="mb-4 flex rounded-lg border border-border bg-muted p-1">
        {(["categories", "subcategories"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              cancelEdit();
              setActiveTab(tab);
            }}
            className={cn(
              "flex-1 rounded-md py-2.5 text-sm font-semibold transition-colors",
              activeTab === tab
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground",
            )}
          >
            {tab === "categories" ? "Категории" : "Подкатегории"}
          </button>
        ))}
      </div>

      {needsOffice ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground" />
          <p className="text-base font-semibold text-foreground">Выберите офис</p>
          <p className="text-sm text-muted-foreground">
            Каталог категорий настраивается отдельно для каждого офиса
          </p>
        </div>
      ) : loading ? (
        <div className="flex flex-1 items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" onClick={() => void refetch()}>
            Повторить
          </Button>
        </div>
      ) : (
        <div className="space-y-4 pb-6">
          {activeTab === "categories" && (
            <>
              <div className="space-y-4 rounded-xl border border-border bg-card p-4">
                <p className="text-base font-semibold text-foreground">Новая категория</p>
                <div className="space-y-2">
                  <Label htmlFor="new-category-name">Название</Label>
                  <Input
                    id="new-category-name"
                    placeholder="Например: КТО"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    disabled={isCreatingCategory || editingKey != null}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleCreateCategory();
                    }}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => void handleCreateCategory()}
                  disabled={!newCategoryName.trim() || isCreatingCategory}
                >
                  {isCreatingCategory ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    "Добавить категорию"
                  )}
                </Button>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">Список категорий</p>
                  <span className={CATALOG_COUNT_BADGE_CLASS}>{categories.length}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Нажмите на название, чтобы переименовать
                </p>
              </div>

              {categories.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-10 text-center">
                  <FolderOpen className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Пока нет категорий — добавьте первую выше
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {categories.map((cat) => {
                    const key: EditingKey = `category-${cat.id}`;
                    const subCount = cat.subcategories?.length ?? 0;
                    return (
                      <EditableCatalogRow
                        key={cat.id}
                        icon="category"
                        name={cat.name}
                        subtitle={subcategoryCountLabel(subCount)}
                        isEditing={editingKey === key}
                        draft={editingKey === key ? editDraft : cat.name}
                        isSaving={savingKey === key}
                        onStartEdit={() => startEdit(key, cat.name)}
                        onChangeDraft={setEditDraft}
                        onSave={() => void handleSaveEdit()}
                        onCancel={cancelEdit}
                        onDelete={() => setDeleteTarget({ type: "category", item: cat })}
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}

          {activeTab === "subcategories" && (
            <>
              <div className="space-y-2 rounded-xl border border-border bg-card p-4">
                <p className="text-base font-semibold text-foreground">Категория</p>
                <Select
                  value={selectedCategoryId || undefined}
                  onValueChange={(v) => {
                    cancelEdit();
                    setSelectedCategoryId(v);
                  }}
                  disabled={categories.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!selectedCategory ? (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-10 text-center">
                  <Hand className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {categories.length === 0
                      ? "Сначала создайте категорию на вкладке «Категории»"
                      : "Выберите категорию, чтобы управлять подкатегориями"}
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 rounded-xl border border-border bg-card p-4">
                    <div>
                      <p className="text-base font-semibold text-foreground">
                        Новая подкатегория
                      </p>
                      <p className="text-sm text-muted-foreground">в «{selectedCategory.name}»</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-subcategory-name">Название</Label>
                      <Input
                        id="new-subcategory-name"
                        placeholder="Например: Замена ламп"
                        value={newSubcategoryName}
                        onChange={(e) => setNewSubcategoryName(e.target.value)}
                        disabled={isCreatingSubcategory || editingKey != null}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void handleCreateSubcategory();
                        }}
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => void handleCreateSubcategory()}
                      disabled={!newSubcategoryName.trim() || isCreatingSubcategory}
                    >
                      {isCreatingSubcategory ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Сохранение...
                        </>
                      ) : (
                        "Добавить подкатегорию"
                      )}
                    </Button>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">Подкатегории</p>
                      <span className={CATALOG_COUNT_BADGE_CLASS}>{subcategories.length}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Нажмите на название, чтобы переименовать
                    </p>
                  </div>

                  {subcategories.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-10 text-center">
                      <List className="h-10 w-10 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        В этой категории пока нет подкатегорий
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {subcategories.map((sub) => {
                        const key: EditingKey = `subcategory-${sub.id}`;
                        return (
                          <EditableCatalogRow
                            key={sub.id}
                            icon="subcategory"
                            iconBackgroundClassName="bg-muted"
                            iconClassName="text-muted-foreground"
                            name={sub.name}
                            isEditing={editingKey === key}
                            draft={editingKey === key ? editDraft : sub.name}
                            isSaving={savingKey === key}
                            onStartEdit={() => startEdit(key, sub.name)}
                            onChangeDraft={setEditDraft}
                            onSave={() => void handleSaveEdit()}
                            onCancel={cancelEdit}
                            onDelete={() =>
                              setDeleteTarget({
                                type: "subcategory",
                                id: sub.id,
                                name: sub.name,
                              })
                            }
                          />
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}

      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget?.type === "category"
                ? "Удалить категорию?"
                : "Удалить подкатегорию?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === "category" ? (
                <>
                  {deleteTarget.item.name}
                  <br />
                  <br />
                  Категория будет снята у исполнителей и в существующих заявках (поле станет
                  пустым). Заявки не удаляются.
                </>
              ) : (
                deleteTarget?.name
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Отмена</AlertDialogCancel>
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
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
