"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import axios, { type AxiosError } from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import api, {
  createSupportTicket,
  getMySupportTickets,
  type SupportTicket,
} from "@/lib/api";
import { HELP_INITIAL_BOT_MESSAGE } from "@/constants/help-topics";
import { useAuthStore } from "@/stores/useAuthStore";

export type HelpChatTab = "bot" | "support";

export type BotMessage = {
  from: "user" | "bot";
  text: string;
  suggestSupport?: boolean;
  userMessage?: string;
};

type ApiError = { error?: string };

export function useHelpChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, isGuest } = useAuthStore();

  const tabParam = searchParams.get("tab");
  const [innerChatTab, setInnerChatTab] = useState<HelpChatTab>(
    tabParam === "support" ? "support" : "bot"
  );

  const [messages, setMessages] = useState<BotMessage[]>([
    { from: "bot", text: HELP_INITIAL_BOT_MESSAGE },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [showTopics, setShowTopics] = useState(true);

  const [showSupportForm, setShowSupportForm] = useState(false);
  const [supportFormValue, setSupportFormValue] = useState("");
  const [supportFormSubmitting, setSupportFormSubmitting] = useState(false);
  const [supportError, setSupportError] = useState<string | null>(null);
  const [myTickets, setMyTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const getChatStorageKey = useCallback(() => {
    return token ? `chat-messages-${token}` : "chat-messages";
  }, [token]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "support" || tab === "bot") {
      setInnerChatTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    const saved = localStorage.getItem(getChatStorageKey());
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as BotMessage[];
        if (Array.isArray(parsed) && parsed.length > 1) {
          setMessages(parsed);
          setShowTopics(false);
        }
      } catch {
        localStorage.removeItem(getChatStorageKey());
      }
    }
    textareaRef.current?.focus();
  }, [getChatStorageKey]);

  useEffect(() => {
    if (messages.length > 1) {
      localStorage.setItem(getChatStorageKey(), JSON.stringify(messages));
    }
  }, [messages, getChatStorageKey]);

  const setTab = useCallback(
    (tab: HelpChatTab) => {
      setInnerChatTab(tab);
      const params = new URLSearchParams(searchParams.toString());
      if (tab === "bot") params.delete("tab");
      else params.set("tab", tab);
      const q = params.toString();
      router.replace(q ? `/chat-bot?${q}` : "/chat-bot");
    },
    [router, searchParams]
  );

  const appendBotReply = useCallback(
    (userText: string, botText: string, isError = false) => {
      const isFallback =
        isError ||
        !botText ||
        botText === "Не получилось обработать ответ." ||
        /ошибка|попробуйте позже/i.test(botText);

      setMessages((prev) => [
        ...prev,
        { from: "bot", text: botText },
        ...(isFallback
          ? [
              {
                from: "bot" as const,
                text: isGuest
                  ? "К сожалению, не нашёл подходящего ответа на ваш вопрос."
                  : "Можете обратиться в техподдержку — во вкладке «Техподдержка» опишите вопрос, мы ответим в чате.",
                suggestSupport: !isGuest,
                userMessage: userText,
              },
            ]
          : []),
      ]);
    },
    [isGuest]
  );

  const sendToBot = useCallback(
    async (text: string) => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const response = await api.post("/chat", { message: text }, { signal: abortController.signal });
        const botText = response.data?.answer ?? "Не получилось обработать ответ.";
        appendBotReply(text, botText);
      } catch (err) {
        if (axios.isCancel(err)) return;
        const axiosErr = err as AxiosError<ApiError>;
        const errorMessage = axiosErr.response?.data?.error || "Ошибка сервера. Попробуйте позже.";
        setError(errorMessage);
        appendBotReply(text, errorMessage, true);
      }
    },
    [appendBotReply]
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || isSending) return;

    setMessages((prev) => [...prev, { from: "user", text: trimmed }]);
    setInputValue("");
    setShowTopics(false);
    setSelectedTopic(null);
    setIsSending(true);
    setIsBotTyping(true);
    setError(null);

    await sendToBot(trimmed);

    setIsSending(false);
    setIsBotTyping(false);
  };

  const handleQuestionSelect = async (question: string) => {
    setSelectedTopic(null);
    setShowTopics(false);
    setInputValue("");
    setMessages((prev) => [...prev, { from: "user", text: question }]);
    setIsSending(true);
    setIsBotTyping(true);
    setError(null);

    await sendToBot(question);

    setIsSending(false);
    setIsBotTyping(false);
  };

  const handleGoToSupport = (userMessage?: string) => {
    setTab("support");
    setSupportFormValue(userMessage?.trim() ?? "");
    setShowSupportForm(true);
  };

  const loadOrCreateSupportTicket = useCallback(
    async (initialMessage: string) => {
      setSupportFormSubmitting(true);
      setSupportError(null);

      if (isGuest) {
        setSupportError("В демо-режиме техподдержка недоступна.");
        setSupportFormSubmitting(false);
        return;
      }

      try {
        const res = await createSupportTicket(initialMessage);
        const ticket = res.data?.ticket || res.data;
        if (ticket?.id) {
          setShowSupportForm(false);
          setSupportFormValue("");
          setMyTickets((prev) => [ticket, ...prev.filter((t) => t.id !== ticket.id)]);
          router.push(`/chat-bot/chat/${ticket.id}`);
        }
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number; data?: { error?: string } } })
          ?.response?.status;
        if (status === 404 || status === 501 || (status != null && status >= 500)) {
          const fallbackTicket: SupportTicket = {
            id: Date.now(),
            user_id: 0,
            message: initialMessage,
            status: "open",
            created_at: new Date().toISOString(),
          };
          setShowSupportForm(false);
          setSupportFormValue("");
          router.push(`/chat-bot/chat/${fallbackTicket.id}`);
        } else {
          setSupportError(
            (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
              "Не удалось отправить заявку. Попробуйте позже."
          );
        }
      } finally {
        setSupportFormSubmitting(false);
      }
    },
    [isGuest, router]
  );

  const handleSupportFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = supportFormValue.trim();
    if (!trimmed || supportFormSubmitting) return;
    loadOrCreateSupportTicket(trimmed);
  };

  const openSupportTicket = useCallback(
    (ticket: SupportTicket) => {
      router.push(`/chat-bot/chat/${ticket.id}`);
    },
    [router]
  );

  useEffect(() => {
    if (innerChatTab !== "support" || !token || isGuest) {
      if (isGuest) setMyTickets([]);
      return;
    }
    setLoadingTickets(true);
    getMySupportTickets()
      .then((res) => setMyTickets(res.data?.tickets ?? []))
      .catch(() => setMyTickets([]))
      .finally(() => setLoadingTickets(false));
  }, [innerChatTab, token, isGuest]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit(e);
    }
  };

  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue, adjustTextareaHeight]);

  const confirmClearChat = () => {
    setMessages([{ from: "bot", text: HELP_INITIAL_BOT_MESSAGE }]);
    localStorage.removeItem(getChatStorageKey());
    setShowClearModal(false);
    setSelectedTopic(null);
    setShowTopics(true);
  };

  return {
    innerChatTab,
    setTab,
    messages,
    inputValue,
    setInputValue,
    isSending,
    isBotTyping,
    error,
    showClearModal,
    setShowClearModal,
    confirmClearChat,
    selectedTopic,
    setSelectedTopic,
    showTopics,
    setShowTopics,
    handleSubmit,
    handleQuestionSelect,
    handleTopicSelect: (topicId: string) => {
      setSelectedTopic(topicId);
      setShowTopics(false);
    },
    handleBackToTopics: () => {
      setSelectedTopic(null);
      setShowTopics(true);
    },
    handleShowTopicsMenu: () => {
      setSelectedTopic(null);
      setShowTopics(true);
    },
    handleGoToSupport,
    handleCopyMessage: (text: string) => navigator.clipboard.writeText(text),
    handleKeyDown,
    textareaRef,
    isGuest,
    showSupportForm,
    setShowSupportForm,
    supportFormValue,
    setSupportFormValue,
    supportFormSubmitting,
    supportError,
    handleSupportFormSubmit,
    myTickets,
    loadingTickets,
    openSupportTicket,
  };
}

export type UseHelpChatPageResult = ReturnType<typeof useHelpChatPage>;
