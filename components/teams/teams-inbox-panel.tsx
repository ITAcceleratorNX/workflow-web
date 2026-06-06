"use client";

import { useRouter } from "next/navigation";
import { Check, Loader2, Lock, Plus, Users, X } from "lucide-react";
import { useTeams } from "@/hooks/use-teams";
import { membersPluralRu } from "@/lib/teams-api";
import { useAuthStore } from "@/stores/useAuthStore";

type TeamsInboxPanelProps = {
  onClose: () => void;
};

/** Панель списка команд — parity с workflow-mobile TeamsInboxPanel. */
export function TeamsInboxPanel({ onClose }: TeamsInboxPanelProps) {
  const router = useRouter();
  const isGuest = useAuthStore((s) => s.isGuest);
  const { teams, loading, error } = useTeams();

  const goCreateTeam = () => {
    onClose();
    router.push("/client/teams/create");
  };

  const openTeam = (teamId: number) => {
    onClose();
    router.push(`/client/teams/${teamId}`);
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      <button type="button" className="absolute inset-0 bg-black/45" onClick={onClose} aria-label="Закрыть панель" />
      <div className="relative bg-[#1C1C1E] rounded-t-2xl max-h-[88vh] overflow-hidden shadow-2xl">
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-[42px] h-[5px] rounded-full bg-[#E25B21]" />
        </div>

        <div className="flex items-center justify-between px-2 pb-2">
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center"
            aria-label="Закрыть"
          >
            <X className="h-[26px] w-[26px] text-[#8E8E93]" />
          </button>
          <p className="text-base font-bold text-white flex-1 text-center">Команды</p>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center"
            aria-label="Готово"
          >
            <Check className="h-6 w-6 text-[#E25B21]" />
          </button>
        </div>

        {isGuest ? (
          <div className="flex flex-col items-center justify-center min-h-[200px] px-6 py-6 gap-3">
            <Lock className="h-10 w-10 text-[#8E8E93]" />
            <p className="text-[#8E8E93] text-center text-base font-semibold">
              Войдите в аккаунт, чтобы работать с командами
            </p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center min-h-[200px] py-6">
            <Loader2 className="h-10 w-10 animate-spin text-[#E25B21]" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center min-h-[200px] px-6 py-6">
            <p className="text-[#8E8E93] text-center">{error}</p>
          </div>
        ) : teams.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[200px] px-6 py-6 gap-3">
            <Users className="h-11 w-11 text-[#8E8E93]" />
            <p className="text-white text-base font-semibold">Пока нет команд</p>
            <p className="text-[#8E8E93] text-center text-sm leading-5">
              Создайте команду — позже здесь можно будет смотреть статистику
            </p>
          </div>
        ) : (
          <div className="max-h-[52vh] overflow-y-auto px-4 pt-3 pb-4 space-y-2.5">
            {teams.map((t) => {
              const memberCount = t.members?.length ?? 0;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => openTeam(t.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-[14px] border border-[#3A3A3C] bg-[#2C2C2E] text-left active:opacity-90"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#E25B21]/15 flex items-center justify-center shrink-0">
                    <Users className="h-[22px] w-[22px] text-[#E25B21]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-white line-clamp-2">{t.name}</p>
                    <p className="text-[13px] text-[#8E8E93] mt-0.5">
                      {memberCount} {membersPluralRu(memberCount)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {!isGuest && (
          <div className="border-t border-[#3A3A3C] px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={goCreateTeam}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[14px] bg-[#E25B21] text-white font-bold active:opacity-90"
            >
              <Plus className="h-[22px] w-[22px]" />
              Создать команду
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
