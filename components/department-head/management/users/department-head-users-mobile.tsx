"use client";

import { useState } from "react";
import { UserPlus, Users } from "lucide-react";
import RegistrationRequestsManager from "@/components/RegistrationRequestsManager";
import { DepartmentHeadUserManagementTab } from "./department-head-user-management-tab";
import { DepartmentHeadManagementMobileLayout } from "../department-head-management-mobile-layout";

type DepartmentHeadUsersTab = "requests" | "management";

export function DepartmentHeadUsersMobile() {
  const [activeTab, setActiveTab] = useState<DepartmentHeadUsersTab>("requests");

  return (
    <DepartmentHeadManagementMobileLayout title="Пользователи">
      <div className="flex rounded-xl border border-[#3A3A3C] bg-[#2C2C2E]/80 p-1 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab("requests")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "requests"
              ? "bg-[#E25B21] text-white"
              : "text-[#8E8E93] hover:text-white"
          }`}
        >
          <UserPlus className="h-4 w-4" />
          Запросы на регистрацию
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("management")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "management"
              ? "bg-[#E25B21] text-white"
              : "text-[#8E8E93] hover:text-white"
          }`}
        >
          <Users className="h-4 w-4" />
          Управление
        </button>
      </div>

      {activeTab === "requests" && <RegistrationRequestsManager />}
      {activeTab === "management" && <DepartmentHeadUserManagementTab />}
    </DepartmentHeadManagementMobileLayout>
  );
}
