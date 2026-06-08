"use client";

import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { DesktopContentPage } from "@/components/layout/desktop-content-page";
import { NewsReactionsRow } from "@/components/news/news-reactions-row";
import { formatNewsDisplayDate } from "@/constants/news-filters";
import { useClientNewsDetailPage } from "@/hooks/use-client-news-page";
import { recordNewsView } from "@/lib/news-api";
import { emptyReactionCounts } from "@/lib/news-reactions";
import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect } from "react";

interface ClientNewsDetailDesktopViewProps {
  newsId: string;
}

export function ClientNewsDetailDesktopView({ newsId }: ClientNewsDetailDesktopViewProps) {
  const token = useAuthStore((s) => s.token);
  const isGuest = useAuthStore((s) => s.isGuest);
  const canReact = Boolean(token) && !isGuest;
  const { loading, error, item, setItem } = useClientNewsDetailPage(newsId);
  const numericNewsId = Number(newsId);

  useEffect(() => {
    if (!Number.isFinite(numericNewsId) || !canReact) return;
    void recordNewsView(numericNewsId);
  }, [numericNewsId, canReact]);

  return (
    <DesktopContentPage
      title="Новость"
      dark
      actions={
        <Link
          href="/client/news"
          className="inline-flex items-center gap-2 text-sm text-[#E85D2B] hover:text-[#F35713]"
        >
          <ArrowLeft className="h-4 w-4" />
          К списку
        </Link>
      }
    >
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-[#F35713]" />
        </div>
      ) : error || !item ? (
        <p className="text-center text-[#8E8E93] py-12">{error ?? "Новость не найдена"}</p>
      ) : (
        <article className="max-w-3xl">
          {item.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.image}
              alt=""
              className="w-full max-h-[400px] object-cover rounded-2xl mb-6"
            />
          ) : null}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-[#E85D2B]/20 text-[#E85D2B]">
              {item.tag}
            </span>
            {item.date ? (
              <span className="text-sm text-[#8E8E93]">{formatNewsDisplayDate(item.date)}</span>
            ) : null}
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">{item.title}</h2>
          <p className="text-white/90 text-base leading-relaxed whitespace-pre-wrap mb-6">
            {item.content ?? item.desc}
          </p>
          <NewsReactionsRow
            newsId={numericNewsId}
            reactionCounts={item.reaction_counts ?? emptyReactionCounts()}
            myReaction={item.my_reaction ?? null}
            canInteract={canReact}
            onUpdated={(patch) =>
              setItem((prev) =>
                prev
                  ? {
                      ...prev,
                      reaction_counts: patch.reaction_counts ?? prev.reaction_counts,
                      my_reaction: patch.my_reaction ?? prev.my_reaction,
                    }
                  : prev,
              )
            }
          />
        </article>
      )}
    </DesktopContentPage>
  );
}
