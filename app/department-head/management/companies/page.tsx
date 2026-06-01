"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import CompaniesManagement from "@/components/CompaniesManagement";

export default function DepartmentHeadCompaniesManagementPage() {
    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-6">
            <Link
                href="/department-head/management"
                className="inline-flex items-center gap-1 text-[#E25B21] font-medium mb-4"
            >
                <ChevronLeft className="h-5 w-5" />
                Назад
            </Link>
            <h1 className="text-xl font-bold text-white md:text-[#040404] mb-6">Компании</h1>
            <CompaniesManagement variant="department-head" />
        </div>
    );
}
