"use client";

import { ClipboardList, LayoutGrid, Loader2, Sparkles, Wrench } from "lucide-react";
import {
  getServiceCategoryVisualMeta,
  type ServiceCategoryCardIcon,
} from "@/constants/requests";
import { useThemeColor } from "@/hooks/use-theme-color";

export type ServiceCategoryOption = {
  id: number;
  name: string;
  subcategories?: { id: number; name: string; category_id: number }[];
};

type ServiceCategoryPickerProps = {
  categories: ServiceCategoryOption[];
  selectedId: number;
  onSelect: (category: ServiceCategoryOption) => void;
  loading?: boolean;
  officeName?: string | null;
  emptyHint?: string;
};

function CategoryIcon({ kind }: { kind: ServiceCategoryCardIcon }) {
  const primary = useThemeColor("primary");
  const className = "h-6 w-6";
  switch (kind) {
    case "cleaning-services":
      return <Sparkles className={className} style={{ color: primary }} />;
    case "handyman":
      return <Wrench className={className} style={{ color: primary }} />;
    case "assignment-ind":
      return <ClipboardList className={className} style={{ color: primary }} />;
    default:
      return <LayoutGrid className={className} style={{ color: primary }} />;
  }
}

/** Карточки категорий — parity с workflow-mobile create request step 3. */
export function ServiceCategoryPicker({
  categories,
  selectedId,
  onSelect,
  loading = false,
  officeName,
  emptyHint = "Нет категорий для выбранного офиса",
}: ServiceCategoryPickerProps) {
  const primary = useThemeColor("primary");
  const text = useThemeColor("text");
  const textMuted = useThemeColor("textMuted");
  const cardBg = useThemeColor("cardBackground");
  const border = useThemeColor("border");
  const surfaceMuted = useThemeColor("surfaceMuted");

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: primary }} />
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <p className="text-sm mb-4" style={{ color: textMuted }}>
        {emptyHint}
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      {officeName ? (
        <p className="text-sm mb-2" style={{ color: textMuted }}>
          Категории офиса «{officeName}»
        </p>
      ) : null}
      {categories.map((c) => {
        const selected = selectedId === c.id;
        const meta = getServiceCategoryVisualMeta(c.name);
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c)}
            className="w-full flex items-center gap-3 p-3 rounded-xl border text-left min-h-11 transition-colors"
            style={{
              borderColor: selected ? primary : border,
              backgroundColor: selected ? `${primary}18` : cardBg,
            }}
          >
            <div
              className="w-[52px] h-[52px] rounded-[14px] border flex items-center justify-center shrink-0"
              style={{
                borderColor: selected ? primary : border,
                backgroundColor: surfaceMuted,
              }}
            >
              <CategoryIcon kind={meta.icon} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold truncate" style={{ color: text }}>
                {meta.title}
              </p>
              {meta.description ? (
                <p className="text-[13px] leading-snug mt-0.5 line-clamp-2" style={{ color: textMuted }}>
                  {meta.description}
                </p>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}
