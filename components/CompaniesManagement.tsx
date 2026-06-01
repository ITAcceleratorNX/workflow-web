"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    Company,
    Office,
    createOfficeCompany,
    deleteOfficeCompany,
    getOfficeCompanies,
    getOffices,
    updateOfficeCompany,
} from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";
import { useMediaQuery } from "@/hooks/use-media-query";

/**
 * Управление компаниями внутри офиса.
 * - `admin-worker` (variant="admin-worker"): выбирает офис и управляет любой компанией.
 * - `department-head` (variant="department-head"): работает только с офисом текущего пользователя.
 */
interface CompaniesManagementProps {
    variant: "admin-worker" | "department-head";
}

export default function CompaniesManagement({ variant }: CompaniesManagementProps) {
    const { user } = useAuthStore();
    const { toast } = useToast();
    const isMobile = useMediaQuery("(max-width: 767px)");
    // Тёмная тема в управлении используется на мобилке и на десктопе у админа.
    const isDark = isMobile || variant === "admin-worker";

    const [offices, setOffices] = useState<Office[]>([]);
    const [selectedOfficeId, setSelectedOfficeId] = useState<number | null>(null);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Инлайновая форма создания/редактирования.
    const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
    const [formCompanyId, setFormCompanyId] = useState<number | null>(null);
    const [formName, setFormName] = useState("");
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Подтверждение удаления.
    const [pendingDelete, setPendingDelete] = useState<Company | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Для admin-worker — селект офисов; для department-head офис фиксирован.
    useEffect(() => {
        if (variant !== "admin-worker") return;
        let cancelled = false;
        (async () => {
            try {
                const response = await getOffices();
                if (cancelled) return;
                setOffices(response.data || []);
            } catch (error) {
                console.error("Не удалось загрузить офисы", error);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [variant]);

    useEffect(() => {
        if (variant === "department-head" && user?.office_id) {
            setSelectedOfficeId(user.office_id);
        }
    }, [variant, user?.office_id]);

    const officeOptions = useMemo(
        () => offices.map((o) => ({ value: String(o.id), label: o.name })),
        [offices]
    );

    const loadCompanies = async (officeId: number) => {
        setLoading(true);
        setLoadError(null);
        try {
            const list = await getOfficeCompanies(officeId);
            setCompanies(list);
        } catch (error: any) {
            setLoadError(
                error?.response?.data?.message || error?.response?.data?.error || "Не удалось загрузить компании"
            );
            setCompanies([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!selectedOfficeId) {
            setCompanies([]);
            return;
        }
        loadCompanies(selectedOfficeId);
    }, [selectedOfficeId]);

    const resetForm = () => {
        setFormMode(null);
        setFormCompanyId(null);
        setFormName("");
        setFormError(null);
    };

    const startCreate = () => {
        setFormMode("create");
        setFormCompanyId(null);
        setFormName("");
        setFormError(null);
    };

    const startEdit = (company: Company) => {
        setFormMode("edit");
        setFormCompanyId(company.id);
        setFormName(company.name);
        setFormError(null);
    };

    const handleSave = async () => {
        if (!selectedOfficeId) return;
        const trimmed = formName.trim();
        if (!trimmed) {
            setFormError("Введите название компании");
            return;
        }
        setSaving(true);
        setFormError(null);
        try {
            if (formMode === "create") {
                await createOfficeCompany(selectedOfficeId, { name: trimmed });
                toast({ title: "Компания добавлена" });
            } else if (formMode === "edit" && formCompanyId != null) {
                await updateOfficeCompany(selectedOfficeId, formCompanyId, { name: trimmed });
                toast({ title: "Компания обновлена" });
            }
            resetForm();
            await loadCompanies(selectedOfficeId);
        } catch (error: any) {
            setFormError(
                error?.response?.data?.message || error?.response?.data?.error || "Не удалось сохранить компанию"
            );
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!pendingDelete || !selectedOfficeId) return;
        setDeleting(true);
        try {
            await deleteOfficeCompany(selectedOfficeId, pendingDelete.id);
            toast({
                title: "Компания удалена",
                description: "У клиентов этой компании поле «Компания» теперь «Не указана».",
            });
            setPendingDelete(null);
            await loadCompanies(selectedOfficeId);
        } catch (error: any) {
            toast({
                title: "Ошибка",
                description:
                    error?.response?.data?.message ||
                    error?.response?.data?.error ||
                    "Не удалось удалить компанию",
                variant: "destructive",
            });
        } finally {
            setDeleting(false);
        }
    };

    const cardCl = isDark ? "border-white/10 bg-[#2C2C2E]" : "";
    const titleCl = isDark ? "text-white" : "";
    const labelCl = isDark ? "text-white/80" : "";
    const inputCl = isDark
        ? "bg-[#1C1C1E] border-[#3A3A3C] text-white placeholder:text-white/50"
        : "";
    const mutedCl = isDark ? "text-white/60" : "text-muted-foreground";

    return (
        <div className="space-y-6">
            <Card className={cardCl ? `border ${cardCl}` : ""}>
                <CardHeader>
                    <CardTitle className={`text-lg md:text-xl ${titleCl}`}>Компании</CardTitle>
                    <p className={`text-xs md:text-sm ${mutedCl}`}>
                        Список компаний внутри офиса. Клиенты выбирают компанию при регистрации.
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    {variant === "admin-worker" && (
                        <div className="space-y-2">
                            <Label className={`text-xs md:text-sm ${labelCl}`}>Офис</Label>
                            <Select
                                value={selectedOfficeId ? String(selectedOfficeId) : ""}
                                onValueChange={(value) => {
                                    const next = value ? parseInt(value) : null;
                                    setSelectedOfficeId(next);
                                    resetForm();
                                }}
                            >
                                <SelectTrigger className={`text-xs md:text-sm ${inputCl}`}>
                                    <SelectValue placeholder="Выберите офис" />
                                </SelectTrigger>
                                <SelectContent
                                    className={
                                        isDark
                                            ? "bg-[#2C2C2E] border-white/10 text-white"
                                            : ""
                                    }
                                >
                                    {officeOptions.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {selectedOfficeId ? (
                        <>
                            <div className="flex items-center justify-between">
                                <h3 className={`text-sm md:text-base font-medium ${titleCl}`}>
                                    Компании офиса
                                </h3>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={startCreate}
                                    disabled={formMode !== null}
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Добавить
                                </Button>
                            </div>

                            {formMode !== null && (
                                <div
                                    className={`rounded-lg p-4 space-y-3 border ${
                                        isDark ? "bg-[#1C1C1E] border-white/10" : "bg-muted/30"
                                    }`}
                                >
                                    <Label className={`text-xs md:text-sm ${labelCl}`}>
                                        {formMode === "create" ? "Новая компания" : "Редактирование"}
                                    </Label>
                                    <Input
                                        value={formName}
                                        onChange={(e) => setFormName(e.target.value)}
                                        placeholder="Название компании"
                                        maxLength={255}
                                        className={inputCl}
                                    />
                                    {formError && (
                                        <p className="text-sm text-red-500">{formError}</p>
                                    )}
                                    <div className="flex gap-2 justify-end">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={resetForm}
                                            disabled={saving}
                                        >
                                            Отмена
                                        </Button>
                                        <Button type="button" onClick={handleSave} disabled={saving}>
                                            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                                            Сохранить
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {loading ? (
                                <div className={`text-center py-8 text-sm ${mutedCl}`}>Загрузка...</div>
                            ) : loadError ? (
                                <div className="text-sm text-red-500">{loadError}</div>
                            ) : companies.length === 0 ? (
                                <div className={`text-center py-8 text-sm ${mutedCl}`}>
                                    Компании пока не добавлены
                                </div>
                            ) : (
                                <ul className="divide-y divide-white/10">
                                    {companies.map((company) => (
                                        <li
                                            key={company.id}
                                            className="py-3 flex items-center justify-between gap-2"
                                        >
                                            <span className={`text-sm md:text-base ${titleCl}`}>
                                                {company.name}
                                            </span>
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => startEdit(company)}
                                                    disabled={formMode !== null}
                                                    className={
                                                        isDark
                                                            ? "border-white/20 text-white hover:bg-white/10"
                                                            : ""
                                                    }
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => setPendingDelete(company)}
                                                    disabled={formMode !== null}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </>
                    ) : (
                        <div className={`text-sm ${mutedCl}`}>
                            {variant === "admin-worker"
                                ? "Выберите офис, чтобы увидеть компании."
                                : "Не удалось определить ваш офис."}
                        </div>
                    )}
                </CardContent>
            </Card>

            <AlertDialog
                open={pendingDelete !== null}
                onOpenChange={(open) => !open && setPendingDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Удалить компанию?</AlertDialogTitle>
                        <AlertDialogDescription>
                            «{pendingDelete?.name}» будет удалена. У клиентов этой компании поле «Компания» станет
                            «Не указана», офис не изменится.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Отмена</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} disabled={deleting}>
                            {deleting ? "Удаление..." : "Удалить"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
