"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/** Шапка мобильного списка заявок (макет): заголовок и разделитель на всю ширину страницы. */
export function MobileRequestsTitle({ className }: { className?: string }) {
  return (
    <div className={cn("-mx-6 mb-4 border-b border-foreground/10 px-6 pb-4", className)}>
      <h1 className="text-xl font-semibold leading-6 text-foreground">Заявки</h1>
    </div>
  );
}

/** «+ Создать» на всю ширину — оранжевая кнопка 47 px со скруглением 12. */
export function MobileCreateRequestButton({ className }: { className?: string }) {
  return (
    <Link
      href="/create-request"
      className={cn(
        "flex h-[47px] w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <Plus className="h-[18px] w-[18px]" aria-hidden />
      Создать
    </Link>
  );
}
