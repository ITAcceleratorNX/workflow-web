/**
 * Bottom nav config — parity with workflow-mobile/components/bottom-nav.tsx
 */

import type { IconType } from "react-icons";
import {
  MdBuild,
  MdGridOn,
  MdHome,
  MdMessage,
  MdPerson,
} from "react-icons/md";
import { getRequestsListPath } from "@/constants/roles";
import { isBottomNavHiddenPath } from "@/constants/bottom-nav-visibility";

/** Подписи вкладок — workflow-mobile/components/bottom-nav.tsx */
export const MOBILE_BOTTOM_NAV_LABELS = {
  home: "Главная",
  booking: "Бронь",
  requests: "Заявки",
  help: "Сообщение",
  profile: "Профиль",
} as const;

export type MobileBottomNavTabKey = keyof typeof MOBILE_BOTTOM_NAV_LABELS;

/** Отступ сверху + высота блока иконка+подпись (без safe area). */
export const BOTTOM_NAV_TOP_PAD = 10;
export const BOTTOM_NAV_ROW_HEIGHT = BOTTOM_NAV_TOP_PAD + 42;
/** Минимальный отступ снизу под иконками (когда safe-area = 0, напр. Android / desktop preview). */
export const BOTTOM_NAV_MIN_BOTTOM_PAD = 10;

export const BOTTOM_NAV_ACTIVE_COLOR = "#FFFFFF";
export const BOTTOM_NAV_INACTIVE_COLOR = "rgba(255, 255, 255, 0.55)";
export const BOTTOM_NAV_BAR_BACKGROUND = "#F35713";

export type BottomNavTabKey = "home" | "booking" | "requests" | "help" | "profile";

export type BottomNavTabAlias =
  | BottomNavTabKey
  | "history"
  | "chat"
  | "statistics";

export interface BottomNavItem {
  key: BottomNavTabKey;
  label: string;
  href: string;
  icon: IconType;
}

const NAV_ICON_MAP: Record<BottomNavTabKey, IconType> = {
  home: MdHome,
  booking: MdGridOn,
  requests: MdBuild,
  help: MdMessage,
  profile: MdPerson,
};

function getHomeHref(role: string | null | undefined): string {
  switch (role) {
    case "manager":
      return "/manager/cabinet";
    case "admin-worker":
      return "/admin-worker";
    case "department-head":
      return "/department-head";
    case "executor":
      return "/executor/management";
    default:
      return "/client";
  }
}

function getHelpHref(role: string | null | undefined): string {
  return role === "admin-worker" ? "/admin-worker/messages" : "/chat-bot";
}

function getProfileHref(role: string | null | undefined): string {
  switch (role) {
    case "department-head":
      return "/department-head/profile";
    case "admin-worker":
      return "/admin-worker/profile";
    case "manager":
      return "/manager/profile";
    default:
      return "/profile";
  }
}

export function getNavItems(role: string | null | undefined): BottomNavItem[] {
  const keys: BottomNavTabKey[] = ["home", "booking", "requests", "help", "profile"];
  const hrefByKey: Record<BottomNavTabKey, string> = {
    home: getHomeHref(role),
    booking: "/meeting-rooms",
    requests: getRequestsListPath(role),
    help: getHelpHref(role),
    profile: getProfileHref(role),
  };

  return keys.map((key) => ({
    key,
    label: MOBILE_BOTTOM_NAV_LABELS[key],
    href: hrefByKey[key],
    icon: NAV_ICON_MAP[key],
  }));
}

export function normalizeActiveTab(
  tab: BottomNavTabAlias | undefined
): BottomNavTabKey | undefined {
  if (!tab) return undefined;
  const mapping: Record<string, BottomNavTabKey> = {
    history: "home",
    chat: "help",
    statistics: "home",
  };
  return (mapping[tab] ?? tab) as BottomNavTabKey;
}

export function getActiveTabFromPath(
  pathname: string | null | undefined,
  role: string | null | undefined
): BottomNavTabKey | undefined {
  const path = pathname?.split("?")[0] || "";
  const homeHref = getHomeHref(role);
  const bookingHref = "/meeting-rooms";
  const requestsHref = getRequestsListPath(role);
  const helpHref = getHelpHref(role);
  const profileHref = getProfileHref(role);

  const isHomePath =
    path === "/client" ||
    path.startsWith("/client/health") ||
    path.startsWith("/client/steps") ||
    path.startsWith("/client/sleep") ||
    path === homeHref ||
    (role && path === `/${role}`) ||
    (role === "admin-worker" && path.startsWith("/admin-worker/management")) ||
    (role === "department-head" && path.startsWith("/department-head/management")) ||
    (role === "manager" && path.startsWith("/manager/cabinet")) ||
    (role === "executor" && path.startsWith("/executor/management")) ||
    path.startsWith("/client/news") ||
    path.startsWith("/client/statistics") ||
    path.startsWith("/client/smart-home") ||
    path.startsWith("/executor/statistics") ||
    path.startsWith("/manager/statistics");

  if (isHomePath) return "home";
  if (path === bookingHref || path.startsWith("/meeting-rooms")) return "booking";
  if (
    path === requestsHref ||
    path === "/requests" ||
    path.startsWith("/client/requests") ||
    path === "/create-request" ||
    path.startsWith("/admin-worker/requests") ||
    path.startsWith("/department-head/requests") ||
    path.startsWith("/executor/requests") ||
    path.startsWith("/manager/requests")
  ) {
    return "requests";
  }
  if (
    path === helpHref ||
    path.startsWith("/chat-bot") ||
    path.startsWith("/admin-worker/messages") ||
    path.startsWith("/manager/messages")
  ) {
    return "help";
  }
  if (
    path === profileHref ||
    path.startsWith("/profile") ||
    path.startsWith("/department-head/profile") ||
    path.startsWith("/admin-worker/profile") ||
    path.startsWith("/manager/profile")
  ) {
    return "profile";
  }

  return undefined;
}

function isBookingPath(path: string): boolean {
  return path === "/meeting-rooms" || path.startsWith("/meeting-rooms/");
}

export interface ShouldHideBottomNavOptions {
  hideBookingForm?: boolean;
  forceHidden?: boolean;
}

export function shouldHideBottomNav(
  pathname: string | null | undefined,
  options: ShouldHideBottomNavOptions = {}
): boolean {
  if (options.forceHidden) return true;

  const path = pathname?.split("?")[0] || "";

  if (isBottomNavHiddenPath(path)) return true;
  if (isBookingPath(path) && options.hideBookingForm) return true;

  return false;
}

export function getBottomNavBottomPadding(): string {
  return `max(env(safe-area-inset-bottom, 0px), ${BOTTOM_NAV_MIN_BOTTOM_PAD}px)`;
}

export function getBottomNavPadding(): string {
  return `calc(${BOTTOM_NAV_ROW_HEIGHT}px + ${getBottomNavBottomPadding()})`;
}

export function getBottomNavPaddingOrZero(
  pathname: string | null | undefined,
  options: ShouldHideBottomNavOptions = {}
): string | undefined {
  return shouldHideBottomNav(pathname, options) ? undefined : getBottomNavPadding();
}

/** Статическая строка для CSS — дублирует getBottomNavPadding(), без runtime-вызова при import. */
export const MOBILE_BOTTOM_NAV_PADDING = getBottomNavPadding();
