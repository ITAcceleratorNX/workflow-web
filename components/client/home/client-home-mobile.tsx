"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Bell, Heart, Home, Sparkles } from "lucide-react";
import PullToRefresh from "@/components/pull-to-refresh";
import { TasksTodayCard } from "@/components/tasks/tasks-today-card";
import type { UseClientHomeResult } from "@/hooks/use-client-home";
import { useClientHomeNews } from "@/hooks/use-client-home-news";
import type { NewsDisplayItem } from "@/lib/news-api";

type ClientHomeMobileProps = UseClientHomeResult;

function NewsCarousel({ items, loading }: { items: NewsDisplayItem[]; loading: boolean }) {
  const router = useRouter();

  if (loading && items.length === 0) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="min-w-[85vw] max-w-[320px] h-[260px] rounded-2xl bg-[#2C2C2E] animate-pulse shrink-0"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
      {items.slice(0, 5).map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => router.push(`/client/news/${item.id}`)}
          className="min-w-[85vw] max-w-[320px] shrink-0 snap-start text-left rounded-2xl overflow-hidden bg-[#2C2C2E] border border-[#3A3A3C]"
        >
          <div className="relative h-[180px] bg-[#1C1C1E]">
            {item.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-[#E85D2B]/60" />
              </div>
            )}
            <div className="absolute top-3 left-3">
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-black/50 text-white">
                {item.tag}
              </span>
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12">
              <p className="text-white font-semibold text-base leading-tight line-clamp-2">
                {item.title}
              </p>
              <p className="text-white/80 text-sm mt-1 line-clamp-2">{item.desc}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

/** Mobile home — parity с workflow-mobile `(tabs)/index.tsx` (client). */
export function ClientHomeMobile({ handleRefresh }: ClientHomeMobileProps) {
  const router = useRouter();
  const { items, loading, refreshNews } = useClientHomeNews();

  const onRefresh = async () => {
    await Promise.all([handleRefresh(), refreshNews()]);
  };

  return (
    <>
      <PullToRefresh onRefresh={onRefresh}>
        <div className="min-h-screen px-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="mb-4">
            <div className="flex items-center justify-between gap-3 mb-2">
              <h1 className="text-2xl font-bold text-foreground">Обзор дня</h1>
              <Link
                href="/notifications"
                className="relative p-2 rounded-full hover:bg-muted/50 transition-colors"
                aria-label="Уведомления"
              >
                <Bell className="w-6 h-6 text-foreground" />
              </Link>
            </div>
            <Link
              href="/client/news"
              className="inline-flex items-center gap-1 text-[#E85D2B] font-medium text-sm"
            >
              Все новости
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <NewsCarousel items={items} loading={loading} />

          <section className="mt-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Smart Control</h2>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/client/smart-home"
                className="rounded-2xl bg-card border border-border p-4 flex flex-col gap-3 active:scale-[0.98] transition-transform"
              >
                <div className="w-12 h-12 rounded-xl bg-[#E85D2B]/20 flex items-center justify-center">
                  <Home className="w-7 h-7 text-[#E85D2B]" />
                </div>
                <span className="text-sm font-medium text-foreground leading-snug">
                  Управление умным офисом
                </span>
              </Link>
              <Link
                href="/client/health"
                className="rounded-2xl bg-card border border-border p-4 flex flex-col gap-3 active:scale-[0.98] transition-transform"
              >
                <div className="w-12 h-12 rounded-xl bg-[#60A5FA]/20 flex items-center justify-center">
                  <Heart className="w-7 h-7 text-[#60A5FA]" />
                </div>
                <span className="text-sm font-medium text-foreground leading-snug">Health трекер</span>
              </Link>
            </div>
          </section>

          <section className="mt-6 pb-4">
            <h2 className="text-xl font-bold text-foreground mb-4">Задачи</h2>
            <TasksTodayCard onPress={() => router.push("/client/tasks?tab=today")} />
          </section>
        </div>
      </PullToRefresh>
    </>
  );
}
