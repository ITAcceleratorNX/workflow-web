"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type NewsSection = "news" | "surveys";

/**
 * Вкладка «Новости | Опросы» живёт в адресе (`?tab=surveys`): обновление страницы и возврат
 * из опроса открывают ту же вкладку. Переключение заменяет адрес, не добавляя шаг в историю.
 */
export function useNewsSection() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const section: NewsSection = searchParams.get("tab") === "surveys" ? "surveys" : "news";

  const setSection = useCallback(
    (next: NewsSection) => {
      router.replace(next === "surveys" ? `${pathname}?tab=surveys` : pathname, { scroll: false });
    },
    [router, pathname],
  );

  return { section, setSection };
}
