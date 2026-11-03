"use client";

import { SegmentedControl, type SegmentedOption } from "@/components/ui/segmented-control";

type SectionTabsProps<T extends string> = {
  /** Name of the switch for screen readers: «Раздел новостей», «Раздел опроса». */
  ariaLabel: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly SegmentedOption<T>[];
  layout: "mobile" | "desktop";
};

/**
 * Sections of one screen (Figma «Новости | Опросы», «Вопросы | Результаты»): the open one is filled
 * with the accent color; the full width on Mobile, by content on Desktop.
 */
export function SectionTabs<T extends string>({ ariaLabel, value, onChange, options, layout }: SectionTabsProps<T>) {
  const desktop = layout === "desktop";
  return (
    <SegmentedControl
      tone="filled"
      fill={!desktop}
      ariaLabel={ariaLabel}
      value={value}
      onChange={onChange}
      options={options}
      className={desktop ? "w-fit rounded-[10px] border border-ui-fg/10 bg-ui-raised p-1" : "rounded-[14px] p-1"}
      optionClassName={
        desktop
          ? "min-h-9 rounded-lg px-4 text-sm aria-[checked=false]:font-normal aria-[checked=false]:text-ui-fg/80"
          : "min-h-10 rounded-[10px] text-[15px] font-semibold"
      }
    />
  );
}
