import { cn } from "@/lib/utils";

/**
 * Раздел «Заявки» на десктопе по макету «Заявки» (кабинет Руководителя; кадр, вкладки, фильтры
 * и строки общие для всех ролей). Классы ui-* (bg-ui-raised, text-ui-fg) выводят элементы из-под
 * легаси-правил globals.css для обёрток management-modal-dark / client-desktop-content.
 */

const FOCUS_RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D2B]/60";

export const RQ_DESKTOP_TITLE = "text-[26px] font-bold leading-10 text-ui-fg";

export const RQ_DESKTOP_CREATE =
  "h-10 gap-2 rounded-[10px] bg-[#E85D2B] px-4 text-[15px] font-semibold text-ui-fg hover:bg-[#E85D2B]/90 [&_svg]:size-[18px]";

/** Вторичная кнопка 40px: «Экспорт в Excel», «Показать ещё», «Сбросить фильтры». */
export const RQ_DESKTOP_BUTTON = cn(
  "group inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[10px] border border-[#414143] bg-ui-raised px-4",
  "text-[15px] font-semibold text-ui-fg transition-colors hover:bg-[#363638] disabled:pointer-events-none",
  "disabled:border-ui-raised disabled:text-[#636366] [&_svg]:size-[18px] [&_svg]:shrink-0",
  FOCUS_RING,
);

/** Оранжевая иконка во вторичной кнопке; в неактивной — серая. */
export const RQ_DESKTOP_BUTTON_ICON = "text-[#E85D2B] group-disabled:text-[#636366]";

export const RQ_DESKTOP_TABS =
  "inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-[#39393C] bg-[#2A2A2C] p-1 text-ui-fg";

export function rqDesktopTabClass(active: boolean) {
  return cn(
    "h-9 shrink-0 whitespace-nowrap rounded-lg px-4 text-[15px] transition-colors",
    FOCUS_RING,
    active ? "bg-[#E85D2B] font-semibold text-ui-fg" : "text-[#D1D1D6] hover:bg-white/5 hover:text-ui-fg",
  );
}

/** «Офис: Все офисы ⌄»; выбранное значение (не «Все») подсвечено — data-active на триггере. */
export const RQ_DESKTOP_FILTER_TRIGGER = cn(
  "group h-10 w-auto max-w-[300px] shrink-0 gap-1.5 rounded-[10px] border border-[#414143] bg-ui-raised px-3.5",
  "text-[15px] text-ui-fg shadow-none focus:ring-0 data-[state=open]:border-[#E85D2B]",
  "data-[active=true]:border-[#A24622] data-[active=true]:bg-[#3A2414] data-[active=true]:data-[state=open]:border-[#E85D2B]",
  "[&>svg]:h-4 [&>svg]:w-4 [&>svg]:text-[#A1A1A6] [&>svg]:opacity-100",
  FOCUS_RING,
);

export const RQ_DESKTOP_FILTER_LABEL = "font-normal text-[#A1A1A6]";

export const RQ_DESKTOP_FILTER_VALUE = "font-semibold text-ui-fg group-data-[active=true]:text-[#FF8A50]";

/** Все статусы руководителя видны без прокрутки, если окну хватает высоты. */
export const RQ_DESKTOP_MENU = cn(
  "max-h-[min(var(--radix-select-content-available-height),440px)] min-w-[240px] rounded-xl border border-[#48484A]",
  "bg-ui-raised p-1.5 text-ui-fg shadow-[0_16px_40px_rgba(0,0,0,0.45)]",
);

export const RQ_DESKTOP_MENU_ITEM = cn(
  "min-h-[38px] cursor-pointer rounded-lg py-2 pl-9 pr-3 text-[15px] text-ui-fg",
  "focus:bg-[#3A3A3C] focus:text-ui-fg data-[highlighted]:bg-[#3A3A3C] data-[state=checked]:bg-[#3A3A3C]",
  "[&>span:first-child]:left-3 [&>span:first-child]:text-[#E85D2B]",
);

export const RQ_DESKTOP_RESET = cn(
  "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-[10px] px-2 text-[15px] font-semibold text-[#E85D2B]",
  "transition-colors hover:bg-[#E85D2B]/10 [&_svg]:size-4",
  FOCUS_RING,
);

/** Строка списка: превью 60px, номер, статус, направление · офис, дата. */
export const RQ_DESKTOP_ROW = cn(
  "flex min-w-0 cursor-pointer items-center gap-4 rounded-xl px-1 py-2 transition-colors hover:bg-white/[0.03]",
  FOCUS_RING,
);

export const RQ_DESKTOP_THUMB = "h-[60px] w-[60px] rounded-[10px] bg-[#242426]";

/** Список без режима выбора: строки разделены линией на всю ширину. */
export const RQ_DESKTOP_LIST_DIVIDED = "divide-y divide-[#2C2C2E]";

export const RQ_DESKTOP_SKELETON = "animate-pulse bg-ui-raised";

export const RQ_DESKTOP_CARD = "rounded-[14px] border border-[#39393C] bg-[#2A2A2C] text-ui-fg";

/** Окно и уведомления «Экспорт в Excel». */
export const RQ_DESKTOP_POPOVER =
  "w-[380px] overflow-hidden rounded-[14px] border border-[#48484A] bg-ui-raised p-0 text-ui-fg shadow-[0_16px_40px_rgba(0,0,0,0.5)]";

export function rqDesktopNoticeClass(tone: "success" | "error") {
  return cn(
    "pointer-events-auto flex w-[420px] max-w-full items-start gap-3 rounded-[14px] border bg-ui-raised py-3.5 pl-4 pr-3",
    "text-ui-fg shadow-[0_16px_40px_rgba(0,0,0,0.5)]",
    tone === "error" ? "border-[#5A2323]" : "border-[#48484A]",
  );
}
