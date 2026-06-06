"use client";

import { ArrowLeft, Headphones, Loader2, Send, User } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { ticketStatusLabel } from "@/constants/help-topics";
import { formatTimeOnly } from "@/lib/dateTimeUtils";
import type { UseSupportChatPageResult } from "@/hooks/use-support-chat-page";

type SupportChatMobileViewProps = UseSupportChatPageResult & {
  isDesktop?: boolean;
  showBottomNav?: boolean;
};

export function SupportChatMobileView({
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
  isDesktop = false,
  showBottomNav = true,
}: SupportChatMobileViewProps) {
  const clientName =
    activeTicket?.client_name ??
    activeTicket?.client?.full_name ??
    (activeTicket ? `Клиент #${activeTicket.id}` : null);

  const title = canRespond
    ? clientName ?? "Чат с клиентом"
    : `Обращение #${activeTicket?.id ?? ""}`;

  const subtitle = canRespond
    ? activeTicket
      ? ticketStatusLabel(activeTicket.status)
      : ""
    : "Администратор";

  const inputBarClass = isDesktop
    ? "bottom-0 bg-[#1C1C1E] border-[#212121]"
    : canRespond
      ? "bottom-[calc(90px+env(safe-area-inset-bottom,0px))] bg-[#1C1C1E] border-[#3A3A3C]"
      : "bottom-[calc(70px+env(safe-area-inset-bottom,0px))] bg-[#1C1C1E] border-[#3A3A3C]";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1C1C1E] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#E85D2B]" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-screen bg-[#1C1C1E]">
        <header className="flex items-center gap-3 px-4 py-3 border-b border-[#3A3A3C] pt-[max(3rem,env(safe-area-inset-top))]">
          <button
            type="button"
            onClick={handleBack}
            className="p-2 -ml-2 rounded-lg text-[#8E8E93] hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-full bg-[#E85D2B]/20 flex items-center justify-center shrink-0">
            {canRespond ? <User className="w-5 h-5 text-[#E85D2B]" /> : <Headphones className="w-5 h-5 text-[#E85D2B]" />}
          </div>
          <div className="min-w-0">
            <h1 className="font-semibold text-white truncate">{title}</h1>
            <p className="text-xs text-[#8E8E93]">{subtitle}</p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
          {error ? <p className="text-[#E85D2B] text-sm">{error}</p> : null}
          {messages.map((msg) => {
            const isFromAdmin = msg.sender === "admin";
            const isOwnMessage = canRespond ? isFromAdmin : !isFromAdmin;
            const showOnLeft = !isOwnMessage;

            return (
              <div
                key={msg.id}
                className={`flex ${showOnLeft ? "justify-start" : "justify-end"} items-start gap-2`}
              >
                {showOnLeft && (
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                      isFromAdmin ? "bg-[#E85D2B]" : "bg-[#3A3A3C]"
                    }`}
                  >
                    {isFromAdmin ? (
                      <Headphones className="w-4 h-4 text-white" />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>
                )}
                <div
                  className={`px-4 py-3 rounded-2xl max-w-[85%] ${
                    showOnLeft
                      ? "bg-[#2C2C2E] text-white rounded-tl-none"
                      : "bg-[#E85D2B] text-white rounded-tr-none"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  <p className={`text-xs mt-1 ${isOwnMessage ? "text-white/70" : "text-[#8E8E93]"}`}>
                    {formatTimeOnly(msg.created_at)}
                  </p>
                </div>
                {!showOnLeft && (
                  <div className="w-8 h-8 rounded-full bg-[#E85D2B] flex items-center justify-center shrink-0 mt-1">
                    {canRespond ? (
                      <Headphones className="w-4 h-4 text-white" />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {sending ? (
            <div className={`flex ${canRespond ? "justify-end" : "justify-end"}`}>
              <div className="px-4 py-3 rounded-2xl bg-[#E85D2B]/50 text-white text-sm">Отправка...</div>
            </div>
          ) : null}
          <div ref={messagesEndRef} aria-hidden />
        </main>

        <form
          onSubmit={(e) => handleSend(e)}
          className={`fixed left-0 right-0 border-t p-4 max-w-2xl mx-auto w-full z-10 ${inputBarClass}`}
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
            <div className="flex items-end gap-2">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder="Напишите сообщение..."
                className="flex-1 border border-[#3A3A3C] rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#E85D2B] text-sm min-h-[48px] max-h-[120px] bg-[#2C2C2E] text-white placeholder-[#8E8E93]"
                rows={1}
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || sending}
                className="bg-[#E85D2B] text-white rounded-xl p-3 disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
      </div>

      {!isDesktop && showBottomNav && !canRespond && <BottomNav activeTab="help" />}
      {!isDesktop && showBottomNav && canRespond && <BottomNav activeTab="help" />}
    </>
  );
}
