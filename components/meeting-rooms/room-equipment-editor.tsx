"use client";

import { useEffect, useId, useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { EquipmentIcon } from "@/components/meeting-rooms/booking-flow/equipment-chips";
import { getMeetingRoomEquipmentCatalog } from "@/lib/api";
import { EQUIPMENT_CUSTOM_MAX, EQUIPMENT_PRESETS, isPresetEquipment } from "@/lib/booking-flow";
import { cn } from "@/lib/utils";

const norm = (value: string) => value.replace(/\s+/g, " ").trim();
const key = (value: string) => norm(value).toLowerCase();

/**
 * Оборудование переговорной: готовые пункты отмечаются нажатием, свои — добавляются, меняются и
 * удаляются. Набор хранится у комнаты; новые названия бэкенд добавляет в общий справочник, а при вводе
 * подсказываются названия из справочника (оборудование других переговорных).
 */
export function RoomEquipmentEditor({
  value,
  onChange,
  dark,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  dark: boolean;
}) {
  const listId = useId();
  const [catalog, setCatalog] = useState<string[]>([]);
  const [draft, setDraft] = useState<{ index: number | null; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMeetingRoomEquipmentCatalog()
      .then((res) => {
        if (!cancelled) setCatalog((res.data ?? []).map((item) => item.name));
      })
      // Справочник доступен Администратору и Руководителю; без него остаются готовые пункты и ручной ввод.
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = new Set(value.map(key));
  const custom = value.filter((name) => !isPresetEquipment(name));
  const suggestions = catalog.filter((name) => !isPresetEquipment(name) && !selected.has(key(name)));

  const togglePreset = (name: string) => {
    onChange(selected.has(key(name)) ? value.filter((v) => key(v) !== key(name)) : [...value, name]);
  };

  const draftText = draft ? norm(draft.text) : "";
  const editingOriginal = draft?.index != null ? custom[draft.index] : null;
  const draftError = !draft
    ? null
    : !draftText
      ? "Введите название"
      : isPresetEquipment(draftText)
        ? `«${draftText}» уже есть в готовом списке`
        : value.some((v) => key(v) === key(draftText) && (!editingOriginal || key(v) !== key(editingOriginal)))
          ? `«${draftText}» уже добавлено`
          : null;

  const saveDraft = () => {
    if (!draft || draftError) return;
    // Если название есть в справочнике — берём его написание.
    const canonical = catalog.find((name) => key(name) === key(draftText)) ?? draftText;
    if (editingOriginal) {
      onChange(value.map((v) => (v === editingOriginal ? canonical : v)));
    } else {
      onChange([...value, canonical]);
    }
    setDraft(null);
  };

  const removeCustom = (name: string) => {
    onChange(value.filter((v) => v !== name));
    setDraft(null);
  };

  const chipIdle = dark ? "border-white/15 bg-[#2C2C2E] text-white/80 hover:bg-[#3A3A3C]" : "border-border bg-muted text-foreground";
  const chipOn = "border-[#E85D2B] bg-[#E85D2B]/15 text-white";
  const rowBg = dark ? "bg-[#111113]" : "bg-muted";
  const muted = dark ? "text-gray-400" : "text-muted-foreground";

  return (
    <div className="space-y-3">
      <p className={cn("text-xs", muted)}>Нажмите, чтобы отметить. Клиенты видят отмеченное перед бронью.</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Готовые пункты оборудования">
        {EQUIPMENT_PRESETS.map((name) => {
          const on = selected.has(key(name));
          return (
            <button
              key={name}
              type="button"
              aria-pressed={on}
              onClick={() => togglePreset(name)}
              className={cn("inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm transition-colors", on ? chipOn : chipIdle)}
            >
              <EquipmentIcon name={name} className={cn("h-4 w-4", on ? "text-[#FF8A5B]" : "opacity-70")} />
              {name}
            </button>
          );
        })}
      </div>

      <div>
        <p className={cn("mb-2 text-xs", muted)}>Своё</p>
        <ul className="space-y-2">
          {custom.map((name, index) =>
            draft?.index === index ? null : (
              <li key={name} className={cn("flex items-center gap-2 rounded-xl px-3 py-2.5", rowBg)}>
                <EquipmentIcon name={name} className="h-4 w-4 shrink-0 text-[#E85D2B]" />
                <span className="min-w-0 flex-1 truncate text-sm">{name}</span>
                <button
                  type="button"
                  onClick={() => setDraft({ index, text: name })}
                  aria-label={`Изменить «${name}»`}
                  className="rounded-md p-1 text-white/70 hover:bg-white/10 hover:text-white"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => removeCustom(name)}
                  aria-label={`Удалить «${name}»`}
                  className="rounded-md p-1 text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ),
          )}
        </ul>

        {draft ? (
          <div className={cn("mt-2 rounded-xl p-3", rowBg)}>
            <div className="flex items-center gap-2">
              <input
                value={draft.text}
                onChange={(event) => setDraft({ ...draft, text: event.target.value.slice(0, EQUIPMENT_CUSTOM_MAX) })}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    saveDraft();
                  }
                  if (event.key === "Escape") {
                    event.stopPropagation();
                    setDraft(null);
                  }
                }}
                list={listId}
                autoFocus
                placeholder="Например, Кофемашина"
                aria-label="Название пункта оборудования"
                aria-invalid={!!draftError && draftText.length > 0}
                className={cn(
                  "h-10 min-w-0 flex-1 rounded-lg border px-3 text-sm outline-none",
                  dark ? "border-white/15 bg-[#2C2C2E] text-white focus:border-[#E85D2B]" : "border-border",
                )}
              />
              <button
                type="button"
                onClick={saveDraft}
                disabled={!!draftError}
                aria-label="Сохранить пункт"
                className="rounded-lg bg-[#E85D2B] p-2 text-white disabled:opacity-40"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setDraft(null)}
                aria-label="Отменить"
                className="rounded-lg p-2 text-white/70 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <datalist id={listId}>
              {suggestions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
            <div className="mt-1.5 flex justify-between gap-2 text-xs">
              <span className={draftError && draftText ? "text-red-400" : muted}>
                {draftError && draftText ? draftError : "Клиенты увидят пункт в карточке комнаты"}
              </span>
              <span className={muted}>
                {draft.text.length} / {EQUIPMENT_CUSTOM_MAX}
              </span>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setDraft({ index: null, text: "" })}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#E85D2B]/60 py-2.5 text-sm font-medium text-[#FF8A5B] hover:bg-[#E85D2B]/10"
          >
            <Plus className="h-4 w-4" /> Добавить своё
          </button>
        )}
      </div>
    </div>
  );
}
