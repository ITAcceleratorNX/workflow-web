"use client";

import { SegmentedControl } from "@/components/ui/segmented-control";
import type { NewsSection } from "@/hooks/use-news-section";

type NewsSectionTabsProps = {
  value: NewsSection;
  onChange: (section: NewsSection) => void;
  /** An open survey the client has not taken: the dot on «Опросы». */
  hasAvailableSurveys?: boolean;
  layout: "mobile" | "desktop";
};

/**
 * «Новости | Опросы» of the client's «Все новости» and the admin's «Управление новостями» (Figma
 * «Все новости: точка на вкладке «Опросы»», «Список после публикации»): the full width on Mobile,
 * by content on Desktop. The dot shows while «Опросы» is not the open tab.
 */
export function NewsSectionTabs({ value, onChange, hasAvailableSurveys = false, layout }: NewsSectionTabsProps) {
  const desktop = layout === "desktop";
  const dot = hasAvailableSurveys && value !== "surveys";
  return (
    <SegmentedControl
      tone="filled"
      fill={!desktop}
      ariaLabel="Раздел новостей"
      value={value}
      onChange={onChange}
      options={[
        { value: "news", label: "Новости" },
        {
          value: "surveys",
          label: (
            <>
              Опросы
              {dot ? <span aria-hidden className="size-2 rounded-full bg-ui-accent" /> : null}
            </>
          ),
          ariaLabel: dot ? "Опросы, есть новый опрос" : undefined,
        },
      ]}
      className={desktop ? "w-fit rounded-[10px] border border-ui-fg/10 bg-ui-raised p-1" : "rounded-[14px] p-1"}
      optionClassName={
        desktop
          ? "min-h-9 rounded-lg px-4 text-sm aria-[checked=false]:font-normal aria-[checked=false]:text-ui-fg/80"
          : "min-h-10 rounded-[10px] text-[15px] font-semibold"
      }
    />
  );
}
