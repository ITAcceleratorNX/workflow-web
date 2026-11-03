"use client";

import { AdminWorkerNewsManagementScreen } from "@/components/admin-worker/news/admin-worker-news-management-screen";
import { NewsSectionTabs } from "@/components/news/news-section-tabs";
import { AdminSurveyList } from "@/components/surveys/admin-survey-list";
import { useNewsSection } from "@/hooks/use-news-section";

type AdminWorkerNewsSectionsProps = {
  layout: "mobile" | "desktop";
  /** The open tab registers its reload for pull-to-refresh. */
  onRegisterRefresh: (refetch: () => Promise<void>) => void;
};

/**
 * «Новости | Опросы» of «Управление новостями» (Figma «Список после публикации»). The tab lives in
 * the address (`?tab=surveys`): back from a survey screen opens the same tab.
 */
export function AdminWorkerNewsSections({ layout, onRegisterRefresh }: AdminWorkerNewsSectionsProps) {
  const { section, setSection } = useNewsSection();
  return (
    <>
      <div className={layout === "desktop" ? "mb-[18px]" : "mb-3.5"}>
        <NewsSectionTabs layout={layout} value={section} onChange={setSection} />
      </div>
      {section === "surveys" ? (
        <AdminSurveyList layout={layout} onRegisterRefresh={onRegisterRefresh} />
      ) : (
        <AdminWorkerNewsManagementScreen onRegisterRefresh={onRegisterRefresh} />
      )}
    </>
  );
}
