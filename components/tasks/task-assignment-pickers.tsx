"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, Search, UserX, Users, X } from "lucide-react";
import { useThemeColor } from "@/hooks/use-theme-color";
import { searchUsersForAssign, type UserSearchItem } from "@/lib/user-search";
import type { Team } from "@/lib/teams-api";

export function collectTeamMemberOptions(
  team:
    | Team
    | { leader?: { id: number; full_name: string } | null; members?: { id: number; full_name: string }[] }
    | null
    | undefined,
): { id: number; full_name: string }[] {
  if (!team) return [];
  const map = new Map<number, { id: number; full_name: string }>();
  if (team.leader) map.set(team.leader.id, { id: team.leader.id, full_name: team.leader.full_name });
  for (const m of team.members ?? []) {
    if (!map.has(m.id)) map.set(m.id, { id: m.id, full_name: m.full_name });
  }
  return Array.from(map.values()).sort((a, b) => a.full_name.localeCompare(b.full_name, "ru"));
}

type TeamPickerProps = {
  visible: boolean;
  onClose: () => void;
  teams: Team[];
  loading: boolean;
  selectedTeamId: number | null;
  onSelect: (teamId: number | null) => void;
};

export function TaskTeamPickerOverlay({
  visible,
  onClose,
  teams,
  loading,
  selectedTeamId,
  onSelect,
}: TeamPickerProps) {
  const background = useThemeColor("background");
  const text = useThemeColor("text");
  const textMuted = useThemeColor("textMuted");
  const primary = useThemeColor("primary");
  const border = useThemeColor("border");

  const pick = useCallback(
    (id: number | null) => {
      onSelect(id);
      onClose();
    },
    [onSelect, onClose],
  );

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      <button type="button" className="absolute inset-0 bg-black/45" onClick={onClose} aria-label="Закрыть" />
      <div
        className="relative rounded-t-2xl max-h-[85vh] flex flex-col"
        style={{ backgroundColor: background }}
      >
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: primary }} />
        </div>
        <div className="flex items-center justify-between px-4 py-2">
          <button type="button" onClick={onClose} className="p-2 min-h-11 min-w-11" aria-label="Закрыть">
            <X className="h-6 w-6" style={{ color: text }} />
          </button>
          <span className="text-lg font-semibold" style={{ color: text }}>
            Команда
          </span>
          <button type="button" onClick={onClose} className="p-2 min-h-11 min-w-11" aria-label="Готово">
            <Check className="h-6 w-6" style={{ color: primary }} />
          </button>
        </div>

        <div className="overflow-y-auto px-4 pb-8">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: primary }} />
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => pick(null)}
                className="w-full flex items-center gap-3 py-3 border-b min-h-11"
                style={{ borderColor: border }}
              >
                <UserX className="h-5 w-5" style={{ color: textMuted }} />
                <span className="flex-1 text-left" style={{ color: text }}>
                  Без команды
                </span>
                {selectedTeamId == null ? <Check className="h-5 w-5" style={{ color: primary }} /> : null}
              </button>

              {teams.length === 0 ? (
                <p className="py-6 text-sm text-center" style={{ color: textMuted }}>
                  Пока нет команд. Создайте команду через панель «Команды» во Входящих.
                </p>
              ) : (
                teams.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => pick(t.id)}
                    className="w-full flex items-center gap-3 py-3 border-b min-h-11"
                    style={{ borderColor: border }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${primary}22` }}
                    >
                      <Users className="h-5 w-5" style={{ color: primary }} />
                    </div>
                    <span className="flex-1 text-left truncate" style={{ color: text }}>
                      {t.name}
                    </span>
                    {selectedTeamId === t.id ? (
                      <Check className="h-5 w-5 shrink-0" style={{ color: primary }} />
                    ) : null}
                  </button>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

type ExecutorPickerProps = {
  visible: boolean;
  onClose: () => void;
  teamScope: boolean;
  team: Team | null;
  teamLoading?: boolean;
  selectedExecutor: { id: number; full_name: string } | null;
  onSelect: (executor: { id: number; full_name: string } | null) => void;
};

export function TaskExecutorPickerOverlay({
  visible,
  onClose,
  team,
  teamScope,
  teamLoading = false,
  selectedExecutor,
  onSelect,
}: ExecutorPickerProps) {
  const background = useThemeColor("background");
  const text = useThemeColor("text");
  const textMuted = useThemeColor("textMuted");
  const primary = useThemeColor("primary");
  const border = useThemeColor("border");
  const cardBg = useThemeColor("cardBackground");

  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<UserSearchItem[]>([]);

  const teamMode = teamScope && team != null;
  const teamPending = teamScope && team == null && teamLoading;
  const teamMissing = teamScope && team == null && !teamLoading;
  const memberOptions = collectTeamMemberOptions(team ?? undefined);

  useEffect(() => {
    if (!visible) {
      setSearch("");
      setResults([]);
      setSearching(false);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || teamMode) return;
    const q = search.trim();
    if (q.length < 1) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      const res = await searchUsersForAssign(q);
      setSearching(false);
      if (res.ok) setResults(res.data);
      else setResults([]);
    }, 300);
    return () => clearTimeout(t);
  }, [search, visible, teamMode]);

  const pick = useCallback(
    (executor: { id: number; full_name: string } | null) => {
      onSelect(executor);
      onClose();
    },
    [onSelect, onClose],
  );

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      <button type="button" className="absolute inset-0 bg-black/45" onClick={onClose} aria-label="Закрыть" />
      <div
        className="relative rounded-t-2xl max-h-[85vh] flex flex-col"
        style={{ backgroundColor: background }}
      >
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: primary }} />
        </div>
        <div className="flex items-center justify-between px-4 py-2">
          <button type="button" onClick={onClose} className="p-2 min-h-11 min-w-11" aria-label="Закрыть">
            <X className="h-6 w-6" style={{ color: text }} />
          </button>
          <span className="text-lg font-semibold" style={{ color: text }}>
            Исполнитель
          </span>
          <button
            type="button"
            onClick={() => pick(selectedExecutor)}
            className="p-2 min-h-11 min-w-11"
            aria-label="Готово"
          >
            <Check className="h-6 w-6" style={{ color: primary }} />
          </button>
        </div>

        <div className="overflow-y-auto px-4 pb-8 max-h-[60vh]">
          <button
            type="button"
            onClick={() => pick(null)}
            className="w-full flex items-center gap-3 py-3 border-b min-h-11"
            style={{ borderColor: border }}
          >
            <UserX className="h-5 w-5" style={{ color: textMuted }} />
            <span className="flex-1 text-left" style={{ color: text }}>
              Без исполнителя
            </span>
            {selectedExecutor == null ? <Check className="h-5 w-5" style={{ color: primary }} /> : null}
          </button>

          {teamPending ? (
            <div className="flex flex-col items-center py-12 gap-2">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: primary }} />
              <span className="text-sm" style={{ color: textMuted }}>
                Загрузка команды…
              </span>
            </div>
          ) : teamMissing ? (
            <p className="py-6 text-sm text-center" style={{ color: textMuted }}>
              Команда не найдена. Закройте окно и выберите команду снова.
            </p>
          ) : teamMode ? (
            memberOptions.length === 0 ? (
              <p className="py-6 text-sm text-center" style={{ color: textMuted }}>
                В команде нет участников. Добавьте их в настройках команды.
              </p>
            ) : (
              memberOptions.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => pick(m)}
                  className="w-full flex items-center gap-3 py-3 border-b min-h-11"
                  style={{ borderColor: border }}
                >
                  <span className="flex-1 text-left truncate" style={{ color: text }}>
                    {m.full_name}
                  </span>
                  {selectedExecutor?.id === m.id ? (
                    <Check className="h-5 w-5 shrink-0" style={{ color: primary }} />
                  ) : null}
                </button>
              ))
            )
          ) : (
            <>
              <div
                className="flex items-center gap-2 rounded-xl border px-3 py-2 my-2"
                style={{ backgroundColor: cardBg, borderColor: border }}
              >
                <Search className="h-5 w-5 shrink-0" style={{ color: textMuted }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Имя или телефон"
                  className="flex-1 bg-transparent outline-none text-base min-h-10"
                  style={{ color: text }}
                />
              </div>
              {searching ? (
                <p className="text-sm py-2" style={{ color: textMuted }}>
                  Поиск…
                </p>
              ) : null}
              {results.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => pick({ id: u.id, full_name: u.full_name })}
                  className="w-full flex items-center gap-3 py-3 border-b min-h-11"
                  style={{ borderColor: border }}
                >
                  <span className="flex-1 text-left truncate" style={{ color: text }}>
                    {u.full_name}
                  </span>
                  {selectedExecutor?.id === u.id ? (
                    <Check className="h-5 w-5 shrink-0" style={{ color: primary }} />
                  ) : null}
                </button>
              ))}
              {search.trim().length >= 1 && !searching && results.length === 0 ? (
                <p className="text-sm py-2" style={{ color: textMuted }}>
                  Никого не найдено
                </p>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
