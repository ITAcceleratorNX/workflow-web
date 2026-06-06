"use client";

import { useCallback } from "react";
import { Eye, Flame, Heart, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { setNewsReaction } from "@/lib/news-api";
import {
  NEWS_REACTION_OPTIONS,
  normalizeReactionCounts,
  type NewsReactionCounts,
  type NewsReactionKind,
} from "@/lib/news-reactions";

const ICONS = {
  thumb: ThumbsUp,
  heart: Heart,
  eyes: Eye,
  fire: Flame,
} as const;

interface NewsReactionsRowProps {
  newsId: number;
  reactionCounts: NewsReactionCounts;
  myReaction: NewsReactionKind | null;
  canInteract: boolean;
  compact?: boolean;
  centered?: boolean;
  onUpdated?: (patch: {
    reaction_counts: NewsReactionCounts;
    my_reaction: NewsReactionKind | null;
  }) => void;
}

/** Ряд реакций — parity с workflow-mobile NewsReactionsRow. */
export function NewsReactionsRow({
  newsId,
  reactionCounts,
  myReaction,
  canInteract,
  compact = false,
  centered = false,
  onUpdated,
}: NewsReactionsRowProps) {
  const counts = normalizeReactionCounts(reactionCounts);

  const handleChoose = useCallback(
    async (kind: NewsReactionKind) => {
      if (!canInteract) return;
      const prev = myReaction;
      const prevCounts = { ...counts };

      if (prev !== kind) {
        const optimisticCounts = { ...counts };
        if (prev) optimisticCounts[prev] = Math.max(0, optimisticCounts[prev] - 1);
        optimisticCounts[kind] = optimisticCounts[kind] + 1;
        onUpdated?.({ reaction_counts: optimisticCounts, my_reaction: kind });
      }

      const res = await setNewsReaction(newsId, kind);
      if (res.ok) {
        onUpdated?.({
          reaction_counts: normalizeReactionCounts(res.data.reaction_counts ?? undefined),
          my_reaction: res.data.my_reaction ?? null,
        });
      } else if (prev !== kind) {
        onUpdated?.({ reaction_counts: prevCounts, my_reaction: prev });
      }
    },
    [canInteract, newsId, myReaction, counts, onUpdated],
  );

  return (
    <div
      className={cn(
        "flex items-center py-1",
        compact ? "gap-2.5" : "gap-3.5",
        centered ? "justify-center w-full" : "justify-start",
      )}
    >
      {NEWS_REACTION_OPTIONS.map(({ kind }) => {
        const Icon = ICONS[kind];
        const selected = myReaction === kind;
        return (
          <button
            key={kind}
            type="button"
            disabled={!canInteract}
            onClick={() => void handleChoose(kind)}
            className={cn(
              "min-w-9 flex items-center justify-center transition-opacity",
              !canInteract && "opacity-35",
              canInteract && !selected && "opacity-45 hover:opacity-80",
              selected && "opacity-100 text-[#F35713]",
            )}
          >
            <Icon className={compact ? "h-[22px] w-[22px]" : "h-7 w-7"} />
          </button>
        );
      })}
    </div>
  );
}
