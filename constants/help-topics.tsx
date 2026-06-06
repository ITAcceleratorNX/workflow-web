import {
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  Home,
  Ruler,
  User,
  Wrench,
} from "lucide-react";
import type { ReactNode } from "react";

export type HelpTopic = {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  questions: string[];
};

/** Parity с workflow-mobile app/(tabs)/help/index.tsx TOPICS */
export const HELP_TOPICS: HelpTopic[] = [
  {
    id: "booking",
    title: "Бронирование комнат",
    description: "Найти и забронировать переговорную или кабинет",
    icon: <Building2 className="w-5 h-5" />,
    questions: [
      "Как забронировать комнату?",
      "Как изменить или отменить бронь?",
      "Почему комната недоступна?",
      "Где посмотреть мои бронирования?",
      "Что происходит, если я опоздал?",
    ],
  },
  {
    id: "requests",
    title: "Сервисные заявки",
    description: "Админ, Клининг, Техника — сервисные заявки",
    icon: <Wrench className="w-5 h-5" />,
    questions: [
      "Как создать заявку?",
      "Какие типы заявок доступны?",
      "Как прикрепить фото?",
      "Как посмотреть статус?",
      "Кто обрабатывает заявку?",
    ],
  },
  {
    id: "calculator",
    title: "Калькулятор высоты стола",
    description:
      "Полный расчёт — экран «Высота рабочего стола». В «Шаги» → Настройки блок «Умный стол» показывает высоты без перехода.",
    icon: <Ruler className="w-5 h-5" />,
    questions: [
      "Как работает калькулятор?",
      "Нужно ли вводить вес?",
      "В чём разница «сидя» / «стоя»?",
      "Насколько точны рекомендации?",
    ],
  },
  {
    id: "health",
    title: "Хелси-уведомления",
    description: "Напоминания встать, пройтись и сделать перерыв",
    icon: <Bell className="w-5 h-5" />,
    questions: [
      "Почему пришло уведомление «пора встать»?",
      "Как выбрать тайминг?",
      "Как включить / выключить уведомления?",
      "Работают ли уведомления во время встреч?",
      "Где посмотреть историю уведомлений?",
    ],
  },
  {
    id: "smart-home",
    title: "Умный офис",
    description: "Свет, климат и другие устройства вашего кабинета или переговорной",
    icon: <Home className="w-5 h-5" />,
    questions: [
      "Что такое «умный офис» в WorkFlow?",
      "Какие устройства я могу управлять?",
      "Почему у меня есть / нет доступа?",
      "В каких кабинетах мне доступно управление?",
      "Что делать, если устройство не отвечает?",
    ],
  },
  {
    id: "statistics",
    title: "Статистика",
    description: "Загрузка комнат, активность, отчёты",
    icon: <BarChart3 className="w-5 h-5" />,
    questions: [
      "Какие данные доступны?",
      "За какой период?",
      "Что означают показатели?",
      "Можно ли выгрузить отчёт?",
    ],
  },
  {
    id: "errors",
    title: "Ошибки и поддержка",
    description: "Ошибки, инструкции, вопросы по работе системы",
    icon: <AlertTriangle className="w-5 h-5" />,
    questions: [
      "Ошибка сервера — что делать?",
      "Не работает бронирование",
      "Нет доступа к умному офису",
      "Не приходят уведомления",
      "Куда обратиться за помощью?",
    ],
  },
  {
    id: "profile",
    title: "Профиль и доступы",
    description: "Настройки, роли, доступы к офисам",
    icon: <User className="w-5 h-5" />,
    questions: [
      "Где изменить данные профиля?",
      "Как работают мои доступы?",
      "Почему у меня ограниченные права?",
      "Кто может изменить мои доступы?",
    ],
  },
];

export const HELP_INITIAL_BOT_MESSAGE = "Выберите, с чем хотите работать 👉";

export type SupportTicketStatus = "open" | "in_progress" | "closed";

export function ticketStatusLabel(status: SupportTicketStatus): string {
  if (status === "closed") return "Закрыт";
  if (status === "in_progress") return "В работе";
  return "Открыт";
}
