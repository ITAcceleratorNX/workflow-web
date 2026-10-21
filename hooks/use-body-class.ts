"use client";

import { useEffect } from "react";

/** Вешает класс на <body>, пока `enabled` (тема мобильных разделов роли), и снимает при уходе. */
export function useBodyClass(className: string, enabled: boolean) {
  useEffect(() => {
    document.body.classList.toggle(className, enabled);
    return () => document.body.classList.remove(className);
  }, [className, enabled]);
}
