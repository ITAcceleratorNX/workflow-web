"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { DesktopContentPage } from "./desktop-content-page";

type DesktopManagementPageProps = {
  title: string;
  description?: string;
  backHref: string;
  backLabel?: string;
  actions?: ReactNode;
  children: ReactNode;
};

/** CRUD page wrapper inside RoleDesktopShell. */
export function DesktopManagementPage({
  title,
  description,
  backHref,
  backLabel = "Назад",
  actions,
  children,
}: DesktopManagementPageProps) {
  return (
    <DesktopContentPage
      title={title}
      description={description}
      actions={actions}
      dark
    >
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm text-[#E25B21] hover:text-[#F35713] mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>
      {children}
    </DesktopContentPage>
  );
}
