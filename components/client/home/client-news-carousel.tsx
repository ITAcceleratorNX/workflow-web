"use client";

import { useRouter } from "next/navigation";
import type { NewsDisplayItem } from "@/lib/news-api";
import { Sparkles } from "lucide-react";

type ClientNewsCarouselProps = {
  items: NewsDisplayItem[];
  loading: boolean;
  variant?: "mobile" | "desktop";
};

/** Shared news carousel for client home (mobile + desktop). */
export function ClientNewsCarousel({
  items,
  loading,
  variant = "mobile",
}: ClientNewsCarouselProps) {
  const router = useRouter();
  const isDesktop = variant === "desktop";

  if (loading && items.length === 0) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`shrink-0 rounded-2xl bg-[#2C2C2E] animate-pulse ${
              isDesktop ? "w-[280px] h-[220px]" : "min-w-[85vw] max-w-[320px] h-[260px]"
            }`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
      {items.slice(0, isDesktop ? 8 : 5).map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => router.push(`/client/news/${item.id}`)}
          className={`shrink-0 snap-start text-left rounded-2xl overflow-hidden bg-[#2C2C2E] border border-[#3A3A3C] hover:border-[#E85D2B]/40 transition-colors ${
            isDesktop ? "w-[280px]" : "min-w-[85vw] max-w-[320px]"
          }`}
        >
          <div className="relative h-[160px] bg-[#1C1C1E]">
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
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-10">
              <p className="text-white font-semibold text-sm leading-tight line-clamp-2">
                {item.title}
              </p>
              <p className="text-white/80 text-xs mt-1 line-clamp-2">{item.desc}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
