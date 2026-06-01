"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import CompaniesManagement from "@/components/CompaniesManagement";

export default function AdminWorkerCompaniesManagementPage() {
    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-6">
            <Link
                href="/admin-worker/management"
                className="inline-flex items-center gap-1 text-[#F35713] font-medium mb-4"
            >
                <ChevronLeft className="h-5 w-5" />
                Назад
            </Link>
            <h1 className="text-xl font-bold text-white mb-6">Компании</h1>
            <div className="admin-management-content">
                <CompaniesManagement variant="admin-worker" />
            </div>
        </div>
    );
}
