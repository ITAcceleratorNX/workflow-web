import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BellRing, CalendarClock, ClipboardList, UsersRound } from "lucide-react";
import {
  HOME_REDIRECT_ATTR,
  HOME_REDIRECT_INIT_SCRIPT,
  HomeRedirect,
} from "@/components/home/home-redirect";
import { LANDING_URL, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: SITE_TITLE },
  alternates: { canonical: "/" },
};

const FEATURES = [
  {
    icon: ClipboardList,
    title: "Заявки на обслуживание",
    text: "Уборка, ремонт и техническое обслуживание офиса — заявка с фото и местом за минуту.",
  },
  {
    icon: UsersRound,
    title: "Назначение исполнителей",
    text: "Офис-менеджер распределяет заявки, исполнители видят свои задачи и сроки.",
  },
  {
    icon: CalendarClock,
    title: "Бронирование переговорных",
    text: "Свободные переговорные и время — в одном расписании для всего офиса.",
  },
  {
    icon: BellRing,
    title: "Уведомления о статусе",
    text: "Сотрудник узнаёт, когда заявку приняли, взяли в работу и выполнили.",
  },
] as const;

/** Структурированные данные: поиск понимает, что это за сервис и кто его делает. */
const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web, iOS, Android",
  inLanguage: "ru",
  publisher: { "@type": "Organization", name: "TMK Techno Horizon", url: LANDING_URL },
};

/**
 * Главная отдаётся с сервера, чтобы поиск видел текст о сервисе. Вошедших пользователей
 * HomeRedirect сразу ведёт в их раздел, как и раньше.
 */
export default function Home() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: HOME_REDIRECT_INIT_SCRIPT }} />
      <style>{`html[${HOME_REDIRECT_ATTR}] .home-landing{visibility:hidden}`}</style>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <HomeRedirect />

      <main className="home-landing min-h-screen bg-[#040404] text-white">
        <div className="mx-auto flex min-h-screen w-full max-w-[960px] flex-col px-5 pb-10 pt-[max(48px,env(safe-area-inset-top))] md:pt-[12vh]">
          <header className="flex items-center gap-3">
            <Image
              src="/app-icon.png"
              alt=""
              width={44}
              height={44}
              className="rounded-xl bg-white"
              priority
            />
            <span className="text-xl font-semibold">{SITE_NAME}</span>
          </header>

          <section className="mt-12 max-w-[640px] md:mt-16">
            <h1 className="text-[32px] font-semibold leading-[40px] md:text-[44px] md:leading-[52px]">
              Заявки на обслуживание офиса в одном приложении
            </h1>
            <p className="mt-4 text-lg leading-[26px] text-[#9A9A9A]">{SITE_DESCRIPTION}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="flex h-14 items-center justify-center rounded-2xl bg-[#F35713] px-8 text-base font-semibold text-white active:opacity-90"
              >
                Войти
              </Link>
              <Link
                href="/register"
                className="flex h-14 items-center justify-center rounded-2xl border border-white/15 px-8 text-base font-semibold text-white active:opacity-90"
              >
                Регистрация
              </Link>
            </div>
          </section>

          <section aria-label="Возможности" className="mt-14 grid gap-3 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-white/[0.08] bg-[#1C1C1E] p-5">
                <Icon className="h-6 w-6 text-[#F35713]" aria-hidden />
                <h2 className="mt-3 text-base font-semibold">{title}</h2>
                <p className="mt-1 text-sm leading-5 text-[#9A9A9A]">{text}</p>
              </div>
            ))}
          </section>

          <footer className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-12 text-sm text-[#7F7F7F]">
            <span>© TMK Techno Horizon</span>
            <a href={LANDING_URL} className="underline-offset-4 hover:underline">
              О Workflow
            </a>
            <Link href="/privacy" className="underline-offset-4 hover:underline">
              Политика конфиденциальности
            </Link>
          </footer>
        </div>
      </main>
    </>
  );
}
