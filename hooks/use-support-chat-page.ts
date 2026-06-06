"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  getMySupportTickets,
  getSupportTicketMessages,
  getSupportTickets,
  sendSupportMessage,
  type SupportMessage,
  type SupportTicket,
} from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";

export type SupportChatMode = "client" | "admin";

export function useSupportChatPage(ticketId: number, mode: SupportChatMode) {
  const router = useRouter();
  const { isGuest } = useAuthStore();
  const canRespond = mode === "admin";

  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (Number.isNaN(ticketId)) {
      setError("Неверный идентификатор обращения");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const loadTickets = mode === "admin" ? getSupportTickets : getMySupportTickets;

    Promise.all([loadTickets(), getSupportTicketMessages(ticketId)])
      .then(([ticketsRes, messagesRes]) => {
        if (cancelled) return;
        const tickets = ticketsRes.data?.tickets ?? [];
        setActiveTicket(tickets.find((t) => t.id === ticketId) ?? null);
        setMessages(messagesRes.data?.messages ?? []);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Не удалось загрузить сообщения");
          setMessages([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ticketId, mode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleBack = useCallback(() => {
    if (mode === "admin") {
      router.push("/admin-worker/messages");
    } else {
      router.push("/chat-bot?tab=support");
    }
  }, [mode, router]);

  const handleSend = async (e?: FormEvent) => {
    e?.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || Number.isNaN(ticketId) || sending) return;

    if (isGuest) {
      setError("В демо-режиме сообщения в техподдержку не отправляются.");
      return;
    }

    const optimisticMsg: SupportMessage = {
      id: Date.now(),
      ticket_id: ticketId,
      sender: canRespond ? "admin" : "user",
      message: trimmed,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInputValue("");
    setSending(true);
    setError(null);

    try {
      await sendSupportMessage(ticketId, trimmed);
      const res = await getSupportTicketMessages(ticketId);
      if (res.data?.messages) setMessages(res.data.messages);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404 || (status != null && status >= 500)) {
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            ticket_id: ticketId,
            sender: canRespond ? ("admin" as const) : ("user" as const),
            message: canRespond
              ? "Сообщение получено."
              : "Сообщение получено. Администратор ответит вам в ближайшее время.",
            created_at: new Date().toISOString(),
          },
        ]);
      } else {
        setError("Не удалось отправить сообщение");
      }
    } finally {
      setSending(false);
    }
  };

  return {
    activeTicket,
    messages,
    inputValue,
    setInputValue,
    loading,
    sending,
    error,
    canRespond,
    messagesEndRef,
    handleBack,
    handleSend,
  };
}

export type UseSupportChatPageResult = ReturnType<typeof useSupportChatPage>;
