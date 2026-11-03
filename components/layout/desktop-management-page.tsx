"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { DesktopContentPage } from "./desktop-content-page";

type DesktopManagementPageProps = {
  title: string;
  /** Next to the title: e.g. the status of a survey. */
  titleAside?: ReactNode;
  description?: string;
  backHref: string;
  backLabel?: string;
  /** «Назад» вместо перехода по backHref: например, чтобы переспросить о несохранённых правках. */
  onBack?: () => void;
  actions?: ReactNode;
  children: ReactNode;
};

const BACK_CLASS = "inline-flex items-center gap-2 text-sm text-[#E25B21] hover:text-[#F35713] mb-6 transition-colors";

/** CRUD page wrapper inside RoleDesktopShell. */
export function DesktopManagementPage({
  title,
  titleAside,
  description,
  backHref,
  backLabel = "Назад",
  onBack,
  actions,
  children,
}: DesktopManagementPageProps) {
  const back = (
    <>
      <ArrowLeft className="h-4 w-4" />
      {backLabel}
    </>
  );
  return (
    <DesktopContentPage
      title={title}
      titleAside={titleAside}
      description={description}
      actions={actions}
      dark
    >
      {onBack ? (
        <button type="button" onClick={onBack} className={BACK_CLASS}>
          {back}
        </button>
      ) : (
        <Link href={backHref} className={BACK_CLASS}>
          {back}
        </Link>
      )}
      {children}
    </DesktopContentPage>
  );
}
