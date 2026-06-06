"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Headphones, Loader2, MessageCircle, User } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { ticketStatusLabel } from "@/constants/help-topics";
import { getSupportTickets, type SupportTicket } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type AdminSupportTicketsListProps = {
  canRespond?: boolean;
  basePath?: string;
  showBottomNav?: boolean;
};

/** Список чатов с клиентами — parity с RN help (admin-worker). */
export function AdminSupportTicketsList({
  canRespond = true,
  basePath = "/admin-worker/messages",
  showBottomNav = true,
}: AdminSupportTicketsListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSupportTickets();
      setTickets(res.data?.tickets ?? []);
    } catch {
      toast({ title: "Ошибка", description: "Не удалось загрузить чаты", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const openTicket = (ticket: SupportTicket) => {
    if (canRespond) {
      router.push(`${basePath}/${ticket.id}`);
    }
  };

  return (
    <>
      <div className="min-h-screen flex flex-col bg-[#1C1C1E]">
        <header className="sticky top-0 z-10 px-4 pt-[max(3rem,env(safe-area-inset-top))] pb-4 border-b border-[#3A3A3C]">
          <h1 className="text-2xl font-bold text-white mb-3">Сообщения</h1>
          <div className="flex items-center gap-3 pb-1">
            <div className="w-10 h-10 rounded-full bg-[#E85D2B]/20 flex items-center justify-center shrink-0">
              {canRespond ? (
                <MessageCircle className="w-5 h-5 text-[#E85D2B]" />
              ) : (
                <Headphones className="w-5 h-5 text-[#E85D2B]" />
              )}
            </div>
            <div>
              <p className="font-semibold text-white">Чаты с клиентами</p>
              <p className="text-xs text-[#8E8E93]">
                {canRespond ? "Ответьте на обращения пользователей" : "Просмотр обращений"}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 pb-24">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-[#E85D2B]" />
              <p className="text-[#8E8E93] text-sm">Загрузка чатов...</p>
            </div>
          ) : tickets.length === 0 ? (
            <p className="text-[#8E8E93] text-sm text-center py-16">Нет чатов с клиентами</p>
          ) : (
            <ul className="space-y-2">
              {tickets.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => openTicket(t)}
                    disabled={!canRespond}
                    className="w-full text-left px-3 py-3 rounded-2xl border border-[#3A3A3C] bg-[#2C2C2E] flex items-center gap-3 active:scale-[0.98] disabled:opacity-80"
                  >
                    <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 bg-[#E85D2B]/20">
                      <User className="h-5 w-5 text-[#E85D2B]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-white truncate">
                        {t.client_name ?? t.client?.full_name ?? `Клиент #${t.id}`}
                      </p>
                      <p className="text-xs text-[#8E8E93]">
                        {ticketStatusLabel(t.status)} · #{t.id}
                      </p>
                    </div>
                    {canRespond ? (
                      <ChevronRight className="w-5 h-5 text-[#8E8E93] shrink-0" />
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {showBottomNav && <BottomNav activeTab="help" />}
    </>
  );
}
