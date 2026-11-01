"use client";

import { useIsDesktop } from "@/hooks/use-media-query";
import { useClientNewsPage } from "@/hooks/use-client-news-page";
import { useClientSurveys } from "@/hooks/use-client-surveys";
import { useNewsSection } from "@/hooks/use-news-section";
import { useAuthStore } from "@/stores/useAuthStore";
import { ClientNewsDesktopView } from "./client-news-desktop-view";
import { ClientNewsMobileView } from "./client-news-mobile-view";
import type { NewsSurveysTab } from "./news-section-tabs";

export function ClientNewsView() {
  const isDesktop = useIsDesktop();
  const state = useClientNewsPage();
  const token = useAuthStore((s) => s.token);
  const isGuest = useAuthStore((s) => s.isGuest);
  // Surveys are for a signed-in client: a guest sees the news without the tabs.
  const signedIn = Boolean(token) && !isGuest;
  const { section, setSection } = useNewsSection();
  const surveys = useClientSurveys({ enabled: signedIn });
  const surveysTab: NewsSurveysTab | null = signedIn ? { section, onSectionChange: setSection, surveys } : null;

  if (isDesktop) {
    return <ClientNewsDesktopView {...state} surveysTab={surveysTab} />;
  }

  return <ClientNewsMobileView {...state} surveysTab={surveysTab} />;
}
