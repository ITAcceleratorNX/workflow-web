"use client";

import { useCallback, useEffect, useState } from "react";
import { UserPlus, Users } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { AdminRegistrationRequestsTab } from "./admin-registration-requests-tab";
import { AdminUserManagementTab } from "./admin-user-management-tab";
import { fetchOffices, getServiceCategories } from "@/lib/service-categories-api";
import type { Office, ServiceCategory } from "@/lib/service-categories-api";

type TabType = "requests" | "management";

type AdminWorkerUsersScreenProps = {
  onRegisterRefresh?: (refetch: () => Promise<void>) => void;
};

export function AdminWorkerUsersScreen({ onRegisterRefresh }: AdminWorkerUsersScreenProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab: TabType = tabParam === "management" ? "management" : "requests";

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [offices, setOffices] = useState<Office[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);

  const [requestsRefresh, setRequestsRefresh] = useState<(() => Promise<void>) | null>(null);
  const [managementRefresh, setManagementRefresh] = useState<(() => Promise<void>) | null>(null);

  useEffect(() => {
    fetchOffices().then((res) => {
      if (res.ok) setOffices(res.data);
    });
    getServiceCategories().then((res) => {
      if (res.ok) setCategories(res.data);
    });
  }, []);

  const handleRegisterRequestsRefresh = useCallback((refetch: () => Promise<void>) => {
    setRequestsRefresh(() => refetch);
  }, []);

  const handleRegisterManagementRefresh = useCallback((refetch: () => Promise<void>) => {
    setManagementRefresh(() => refetch);
  }, []);

  const combinedRefresh = useCallback(async () => {
    if (activeTab === "requests") {
      await requestsRefresh?.();
    } else {
      await managementRefresh?.();
    }
  }, [activeTab, requestsRefresh, managementRefresh]);

  useEffect(() => {
    onRegisterRefresh?.(combinedRefresh);
  }, [onRegisterRefresh, combinedRefresh]);

  return (
    <div>
      <div className="mb-6 flex rounded-xl border border-border bg-muted/50 p-1">
        <button
          type="button"
          onClick={() => setActiveTab("requests")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors ${
            activeTab === "requests"
              ? "bg-[#F35713] text-white"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserPlus className="h-4 w-4" />
          Запросы
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("management")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors ${
            activeTab === "management"
              ? "bg-[#F35713] text-white"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="h-4 w-4" />
          Управление
        </button>
      </div>

      {activeTab === "requests" ? (
        <AdminRegistrationRequestsTab
          offices={offices}
          isActive={activeTab === "requests"}
          onRegisterRefresh={handleRegisterRequestsRefresh}
        />
      ) : (
        <AdminUserManagementTab
          offices={offices}
          categories={categories}
          isActive={activeTab === "management"}
          onRegisterRefresh={handleRegisterManagementRefresh}
        />
      )}
    </div>
  );
}
