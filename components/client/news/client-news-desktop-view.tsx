"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, Loader2 } from "lucide-react";
import { ClientNewsSearch } from "@/components/client/news/client-news-search";
import { NewsSectionTabs, type NewsSurveysTab } from "@/components/client/news/news-section-tabs";
import { DesktopContentPage } from "@/components/layout/desktop-content-page";
import { NewsListItem } from "@/components/news/news-list-item";
import { NewsReactionsRow } from "@/components/news/news-reactions-row";
import { NewSurveyCallout } from "@/components/surveys/new-survey-callout";
import { SurveyList } from "@/components/surveys/survey-list";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatNewsDisplayDate,
  NEWS_DATE_FILTER_OPTIONS,
  type NewsDateFilter,
} from "@/constants/news-filters";
import type { UseClientNewsPageResult } from "@/hooks/use-client-news-page";
import { emptyReactionCounts } from "@/lib/news-reactions";
import { latestAvailableSurvey } from "@/lib/surveys/list";
import { useAuthStore } from "@/stores/useAuthStore";

type ClientNewsDesktopViewProps = UseClientNewsPageResult & { surveysTab: NewsSurveysTab | null };

/** The «Новости» tab: search, date filter and the feed in two columns. */
function NewsFeed({
  searchQuery,
  setSearchQuery,
  filterDate,
  setFilterDate,
  filteredItems,
  loading,
  patchNewsEngagement,
}: UseClientNewsPageResult) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const isGuest = useAuthStore((s) => s.isGuest);
  const canReact = Boolean(token) && !isGuest;

  return (
    <>
      <ClientNewsSearch value={searchQuery} onChange={setSearchQuery} className="mb-4" />

      <div className="pb-4 border-b border-[#3A3A3C]/60 mb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#8E8E93] min-w-[50px]">Дата</span>
          <Select value={filterDate} onValueChange={(v) => setFilterDate(v as NewsDateFilter)}>
            <SelectTrigger className="flex-1 max-w-xs h-10 bg-[#2C2C2E] border-[#3A3A3C] text-white">
              <SelectValue placeholder="Все даты" />
            </SelectTrigger>
            <SelectContent>
              {NEWS_DATE_FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-[#F35713]" />
          <p className="text-base text-[#8E8E93]">Загрузка...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-12 text-center text-base text-[#8E8E93]">Нет новостей</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filteredItems.map((item) => (
            <NewsListItem
              key={item.id}
              title={item.title}
              tag={item.tag}
              dateLabel={item.date ? formatNewsDisplayDate(item.date) : null}
              description={item.desc}
              imageUrl={item.image}
              onPress={() => router.push(`/client/news/${item.id}`)}
              rightSlot={<ChevronRight className="h-6 w-6 text-[#8E8E93]" />}
              footerSlot={
                <NewsReactionsRow
                  newsId={Number(item.id)}
                  reactionCounts={item.reaction_counts ?? emptyReactionCounts()}
                  myReaction={item.my_reaction ?? null}
                  canInteract={canReact}
                  compact
                  centered
                  onUpdated={(patch) => patchNewsEngagement(item.id, patch)}
                />
              }
            />
          ))}
        </div>
      )}
    </>
  );
}

export function ClientNewsDesktopView({ surveysTab, ...news }: ClientNewsDesktopViewProps) {
  // «Новый опрос» above the news (Figma «Клиент Desktop Новости»); Mobile shows it on the home.
  const newSurvey = surveysTab ? latestAvailableSurvey(surveysTab.surveys.surveys) : null;
  return (
    <DesktopContentPage title="Все новости" dark>
      {surveysTab ? (
        <div className="mb-[18px]">
          <NewsSectionTabs
            layout="desktop"
            value={surveysTab.section}
            onChange={surveysTab.onSectionChange}
            hasAvailableSurveys={surveysTab.surveys.hasAvailable}
          />
        </div>
      ) : null}

      {surveysTab?.section === "surveys" ? (
        <SurveyList layout="desktop" {...surveysTab.surveys} />
      ) : (
        <>
          {newSurvey ? <NewSurveyCallout layout="banner" survey={newSurvey} className="mb-[18px]" /> : null}
          <NewsFeed {...news} />
        </>
      )}
    </DesktopContentPage>
  );
}
