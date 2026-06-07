"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Loader2, Lock, Star, Trash2, X } from "lucide-react";
import { ScreenHeader } from "@/components/ui/screen-header";
import { useToast } from "@/hooks/use-toast";
import {
  normalizeUserSearchItem,
  searchUsersForAssign,
  type UserSearchItem,
} from "@/lib/user-search";
import {
  bumpTeamsCache,
  createTeam,
  deleteTeam,
  getTeam,
  updateTeam,
} from "@/lib/teams-api";
import { useAuthStore } from "@/stores/useAuthStore";

type Person = { id: number; full_name: string };

type TeamFormScreenProps = {
  teamId?: number;
};

/** Форма создания/редактирования команды — parity с workflow-mobile TeamFormScreen. */
export function TeamFormScreen({ teamId }: TeamFormScreenProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isGuest = useAuthStore((s) => s.isGuest);
  const currentUserId = useAuthStore((s) => s.user?.id ?? null);

  const isEdit = teamId != null && Number.isFinite(teamId);

  const [loadingTeam, setLoadingTeam] = useState(!!isEdit);
  const [name, setName] = useState("");
  const [leader, setLeader] = useState<Person | null>(null);
  const [members, setMembers] = useState<Person[]>([]);

  const [leaderSearch, setLeaderSearch] = useState("");
  const [leaderResults, setLeaderResults] = useState<UserSearchItem[]>([]);
  const [leaderSearching, setLeaderSearching] = useState(false);

  const [memberSearch, setMemberSearch] = useState("");
  const [memberResults, setMemberResults] = useState<UserSearchItem[]>([]);
  const [memberSearching, setMemberSearching] = useState(false);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [teamMeta, setTeamMeta] = useState<{ created_by: number; leader_id: number } | null>(
    null,
  );

  useEffect(() => {
    if (!isEdit || !teamId) return;
    let cancelled = false;
    void (async () => {
      setLoadingTeam(true);
      const res = await getTeam(teamId);
      setLoadingTeam(false);
      if (cancelled) return;
      if (!res.ok) {
        toast({
          title: "Не удалось загрузить команду",
          description: res.error,
          variant: "destructive",
        });
        router.back();
        return;
      }
      const t = res.data;
      setName(t.name);
      setTeamMeta({ created_by: t.created_by, leader_id: t.leader_id });
      const l = t.leader;
      if (l) setLeader({ id: l.id, full_name: l.full_name });
      const mem = t.members ?? [];
      const rest = mem.filter((m) => m.id !== t.leader_id);
      setMembers(rest.map((m) => ({ id: m.id, full_name: m.full_name })));
    })();
    return () => {
      cancelled = true;
    };
  }, [isEdit, teamId, router, toast]);

  useEffect(() => {
    const q = leaderSearch.trim();
    if (q.length < 2) {
      setLeaderResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setLeaderSearching(true);
      const res = await searchUsersForAssign(q);
      setLeaderSearching(false);
      if (res.ok) setLeaderResults(res.data);
    }, 300);
    return () => clearTimeout(t);
  }, [leaderSearch]);

  useEffect(() => {
    const q = memberSearch.trim();
    if (q.length < 2) {
      setMemberResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setMemberSearching(true);
      const res = await searchUsersForAssign(q);
      setMemberSearching(false);
      if (res.ok) setMemberResults(res.data);
    }, 300);
    return () => clearTimeout(t);
  }, [memberSearch]);

  const memberIdsForSubmit = useMemo(() => {
    const ids = new Set<number>();
    if (leader) ids.add(leader.id);
    members.forEach((m) => ids.add(m.id));
    return Array.from(ids);
  }, [leader, members]);

  const isTeamCreator = useMemo(() => {
    if (currentUserId == null || teamMeta == null) return false;
    return teamMeta.created_by === currentUserId;
  }, [currentUserId, teamMeta]);

  const canManageMembers = useMemo(() => {
    if (currentUserId == null || teamMeta == null) return !isEdit;
    return isTeamCreator || teamMeta.leader_id === currentUserId;
  }, [currentUserId, teamMeta, isEdit, isTeamCreator]);

  const canEditTeamMeta = isTeamCreator || !isEdit;
  const canDeleteTeam = isTeamCreator;

  const pickLeader = useCallback((u: UserSearchItem) => {
    const n = normalizeUserSearchItem(u);
    setLeader({ id: n.id, full_name: n.full_name });
    setMembers((prev) => prev.filter((p) => p.id !== n.id));
    setLeaderSearch("");
    setLeaderResults([]);
  }, []);

  const addMember = useCallback(
    (u: UserSearchItem) => {
      const n = normalizeUserSearchItem(u);
      if (leader && n.id === leader.id) return;
      if (members.some((m) => m.id === n.id)) return;
      setMembers((prev) => [...prev, { id: n.id, full_name: n.full_name }]);
      setMemberSearch("");
      setMemberResults([]);
    },
    [leader, members],
  );

  const removeMember = useCallback((id: number) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const clearLeader = useCallback(() => {
    setLeader(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (isGuest) {
      toast({ title: "Недоступно", description: "Войдите в аккаунт", variant: "destructive" });
      return;
    }
    const trimmed = name.trim();
    if (!trimmed) {
      toast({ title: "Название", description: "Введите название команды", variant: "destructive" });
      return;
    }
    if (!leader) {
      toast({
        title: "Руководитель",
        description: "Выберите руководителя команды",
        variant: "destructive",
      });
      return;
    }
    if (saving) return;
    setSaving(true);
    if (isEdit && teamId) {
      const payload = isTeamCreator
        ? { name: trimmed, leader_id: leader.id, member_ids: memberIdsForSubmit }
        : { member_ids: memberIdsForSubmit };
      const res = await updateTeam(teamId, payload);
      setSaving(false);
      if (res.ok) {
        bumpTeamsCache();
        toast({ title: "Сохранено", duration: 2000 });
        router.back();
      } else {
        toast({ title: "Ошибка", description: res.error, variant: "destructive" });
      }
    } else {
      const res = await createTeam({
        name: trimmed,
        leader_id: leader.id,
        member_ids: memberIdsForSubmit,
      });
      setSaving(false);
      if (res.ok) {
        bumpTeamsCache();
        router.back();
      } else {
        toast({ title: "Не удалось создать", description: res.error, variant: "destructive" });
      }
    }
  }, [
    isGuest,
    name,
    leader,
    saving,
    isEdit,
    teamId,
    memberIdsForSubmit,
    isTeamCreator,
    toast,
    router,
  ]);

  const handleDelete = useCallback(async () => {
    if (!teamId || !isEdit || isGuest || !canDeleteTeam) return;
    setDeleting(true);
    const res = await deleteTeam(teamId);
    setDeleting(false);
    if (res.ok) {
      bumpTeamsCache();
      router.back();
    } else {
      toast({ title: "Не удалось удалить", description: res.error, variant: "destructive" });
    }
  }, [teamId, isEdit, isGuest, canDeleteTeam, router, toast]);

  const title = isEdit ? "Редактировать команду" : "Новая команда";

  if (isGuest) {
    return (
      <>
        <div
          className="min-h-screen bg-[#1C1C1E] flex flex-col items-center justify-center px-6"
          
        >
          <ScreenHeader title={isEdit ? "Команда" : "Новая команда"} />
          <Lock className="h-10 w-10 text-[#8E8E93] mb-3" />
          <p className="text-[#8E8E93] text-center">Войдите в аккаунт, чтобы управлять командами</p>
        </div>
      </>
    );
  }

  if (isEdit && !loadingTeam && teamMeta && !canManageMembers) {
    return (
      <>
        <div
          className="min-h-screen bg-[#1C1C1E]"
          
        >
          <ScreenHeader title="Команда" />
          <p className="px-6 text-[#8E8E93] text-center mt-8">
            Редактировать команду могут только создатель и руководитель
          </p>
        </div>
      </>
    );
  }

  if (loadingTeam) {
    return (
      <>
        <div
          className="min-h-screen bg-[#1C1C1E] flex flex-col"
          
        >
          <ScreenHeader title={title} />
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-[#E25B21]" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div
        className="min-h-screen bg-[#1C1C1E] flex flex-col"
        
      >
        <ScreenHeader title={title} />

        <div className="flex-1 overflow-y-auto px-4 pb-28">
          <p className="text-[13px] font-bold uppercase tracking-wide text-[#8E8E93] mt-2 mb-2">
            Название
          </p>
          <div className="rounded-[14px] border border-[#3A3A3C] bg-[#2C2C2E] p-3.5">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например, Отдел продаж"
              maxLength={255}
              disabled={!canEditTeamMeta}
              className="w-full bg-transparent text-base text-white placeholder:text-[#8E8E93] outline-none min-h-10 disabled:opacity-60"
            />
          </div>

          <p className="text-[13px] font-bold uppercase tracking-wide text-[#8E8E93] mt-5 mb-2">
            Руководитель
          </p>
          <div className="rounded-[14px] border border-[#3A3A3C] bg-[#2C2C2E] p-3.5 space-y-2.5">
            <input
              value={leaderSearch}
              onChange={(e) => setLeaderSearch(e.target.value)}
              placeholder="Поиск по имени (от 2 символов)"
              disabled={!canEditTeamMeta}
              className="w-full bg-transparent text-base text-white placeholder:text-[#8E8E93] outline-none min-h-10 disabled:opacity-60"
            />
            {leaderSearching ? <p className="text-[13px] text-[#8E8E93]">Поиск…</p> : null}
            {leaderResults.length > 0 && (
              <div className="rounded-[10px] border border-[#3A3A3C] overflow-hidden">
                {leaderResults.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    disabled={!canEditTeamMeta}
                    onClick={() => pickLeader(u)}
                    className="w-full px-3 py-3 text-left text-white border-b border-[#3A3A3C]/60 last:border-0 hover:bg-white/5 disabled:opacity-50"
                  >
                    {u.full_name}
                  </button>
                ))}
              </div>
            )}
            {leader ? (
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-[#E25B21] bg-[#E25B21]/10 max-w-full">
                  <Star className="h-4 w-4 text-[#E25B21] shrink-0" />
                  <span className="text-sm font-semibold text-white truncate">
                    {leader.full_name?.trim() || `#${leader.id}`}
                  </span>
                  {canEditTeamMeta ? (
                    <button type="button" onClick={clearLeader} aria-label="Убрать руководителя">
                      <X className="h-4 w-4 text-[#E25B21]" />
                    </button>
                  ) : null}
                </span>
              </div>
            ) : (
              <p className="text-[13px] text-[#8E8E93]">Выберите руководителя из результатов поиска</p>
            )}
          </div>

          <p className="text-[13px] font-bold uppercase tracking-wide text-[#8E8E93] mt-5 mb-2">
            Участники
          </p>
          <div className="rounded-[14px] border border-[#3A3A3C] bg-[#2C2C2E] p-3.5 space-y-2.5">
            <input
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Добавить участника (поиск от 2 символов)"
              disabled={!canManageMembers}
              className="w-full bg-transparent text-base text-white placeholder:text-[#8E8E93] outline-none min-h-10 disabled:opacity-60"
            />
            {memberSearching ? <p className="text-[13px] text-[#8E8E93]">Поиск…</p> : null}
            {memberResults.length > 0 && (
              <div className="rounded-[10px] border border-[#3A3A3C] overflow-hidden">
                {memberResults
                  .filter((u) => (!leader || u.id !== leader.id) && !members.some((m) => m.id === u.id))
                  .map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => addMember(u)}
                      className="w-full px-3 py-3 text-left text-white border-b border-[#3A3A3C]/60 last:border-0 hover:bg-white/5"
                    >
                      {u.full_name}
                    </button>
                  ))}
              </div>
            )}
            {members.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {members.map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-[#3A3A3C] bg-[#E25B21]/10 max-w-full"
                  >
                    <span className="text-sm font-semibold text-white truncate">
                      {m.full_name?.trim() || `#${m.id}`}
                    </span>
                    {canManageMembers ? (
                      <button type="button" onClick={() => removeMember(m.id)} aria-label="Удалить">
                        <X className="h-4 w-4 text-[#8E8E93]" />
                      </button>
                    ) : null}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-[#8E8E93]">
                Необязательно: добавьте остальных участников команды
              </p>
            )}
          </div>

          {isEdit && canDeleteTeam ? (
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="mt-6 w-full flex items-center justify-center gap-2 py-3.5 rounded-[14px] border border-red-500 text-red-400 font-semibold disabled:opacity-60"
            >
              {deleting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Trash2 className="h-5 w-5" />
                  Удалить команду
                </>
              )}
            </button>
          ) : null}
        </div>

        {canManageMembers ? (
          <div className="fixed bottom-[calc(52px+max(env(safe-area-inset-bottom,0px),10px))] left-0 right-0 px-4 py-3 border-t border-[#3A3A3C] bg-[#1C1C1E]">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="w-full rounded-[14px] bg-[#E25B21] py-4 text-white text-[17px] font-bold disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
              {isEdit ? "Сохранить" : "Создать команду"}
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}
