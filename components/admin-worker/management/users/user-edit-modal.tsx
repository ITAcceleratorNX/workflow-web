"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import {
  formatExecutorSpecialty,
  formatServiceCategoryName,
  isExecutorServiceCategory,
} from "@/constants/requests";
import { ManagementModalShell } from "@/components/layout/management-modal-shell";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useIsDesktop } from "@/hooks/use-media-query";
import { formatPhone } from "@/lib/phone-utils";
import type { Company } from "@/lib/companies-api";
import type { Office, ServiceCategory } from "@/lib/service-categories-api";
import {
  changeUserPassword,
  getExecutorByUserId,
  getExecutors,
  updateExecutor,
  updateUserProfile,
  updateUserRole,
  type ExecutorInCategory,
  type OfficeUser,
} from "@/lib/users-management-api";
import {
  isExecutorOfficeAccessValid,
  sameExecutorOfficeAccess,
  toggleExecutorOffice,
  type ExecutorOfficeAccess,
} from "@/lib/executor-office-access";

export const USER_ROLE_LABELS: Record<string, string> = {
  client: "Клиент",
  "admin-worker": "Администратор офиса",
  "department-head": "Офис-менеджер",
  executor: "Исполнитель",
  manager: "Руководитель",
};

/** Роли, которые Офис-менеджер может назначать пользователям своего офиса. */
export const OFFICE_STAFF_ROLES = ["client", "executor"] as const;

const STAFF_ROLES_WITHOUT_OFFICE_CHANGE = ["department-head", "manager", "admin-worker"];

/**
 * `admin` — Администратор: все роли, офис и доступ Исполнителя к офисам.
 * `office` — Офис-менеджер: только клиенты и исполнители своего офиса, без смены офиса.
 */
export type UserEditScope = "admin" | "office";

export function FilterPill({
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
      className={`shrink-0 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-colors ${
        active
          ? "border-[#F35713] bg-[rgba(243,87,19,0.2)] text-[#F35713]"
          : "border-border text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

/** Категории Исполнителя для формы: «Администрацию» Исполнителю больше не назначают. */
function executorCategoryIds(executor: ExecutorInCategory): number[] {
  return (executor.serviceCategories ?? [])
    .filter((c) => isExecutorServiceCategory(c.name))
    .map((c) => c.id);
}

type UserEditModalProps = {
  user: OfficeUser | null;
  scope: UserEditScope;
  /** Офисы для выбора (только `admin`). */
  offices: Office[];
  categories: ServiceCategory[];
  /** Уже загруженная запись Исполнителя, если есть. */
  executor?: ExecutorInCategory;
  onExecutorLoaded?: (userId: number, executor: ExecutorInCategory) => void;
  companiesByOfficeId: Record<number, Company[]>;
  onNeedCompanies?: (officeId: number) => void;
  onClose: () => void;
  onSaved: () => void;
};

/** Модалка редактирования пользователя — общая для Администратора и Офис-менеджера. */
export function UserEditModal({ user, onClose, ...rest }: UserEditModalProps) {
  const [saving, setSaving] = useState(false);

  return (
    <ManagementModalShell
      open={user != null}
      onClose={() => !saving && onClose()}
      title={user?.full_name ?? "Пользователь"}
      maxWidthClass="max-w-lg"
      bodyClassName="max-h-[min(85vh,720px)]"
    >
      {user ? (
        <UserEditForm
          key={user.id}
          user={user}
          onClose={onClose}
          saving={saving}
          setSaving={setSaving}
          {...rest}
        />
      ) : null}
    </ManagementModalShell>
  );
}

type UserEditFormProps = Omit<UserEditModalProps, "user"> & {
  user: OfficeUser;
  saving: boolean;
  setSaving: (v: boolean) => void;
};

function UserEditForm({
  user: editUser,
  scope,
  offices,
  categories,
  executor: editingExecutor,
  onExecutorLoaded,
  companiesByOfficeId,
  onNeedCompanies,
  onClose,
  onSaved,
  saving,
  setSaving,
}: UserEditFormProps) {
  const { toast } = useToast();
  const isDesktop = useIsDesktop();
  const isAdmin = scope === "admin";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newRole, setNewRole] = useState(editUser.role);
  const [draftOfficeId, setDraftOfficeId] = useState(
    editUser.office_id != null ? String(editUser.office_id) : "",
  );
  const [fullName, setFullName] = useState(editUser.full_name ?? "");
  const [phone, setPhone] = useState(formatPhone(editUser.phone ?? ""));
  const [specialty, setSpecialty] = useState(formatExecutorSpecialty(editingExecutor?.specialty));
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(
    editingExecutor ? executorCategoryIds(editingExecutor) : [],
  );
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [draftCompanyId, setDraftCompanyId] = useState(
    editUser.company_id != null ? String(editUser.company_id) : "",
  );
  const [draftOfficeAccess, setDraftOfficeAccess] = useState<ExecutorOfficeAccess>(
    editUser.executor_office_access ?? {
      all_offices: false,
      office_ids: editUser.office_id != null ? [Number(editUser.office_id)] : [],
    },
  );

  const isExecutorForm = newRole === "executor";
  const roleOptions = isAdmin ? Object.keys(USER_ROLE_LABELS) : [...OFFICE_STAFF_ROLES];

  useEffect(() => {
    if (editUser.office_id != null) onNeedCompanies?.(Number(editUser.office_id));
    // Компании офиса нужны один раз при открытии.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyExecutor = (executor: ExecutorInCategory) => {
    setSpecialty(formatExecutorSpecialty(executor.specialty));
    setSelectedCategoryIds(executorCategoryIds(executor));
    if (executor.user?.full_name) setFullName(executor.user.full_name);
    if (executor.user?.phone) setPhone(formatPhone(executor.user.phone));
  };

  useEffect(() => {
    if (!isExecutorForm || editingExecutor || editUser.role !== "executor") return;
    let cancelled = false;
    void getExecutorByUserId(editUser.id).then((res) => {
      if (cancelled || !res.ok) return;
      onExecutorLoaded?.(editUser.id, res.data);
      applyExecutor(res.data);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExecutorForm, editingExecutor, editUser]);

  const sortedOffices = useMemo(
    () => [...offices].sort((a, b) => a.name.localeCompare(b.name, "ru")),
    [offices],
  );

  const modalCategories = useMemo(() => {
    const oid =
      draftOfficeId !== ""
        ? Number(draftOfficeId)
        : editUser.office_id != null
          ? Number(editUser.office_id)
          : NaN;
    const byId = new Map(categories.map((c) => [c.id, c]));
    for (const c of editingExecutor?.serviceCategories ?? []) {
      if (!byId.has(c.id) && selectedCategoryIds.includes(c.id)) {
        byId.set(c.id, { id: c.id, name: c.name });
      }
    }
    // «Администрацию» ведёт Офис-менеджер: Исполнителю её не назначают.
    const forExecutor = [...byId.values()]
      .filter((c) => isExecutorServiceCategory(c.name))
      .sort((a, b) => a.name.localeCompare(b.name, "ru"));
    if (!Number.isFinite(oid)) return forExecutor;
    return forExecutor.filter((c) => !c.office_id || Number(c.office_id) === Number(oid));
  }, [categories, editUser, draftOfficeId, editingExecutor, selectedCategoryIds]);

  const toggleCategory = (id: number) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const selectDraftOffice = (id: string) => {
    const prevOid = Number(draftOfficeId);
    setDraftOfficeId(id);
    const oidNum = Number(id);
    // Основной офис Исполнителя меняется и в выборе офисов, остальные офисы остаются.
    setDraftOfficeAccess((prev) => {
      if (prev.all_offices || !Number.isFinite(oidNum) || oidNum <= 0) return prev;
      const ids = prev.office_ids.filter((x) => x !== prevOid);
      if (!ids.includes(oidNum)) ids.push(oidNum);
      return { all_offices: false, office_ids: ids.sort((a, b) => a - b) };
    });
    setSelectedCategoryIds((prev) => {
      if (!Number.isFinite(oidNum)) return prev;
      return prev.filter((catId) => {
        const c = categories.find((x) => x.id === catId);
        return c != null && (!c.office_id || Number(c.office_id) === oidNum);
      });
    });
    setDraftCompanyId("");
    if (Number.isFinite(oidNum) && oidNum > 0) onNeedCompanies?.(oidNum);
  };

  const selectRole = (roleId: string) => {
    setNewRole(roleId);
    if (roleId === "executor") {
      if (editingExecutor) {
        applyExecutor(editingExecutor);
      } else if (editUser.role !== "executor") {
        setSpecialty("");
        setSelectedCategoryIds([]);
      }
    }
  };

  const handleSaveUser = async () => {
    setPasswordError(null);
    setRoleError(null);

    const passwordFilled = newPassword.trim().length > 0;
    if (passwordFilled) {
      if (newPassword !== confirmPassword) {
        setPasswordError("Пароли не совпадают");
        return;
      }
      if (newPassword.length < 6) {
        setPasswordError("Минимум 6 символов");
        return;
      }
    }

    if (
      isAdmin &&
      offices.length > 0 &&
      !draftOfficeId.trim() &&
      !STAFF_ROLES_WITHOUT_OFFICE_CHANGE.includes(editUser.role)
    ) {
      toast({ title: "Выберите офис", variant: "error" });
      return;
    }

    const basicProfileChanged =
      fullName.trim() !== (editUser.full_name ?? "").trim() ||
      phone !== formatPhone(editUser.phone ?? "");

    if (!fullName.trim()) {
      toast({ title: "Укажите ФИО", variant: "error" });
      return;
    }

    if (isExecutorForm) {
      if (!specialty.trim() || selectedCategoryIds.length === 0) {
        toast({
          title: "Укажите специальность и хотя бы одну категорию",
          variant: "error",
        });
        return;
      }
      if (isAdmin && !isExecutorOfficeAccessValid(draftOfficeAccess)) {
        toast({ title: "Выберите хотя бы один офис или «Все офисы»", variant: "error" });
        return;
      }
    }

    const initialOfficeNumeric =
      editUser.office_id != null && Number.isFinite(Number(editUser.office_id))
        ? Number(editUser.office_id)
        : NaN;
    const draftOfficeNumeric =
      draftOfficeId.trim() !== "" && Number.isFinite(Number(draftOfficeId))
        ? Number(draftOfficeId)
        : NaN;
    const officeChanged =
      isAdmin &&
      Number.isFinite(draftOfficeNumeric) &&
      (Number.isNaN(initialOfficeNumeric) || draftOfficeNumeric !== initialOfficeNumeric);

    const initialRole = editUser.role;
    const roleChanged = newRole && newRole !== initialRole;
    const promotingToExecutor = roleChanged && newRole === "executor";
    const demotingFromExecutor = roleChanged && initialRole === "executor" && newRole !== "executor";

    const useExecutorApiForProfile =
      isExecutorForm && !demotingFromExecutor && (!!editingExecutor || promotingToExecutor);

    const executorFieldsChanged =
      useExecutorApiForProfile &&
      editingExecutor &&
      (specialty.trim() !== formatExecutorSpecialty(editingExecutor.specialty) ||
        JSON.stringify([...selectedCategoryIds].sort()) !==
          JSON.stringify(executorCategoryIds(editingExecutor).sort()) ||
        basicProfileChanged);

    const needsUserProfileUpdate = basicProfileChanged && !useExecutorApiForProfile;

    const initialCompanyId = editUser.company_id != null ? Number(editUser.company_id) : null;
    const draftCompanyNumeric =
      draftCompanyId.trim() !== "" && Number.isFinite(Number(draftCompanyId))
        ? Number(draftCompanyId)
        : null;
    const companyChanged =
      !roleChanged && newRole === "client" && draftCompanyNumeric !== initialCompanyId;

    // При переводе Исполнителя в другой основной офис сервер заменяет в выборе прежний офис
    // новым, поэтому сравниваем с тем, что получится после этой замены.
    const accessAfterOfficeChange: ExecutorOfficeAccess | null = (() => {
      if (initialRole !== "executor" || !editUser.executor_office_access) {
        return Number.isFinite(draftOfficeNumeric)
          ? { all_offices: false, office_ids: [draftOfficeNumeric] }
          : Number.isFinite(initialOfficeNumeric)
            ? { all_offices: false, office_ids: [initialOfficeNumeric] }
            : null;
      }
      const current = editUser.executor_office_access;
      if (!officeChanged || current.all_offices) return current;
      const ids = current.office_ids.filter((id) => id !== initialOfficeNumeric);
      if (!ids.includes(draftOfficeNumeric)) ids.push(draftOfficeNumeric);
      return { all_offices: false, office_ids: ids };
    })();
    const officeAccessChanged =
      isAdmin &&
      isExecutorForm &&
      !sameExecutorOfficeAccess(draftOfficeAccess, accessAfterOfficeChange);

    if (
      !passwordFilled &&
      !officeChanged &&
      !roleChanged &&
      !needsUserProfileUpdate &&
      !executorFieldsChanged &&
      !promotingToExecutor &&
      !companyChanged &&
      !officeAccessChanged
    ) {
      toast({ title: "Нет изменений", variant: "info" });
      return;
    }

    setSaving(true);

    if (passwordFilled) {
      const pwdRes = await changeUserPassword(editUser.id, newPassword);
      if (!pwdRes.ok) {
        setSaving(false);
        setPasswordError(pwdRes.error);
        return;
      }
    }

    const profilePut: {
      full_name?: string;
      phone?: string;
      office_id?: number;
      category_ids?: number[];
      company_id?: number | null;
    } = {};
    if (officeChanged && Number.isFinite(draftOfficeNumeric)) {
      profilePut.office_id = draftOfficeNumeric;
      if (isExecutorForm) profilePut.category_ids = selectedCategoryIds;
    }
    if (needsUserProfileUpdate) {
      profilePut.full_name = fullName.trim();
      profilePut.phone = phone;
    }
    if (companyChanged) profilePut.company_id = draftCompanyNumeric;
    if (Object.keys(profilePut).length > 0) {
      const profileRes = await updateUserProfile(editUser.id, profilePut);
      if (!profileRes.ok) {
        setSaving(false);
        setRoleError(profileRes.error);
        return;
      }
    }

    if (roleChanged) {
      const roleRes = await updateUserRole(editUser.id, newRole, {
        category_ids: promotingToExecutor ? selectedCategoryIds : undefined,
        specialty: promotingToExecutor ? specialty.trim() : undefined,
      });
      if (!roleRes.ok) {
        setSaving(false);
        setRoleError(roleRes.error);
        return;
      }
    }

    const resolverOfficeId =
      officeChanged && Number.isFinite(draftOfficeNumeric)
        ? draftOfficeNumeric
        : editUser.office_id;

    let executorRecord = editingExecutor;
    if (promotingToExecutor && !executorRecord) {
      const execRes = await getExecutors(undefined, resolverOfficeId);
      if (execRes.ok) {
        executorRecord = execRes.data.find((e) => e.user?.id === editUser.id);
      }
    }

    if (useExecutorApiForProfile && executorRecord) {
      const execRes = await updateExecutor(executorRecord.id, {
        full_name: fullName.trim(),
        phone,
        specialty: specialty.trim(),
        category_ids: selectedCategoryIds,
      });
      if (!execRes.ok) {
        setSaving(false);
        setRoleError(execRes.error);
        return;
      }
    }

    if (officeAccessChanged) {
      const accessRes = await updateUserProfile(editUser.id, { office_access: draftOfficeAccess });
      if (!accessRes.ok) {
        setSaving(false);
        setRoleError(accessRes.error);
        return;
      }
    }

    setSaving(false);
    toast({ title: "Сохранено", variant: "success" });
    onClose();
    onSaved();
  };

  const editUserSubtitle = `${USER_ROLE_LABELS[editUser.role] ?? editUser.role} · ${editUser.phone}${
    editUser.office?.name ? ` · ${editUser.office.name}` : ""
  }`;

  const companyOfficeId = draftOfficeId
    ? Number(draftOfficeId)
    : editUser.office_id != null
      ? Number(editUser.office_id)
      : NaN;
  const companies = Number.isFinite(companyOfficeId)
    ? (companiesByOfficeId[companyOfficeId] ?? [])
    : [];

  return (
    <>
      {!isDesktop ? (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-foreground">{editUser.full_name}</h2>
            <p className="text-sm text-muted-foreground">{editUserSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => !saving && onClose()}
            className="rounded-lg p-2 active:opacity-70"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      ) : (
        <p className="mb-4 text-sm text-muted-foreground">{editUserSubtitle}</p>
      )}

      <div className="space-y-3">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
            Новый пароль
          </p>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Оставьте пустым, если не меняете"
          />
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Подтверждение пароля"
            className="mt-2"
          />
          {passwordError ? <p className="mt-1 text-sm text-destructive">{passwordError}</p> : null}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Роль</p>
          <div className="flex flex-wrap gap-2">
            {roleOptions.map((id) => (
              <FilterPill
                key={id}
                active={newRole === id}
                label={USER_ROLE_LABELS[id]}
                onClick={() => selectRole(id)}
              />
            ))}
          </div>
          {roleError ? <p className="mt-1 text-sm text-destructive">{roleError}</p> : null}
        </div>

        {isAdmin && isExecutorForm && sortedOffices.length > 0 ? (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Офис</p>
            <p className="mb-2 text-xs text-muted-foreground">
              На заявки каких офисов можно назначать Исполнителя. «Все офисы» включает и новые
              офисы.
            </p>
            <div className="flex flex-wrap gap-2">
              <FilterPill
                active={draftOfficeAccess.all_offices}
                label="Все офисы"
                onClick={() =>
                  setDraftOfficeAccess((prev) =>
                    prev.all_offices
                      ? {
                          all_offices: false,
                          office_ids: draftOfficeId ? [Number(draftOfficeId)] : [],
                        }
                      : { all_offices: true, office_ids: [] },
                  )
                }
              />
              {sortedOffices.map((o) => (
                <FilterPill
                  key={o.id}
                  active={
                    !draftOfficeAccess.all_offices &&
                    draftOfficeAccess.office_ids.includes(Number(o.id))
                  }
                  label={o.name}
                  onClick={() =>
                    setDraftOfficeAccess((prev) => toggleExecutorOffice(prev, Number(o.id)))
                  }
                />
              ))}
            </div>
          </div>
        ) : null}

        {isAdmin ? (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
              {isExecutorForm ? "Основной офис" : "Офис"}
            </p>
            {isExecutorForm ? (
              <p className="-mt-1 mb-2 text-xs text-muted-foreground">
                Определяет категории услуг и Офис-менеджера Исполнителя.
              </p>
            ) : null}
            {STAFF_ROLES_WITHOUT_OFFICE_CHANGE.includes(editUser.role) ? (
              <p className="text-sm text-muted-foreground">
                Для пользователей с этой ролью смена офиса здесь недоступна.
              </p>
            ) : sortedOffices.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Список офисов недоступен — обновите экран
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {sortedOffices.map((o) => (
                  <FilterPill
                    key={o.id}
                    active={draftOfficeId === String(o.id)}
                    label={o.name}
                    onClick={() => selectDraftOffice(String(o.id))}
                  />
                ))}
              </div>
            )}
          </div>
        ) : null}

        {newRole === "client" && (isAdmin || companies.length > 0) ? (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Компания</p>
            <div className="flex flex-wrap gap-2">
              <FilterPill
                active={draftCompanyId === ""}
                label="Не указана"
                onClick={() => setDraftCompanyId("")}
              />
              {companies.map((c) => (
                <FilterPill
                  key={c.id}
                  active={draftCompanyId === String(c.id)}
                  label={c.name}
                  onClick={() => setDraftCompanyId(String(c.id))}
                />
              ))}
            </div>
          </div>
        ) : null}

        <Input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Иванов Иван"
        />
        <div>
          <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Телефон</p>
          <Input
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            placeholder="+7 XXX XXX XX XX"
            maxLength={19}
          />
        </div>

        {isExecutorForm ? (
          <>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                Специальность
              </p>
              <Input
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="Например: электрик"
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                Категории услуг
              </p>
              {modalCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Нет категорий для офиса пользователя
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {modalCategories.map((c) => (
                    <FilterPill
                      key={c.id}
                      active={selectedCategoryIds.includes(c.id)}
                      label={formatServiceCategoryName(c.name)}
                      onClick={() => toggleCategory(c.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 rounded-xl border border-border py-3 text-foreground disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSaveUser}
            disabled={saving}
            className="flex flex-1 items-center justify-center rounded-xl bg-[#F35713] py-3 font-semibold text-white disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Сохранить"}
          </button>
        </div>
      </div>
    </>
  );
}
