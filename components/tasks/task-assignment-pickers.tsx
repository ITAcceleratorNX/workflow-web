"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, Search, UserX, Users } from "lucide-react";
import { TaskPickerShell, type TaskPickerVariant } from "@/components/tasks/task-picker-shell";
import { useTaskPickerTheme } from "@/hooks/use-task-picker-theme";
import { searchUsersForAssign, type UserSearchItem } from "@/lib/user-search";
import type { Team } from "@/lib/teams-api";
import { cn } from "@/lib/utils";

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
  variant?: TaskPickerVariant;
};

export function TaskTeamPickerOverlay({
  visible,
  onClose,
  teams,
  loading,
  selectedTeamId,
  onSelect,
  variant = "sheet",
}: TeamPickerProps) {
  const { text, textMuted, primary, border } = useTaskPickerTheme(variant);
  const isDialog = variant === "dialog";

  const pick = useCallback(
    (id: number | null) => {
      onSelect(id);
      onClose();
    },
    [onSelect, onClose],
  );

  const list = (
    <div className={cn("overflow-y-auto", isDialog ? "px-2 py-2 max-h-[min(60vh,480px)]" : "px-4 pb-8")}>
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: primary }} />
        </div>
      ) : (
        <>
          <PickerRow
            isDialog={isDialog}
            border={border}
            text={text}
            primary={primary}
            selected={selectedTeamId == null}
            onClick={() => pick(null)}
            icon={<UserX className="h-5 w-5" style={{ color: textMuted }} />}
            label="Без команды"
          />

          {teams.length === 0 ? (
            <p className="py-6 text-sm text-center" style={{ color: textMuted }}>
              Пока нет команд. Создайте команду через панель «Команды» во Входящих.
            </p>
          ) : (
            teams.map((t) => (
              <PickerRow
                key={t.id}
                isDialog={isDialog}
                border={border}
                text={text}
                primary={primary}
                selected={selectedTeamId === t.id}
                onClick={() => pick(t.id)}
                icon={
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${primary}22` }}
                  >
                    <Users className="h-5 w-5" style={{ color: primary }} />
                  </div>
                }
                label={t.name}
              />
            ))
          )}
        </>
      )}
    </div>
  );

  return (
    <TaskPickerShell
      open={visible}
      onClose={onClose}
      variant={variant}
      title={isDialog ? "Команда" : undefined}
      maxWidthClass="max-w-md"
    >
      {!isDialog ? (
        <div className="flex items-center justify-center px-4 py-2 shrink-0 border-b" style={{ borderColor: border }}>
          <span className="text-lg font-semibold" style={{ color: text }}>
            Команда
          </span>
        </div>
      ) : null}
      {list}
    </TaskPickerShell>
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
  variant?: TaskPickerVariant;
};

export function TaskExecutorPickerOverlay({
  visible,
  onClose,
  team,
  teamScope,
  teamLoading = false,
  selectedExecutor,
  onSelect,
  variant = "sheet",
}: ExecutorPickerProps) {
  const { text, textMuted, primary, border, cardBg } = useTaskPickerTheme(variant);
  const isDialog = variant === "dialog";

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

  const body = (
    <div className={cn("overflow-y-auto", isDialog ? "px-2 py-2 max-h-[min(60vh,480px)]" : "px-4 pb-8 max-h-[60vh]")}>
      <PickerRow
        isDialog={isDialog}
        border={border}
        text={text}
        primary={primary}
        selected={selectedExecutor == null}
        onClick={() => pick(null)}
        icon={<UserX className="h-5 w-5" style={{ color: textMuted }} />}
        label="Без исполнителя"
      />

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
            <PickerRow
              key={m.id}
              isDialog={isDialog}
              border={border}
              text={text}
              primary={primary}
              selected={selectedExecutor?.id === m.id}
              onClick={() => pick(m)}
              label={m.full_name}
            />
          ))
        )
      ) : (
        <>
          <div
            className={cn(
              "flex items-center gap-2 rounded-xl border px-3 py-2 my-2",
              isDialog && "mx-2",
            )}
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
            <p className="text-sm py-2 px-2" style={{ color: textMuted }}>
              Поиск…
            </p>
          ) : null}
          {results.map((u) => (
            <PickerRow
              key={u.id}
              isDialog={isDialog}
              border={border}
              text={text}
              primary={primary}
              selected={selectedExecutor?.id === u.id}
              onClick={() => pick({ id: u.id, full_name: u.full_name })}
              label={u.full_name}
            />
          ))}
          {search.trim().length >= 1 && !searching && results.length === 0 ? (
            <p className="text-sm py-2 px-2" style={{ color: textMuted }}>
              Никого не найдено
            </p>
          ) : null}
        </>
      )}
    </div>
  );

  return (
    <TaskPickerShell
      open={visible}
      onClose={onClose}
      variant={variant}
      title={isDialog ? "Исполнитель" : undefined}
      maxWidthClass="max-w-md"
    >
      {!isDialog ? (
        <div className="flex items-center justify-between px-4 py-2 shrink-0">
          <button type="button" onClick={onClose} className="p-2 min-h-11 min-w-11 text-sm" style={{ color: textMuted }}>
            Закрыть
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
      ) : null}
      {body}
    </TaskPickerShell>
  );
}

function PickerRow({
  isDialog,
  border,
  text,
  primary,
  selected,
  onClick,
  icon,
  label,
}: {
  isDialog: boolean;
  border: string;
  text: string;
  primary: string;
  selected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 min-h-11 text-left transition-colors",
        isDialog
          ? "rounded-xl px-4 py-3 mb-1 hover:bg-[#2C2C2E]"
          : "py-3 border-b",
        isDialog && selected && "bg-[#E25B21]/15 ring-1 ring-[#E25B21]/40",
      )}
      style={isDialog ? undefined : { borderColor: border }}
    >
      {icon}
      <span className="flex-1 truncate" style={{ color: text }}>
        {label}
      </span>
      {selected ? <Check className="h-5 w-5 shrink-0" style={{ color: primary }} /> : null}
    </button>
  );
}
