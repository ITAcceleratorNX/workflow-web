/**
 * Публичные данные сайта для поиска и превью ссылок.
 * Приложение живёт на app.tmk-workflow.kz (NEXT_PUBLIC_SITE_URL), лендинг компании — на
 * tmk-workflow.kz. На других адресах приложения (копии на vercel и т. п.) индексация
 * закрыта, чтобы поиск не делил сайт на дубли.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://app.tmk-workflow.kz").replace(/\/+$/, "");

/** Лендинг компании: ссылка на него связывает приложение и лендинг для поиска. */
export const LANDING_URL = "https://tmk-workflow.kz";

export const SITE_HOST = new URL(SITE_URL).host;

export const SITE_NAME = "Workflow";

export const SITE_TITLE = "Workflow — заявки на обслуживание офиса";

export const SITE_DESCRIPTION =
  "Workflow от TMK Techno Horizon — сервис заявок на уборку, ремонт и обслуживание офисных зданий: " +
  "создание заявок, назначение исполнителей, контроль сроков и бронирование переговорных.";

/** Публичные страницы, которые можно индексировать. Остальное — кабинеты после входа. */
export const PUBLIC_PATHS = ["/", "/login", "/register", "/privacy"] as const;

/** Разделы кабинетов: поиску в них делать нечего, без входа там только редирект. */
export const PRIVATE_PATH_PREFIXES = [
  "/admin-worker",
  "/booking",
  "/change-password",
  "/chat-bot",
  "/client",
  "/confirm",
  "/create-request",
  "/department-head",
  "/dev",
  "/executor",
  "/header",
  "/manager",
  "/map",
  "/meeting-rooms",
  "/notifications",
  "/profile",
  "/r/",
  "/requests",
  "/reset-password",
  "/settings",
] as const;
