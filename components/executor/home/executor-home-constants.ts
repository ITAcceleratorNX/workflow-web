import type { LucideIcon } from "lucide-react";
import { BarChart3, QrCode } from "lucide-react";

export type ExecutorCabinetCardKey = "scan-qr" | "statistics";

export interface ExecutorCabinetCard {
  key: ExecutorCabinetCardKey;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  href: string;
}

/** Parity с workflow-mobile EXECUTOR_CABINET_CARDS; href — web routes. */
export const EXECUTOR_CABINET_CARDS: ExecutorCabinetCard[] = [
  {
    key: "scan-qr",
    title: "QR сканер",
    subtitle: "Сканирование QR-кодов бронирования",
    icon: QrCode,
    href: "/executor/management/scan-qr",
  },
  {
    key: "statistics",
    title: "Статистика",
    subtitle: "Мои показатели и рейтинг",
    icon: BarChart3,
    href: "/executor/statistics",
  },
];
