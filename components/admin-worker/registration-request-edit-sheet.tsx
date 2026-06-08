"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { ManagementModalShell } from "@/components/layout/management-modal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COMPANY_OTHER_VALUE } from "@/constants/registration";
import { getOfficeCompanies } from "@/lib/companies-api";
import type { Company } from "@/lib/companies-api";
import type { Office } from "@/lib/service-categories-api";
import {
  updateRegistrationRequest,
  type RegistrationRequestItem,
} from "@/lib/registration-requests-api";

const NONE_VALUE = "__none__";

type OpenDropdown = "office" | "company" | null;

export type RegistrationRequestEditSheetProps = {
  open: boolean;
  request: RegistrationRequestItem | null;
  offices: Office[];
  onClose: () => void;
  onSaved: () => void;
};

export function RegistrationRequestEditSheet({
  open,
  request,
  offices,
  onClose,
  onSaved,
}: RegistrationRequestEditSheetProps) {
  const [officeId, setOfficeId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [companyOtherName, setCompanyOtherName] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<OpenDropdown>(null);

  const isClient = request?.role === "client";

  useEffect(() => {
    if (!open) setOpenDropdown(null);
  }, [open]);

  useEffect(() => {
    if (!request) return;
    setOfficeId(request.office_id != null ? String(request.office_id) : "");
    if (!isClient) {
      setCompanyId("");
      setCompanyOtherName("");
      return;
    }
    if (request.company_id != null) {
      setCompanyId(String(request.company_id));
      setCompanyOtherName("");
    } else if (request.company_other_name) {
      setCompanyId(COMPANY_OTHER_VALUE);
      setCompanyOtherName(request.company_other_name);
    } else {
      setCompanyId(NONE_VALUE);
      setCompanyOtherName("");
    }
    setError(null);
    setOpenDropdown(null);
  }, [request, isClient]);

  useEffect(() => {
    if (!open || !isClient) {
      setCompanies([]);
      return;
    }
    const oid = Number(officeId);
    if (!Number.isFinite(oid) || oid <= 0) {
      setCompanies([]);
      return;
    }
    setCompaniesLoading(true);
    getOfficeCompanies(oid).then((res) => {
      setCompanies(res.ok ? res.data : []);
      setCompaniesLoading(false);
    });
  }, [open, isClient, officeId]);

  const officeLabel = useMemo(() => {
    if (!officeId) return "Выберите офис";
    return offices.find((o) => String(o.id) === officeId)?.name ?? "Офис";
  }, [officeId, offices]);

  const companyLabel = useMemo(() => {
    if (companiesLoading) return "Загрузка…";
    if (!companyId || companyId === NONE_VALUE) return "Не указана";
    if (companyId === COMPANY_OTHER_VALUE) return "Другое";
    return companies.find((c) => String(c.id) === companyId)?.name ?? "Компания";
  }, [companyId, companies, companiesLoading]);

  const handleOfficeChange = (v: string) => {
    setOfficeId(v);
    setOpenDropdown(null);
    if (isClient) {
      setCompanyId("");
      setCompanyOtherName("");
    }
  };

  const handleSave = async () => {
    if (!request) return;
    const oid = Number(officeId);
    if (!Number.isFinite(oid) || oid <= 0) {
      setError("Выберите офис");
      return;
    }
    setSaving(true);
    setError(null);
    const body: {
      office_id?: number;
      company_id?: number | null;
      company_other_name?: string | null;
    } = {};
    if (oid !== Number(request.office_id)) {
      body.office_id = oid;
    }
    if (isClient) {
      if (companyId === COMPANY_OTHER_VALUE) {
        const otherName = companyOtherName.trim();
        if (!otherName) {
          setSaving(false);
          setError("Укажите название компании или выберите другую опцию");
          return;
        }
        body.company_other_name = otherName;
        body.company_id = null;
      } else if (companyId === NONE_VALUE || companyId === "") {
        body.company_id = null;
        body.company_other_name = null;
      } else {
        const cid = Number(companyId);
        if (Number.isFinite(cid) && cid > 0) {
          body.company_id = cid;
          body.company_other_name = null;
        }
      }
    }

    if (Object.keys(body).length === 0) {
      setSaving(false);
      onClose();
      return;
    }

    const result = await updateRegistrationRequest(request.id, body);
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSaved();
    onClose();
  };

  if (!request) return null;

  return (
    <ManagementModalShell
      open={open}
      onClose={() => !saving && onClose()}
      title="Изменить заявку"
    >
      <p className="mb-4 text-sm text-muted-foreground">{request.full_name}</p>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Офис</Label>
          <button
            type="button"
            onClick={() => setOpenDropdown((d) => (d === "office" ? null : "office"))}
            className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-left"
          >
            <span className="text-foreground">{officeLabel}</span>
            <ChevronDown
              className={`h-5 w-5 text-muted-foreground transition-transform ${openDropdown === "office" ? "rotate-180" : ""}`}
            />
          </button>
          {openDropdown === "office" ? (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              {offices.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className={`w-full px-4 py-3 text-left text-foreground ${
                    officeId === String(o.id) ? "bg-[rgba(243,87,19,0.12)]" : ""
                  }`}
                  onClick={() => handleOfficeChange(String(o.id))}
                >
                  {o.name}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {isClient ? (
          <>
            <div className="space-y-2">
              <Label>Компания</Label>
              <button
                type="button"
                disabled={companiesLoading && !officeId}
                onClick={() => setOpenDropdown((d) => (d === "company" ? null : "company"))}
                className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-left disabled:opacity-50"
              >
                <span className="text-foreground">{companyLabel}</span>
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground transition-transform ${openDropdown === "company" ? "rotate-180" : ""}`}
                />
              </button>
              {openDropdown === "company" ? (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  <button
                    type="button"
                    className={`w-full px-4 py-3 text-left text-foreground ${
                      companyId === NONE_VALUE || companyId === ""
                        ? "bg-[rgba(243,87,19,0.12)]"
                        : ""
                    }`}
                    onClick={() => {
                      setCompanyId(NONE_VALUE);
                      setCompanyOtherName("");
                      setOpenDropdown(null);
                    }}
                  >
                    Не указана
                  </button>
                  {companies.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`w-full px-4 py-3 text-left text-foreground ${
                        companyId === String(c.id) ? "bg-[rgba(243,87,19,0.12)]" : ""
                      }`}
                      onClick={() => {
                        setCompanyId(String(c.id));
                        setCompanyOtherName("");
                        setOpenDropdown(null);
                      }}
                    >
                      {c.name}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={`w-full px-4 py-3 text-left text-foreground ${
                      companyId === COMPANY_OTHER_VALUE ? "bg-[rgba(243,87,19,0.12)]" : ""
                    }`}
                    onClick={() => {
                      setCompanyId(COMPANY_OTHER_VALUE);
                      setOpenDropdown(null);
                    }}
                  >
                    Другое
                  </button>
                </div>
              ) : null}
            </div>

            {companyId === COMPANY_OTHER_VALUE ? (
              <div className="space-y-2">
                <Label>Название компании</Label>
                <Input
                  value={companyOtherName}
                  onChange={(e) => setCompanyOtherName(e.target.value)}
                  placeholder="Введите название"
                  maxLength={255}
                />
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Для роли «{request.role}» компания не назначается.
          </p>
        )}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button className="w-full" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Сохранить"}
        </Button>
      </div>
    </ManagementModalShell>
  );
}
