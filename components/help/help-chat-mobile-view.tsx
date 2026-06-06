"use client";

import { useEffect, useRef } from "react";
import {
  Bot,
  ChevronRight,
  Copy,
  Headphones,
  Loader2,
  Menu,
  Send,
  User,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { BottomNav } from "@/components/BottomNav";
import { DeleteConfirmationModal } from "@/components/DeleteConfirmationModal";
import { HELP_TOPICS, ticketStatusLabel } from "@/constants/help-topics";
import type { UseHelpChatPageResult } from "@/hooks/use-help-chat-page";
import { HelpSupportFormModal } from "./help-support-form-modal";

type HelpChatMobileViewProps = UseHelpChatPageResult & {
  isDesktop?: boolean;
};

export function HelpChatMobileView({
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
  showTopics,
  handleSubmit,
  handleQuestionSelect,
  handleTopicSelect,
  handleBackToTopics,
  handleShowTopicsMenu,
  handleGoToSupport,
  handleCopyMessage,
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
  isDesktop = false,
}: HelpChatMobileViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isBotTyping]);

  const inputBarClass = isDesktop
    ? "bottom-0 bg-[#1C1C1E] border-[#212121]"
    : "bottom-[calc(70px+env(safe-area-inset-bottom,0px))] bg-[#1C1C1E] border-[#3A3A3C]";

  return (
    <>
      <div className={`flex flex-col h-screen safe-area-padding bg-[#1C1C1E]`}>
        <header className="sticky top-0 z-10 pt-[max(3rem,env(safe-area-inset-top))] pb-4 px-4 border-b border-[#3A3A3C]">
          <h1 className="text-2xl font-bold text-white mb-4">Сообщение</h1>
          <div className="flex rounded-xl overflow-hidden bg-[#2C2C2E] p-1 gap-1">
            <button
              type="button"
              onClick={() => setTab("bot")}
              className={`flex-1 py-2.5 px-3 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors ${
                innerChatTab === "bot" ? "bg-[#E85D2B] text-white" : "text-[#8E8E93]"
              }`}
            >
              <Bot className="w-4 h-4" />
              Чат-бот
            </button>
            <button
              type="button"
              onClick={() => setTab("support")}
              className={`flex-1 py-2.5 px-3 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors ${
                innerChatTab === "support" ? "bg-[#E85D2B] text-white" : "text-[#8E8E93]"
              }`}
            >
              <Headphones className="w-4 h-4" />
              Техподдержка
            </button>
          </div>
        </header>

        {innerChatTab === "support" ? (
          <main className="flex-1 overflow-y-auto p-4 space-y-3 pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
            <button
              type="button"
              onClick={() => setShowSupportForm(true)}
              className="w-full rounded-2xl p-4 border border-[#3A3A3C] bg-[#2C2C2E] text-left flex items-center gap-3 active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-full bg-[#E85D2B]/20 flex items-center justify-center shrink-0">
                <Headphones className="w-5 h-5 text-[#E85D2B]" />
              </div>
              <div>
                <p className="font-semibold text-white">Написать в поддержку</p>
                <p className="text-xs text-[#8E8E93]">Опишите проблему — ответим в чате</p>
              </div>
            </button>

            {loadingTickets ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-[#E85D2B]" />
              </div>
            ) : myTickets.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-[#8E8E93] font-medium">Мои обращения</p>
                {myTickets.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => openSupportTicket(t)}
                    className="w-full rounded-xl p-3 border border-[#3A3A3C] bg-[#2C2C2E] text-left flex items-center justify-between gap-2 active:scale-[0.98]"
                  >
                    <span className="text-white text-sm truncate">
                      #{t.id} · {ticketStatusLabel(t.status)}
                    </span>
                    <ChevronRight className="w-5 h-5 text-[#8E8E93] shrink-0" />
                  </button>
                ))}
              </div>
            ) : null}
          </main>
        ) : (
          <>
            <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-40">
              {showTopics && (
                <div className="space-y-3 mb-4">
                  {HELP_TOPICS.map((topic) => (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => handleTopicSelect(topic.id)}
                      className="w-full bg-[#2C2C2E] rounded-2xl p-4 border border-[#3A3A3C] text-left flex items-start gap-3 active:scale-[0.98]"
                    >
                      <div className="shrink-0 w-10 h-10 rounded-xl bg-[#E85D2B]/20 flex items-center justify-center text-[#E85D2B]">
                        {topic.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-sm mb-1">{topic.title}</h3>
                        <p className="text-xs text-[#8E8E93]">{topic.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedTopic && !showTopics && (
                <div className="space-y-3 mb-4">
                  <button
                    type="button"
                    onClick={handleBackToTopics}
                    className="text-sm text-[#E85D2B] flex items-center gap-1"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                    Назад к темам
                  </button>
                  <div className="bg-[#2C2C2E] rounded-2xl p-4 border border-[#3A3A3C]">
                    <h3 className="font-semibold text-white text-base mb-2">
                      {HELP_TOPICS.find((t) => t.id === selectedTopic)?.title}
                    </h3>
                    <p className="text-sm text-[#8E8E93] mb-3">Выберите вопрос или напишите свой:</p>
                    <div className="space-y-2">
                      {HELP_TOPICS.find((t) => t.id === selectedTopic)?.questions.map((question, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleQuestionSelect(question)}
                          className="w-full text-left p-3 rounded-xl bg-[#3A3A3C] text-sm text-white active:scale-[0.98]"
                        >
                          {question}
                        </button>
                      ))}
                      {selectedTopic === "errors" && (
                        <button
                          type="button"
                          onClick={() => {
                            setTab("support");
                            setShowSupportForm(true);
                          }}
                          className="w-full text-left p-3 rounded-xl bg-[#E85D2B]/20 border border-[#E85D2B]/40 text-sm text-[#E85D2B] font-medium flex items-center gap-2"
                        >
                          <Headphones className="w-4 h-4" />
                          ИИ не помог — написать в поддержку
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.from === "bot" ? "justify-start" : "justify-end"} items-start gap-2`}
                >
                  {msg.from === "bot" && (
                    <div className="w-8 h-8 rounded-full bg-[#E85D2B] flex items-center justify-center shrink-0 mt-1">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div className="relative group max-w-[85%]">
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(msg.text)}
                      className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-[#2C2C2E] rounded-full border border-[#3A3A3C]"
                      title="Копировать"
                    >
                      <Copy className="w-3 h-3 text-[#8E8E93]" />
                    </button>
                    <div
                      className={`px-4 py-3 rounded-2xl ${
                        msg.from === "bot"
                          ? "bg-[#2C2C2E] text-white rounded-tl-none"
                          : "bg-[#E85D2B] text-white rounded-tr-none"
                      }`}
                    >
                      <ReactMarkdown
                        components={{
                          p: ({ ...props }) => <p className="mb-2 last:mb-0 text-sm" {...props} />,
                          ul: ({ ...props }) => <ul className="list-disc pl-5 mb-2 text-sm" {...props} />,
                          ol: ({ ...props }) => <ol className="list-decimal pl-5 mb-2 text-sm" {...props} />,
                          li: ({ ...props }) => <li className="mb-1" {...props} />,
                          code: ({ ...props }) => (
                            <code className="bg-black/30 px-1 rounded text-sm font-mono" {...props} />
                          ),
                          a: ({ ...props }) => (
                            <a className="text-[#F9AB89] hover:underline" {...props} />
                          ),
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                      {msg.suggestSupport && !isGuest ? (
                        <button
                          type="button"
                          onClick={() => handleGoToSupport(msg.userMessage)}
                          className="mt-3 w-full py-2.5 rounded-xl bg-[#E85D2B]/20 border border-[#E85D2B]/50 text-[#E85D2B] font-medium text-sm flex items-center justify-center gap-2"
                        >
                          <Headphones className="w-4 h-4" />
                          Написать в техподдержку
                        </button>
                      ) : null}
                    </div>
                  </div>
                  {msg.from === "user" && (
                    <div className="w-8 h-8 rounded-full bg-[#3A3A3C] flex items-center justify-center shrink-0 mt-1">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              ))}

              {isBotTyping && (
                <div className="flex justify-start items-end gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#E85D2B] flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-[#2C2C2E] text-white rounded-tl-none">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 rounded-full bg-[#E85D2B] animate-bounce" />
                      <div
                        className="w-2 h-2 rounded-full bg-[#E85D2B] animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                      <div
                        className="w-2 h-2 rounded-full bg-[#E85D2B] animate-bounce"
                        style={{ animationDelay: "0.4s" }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} aria-hidden />
            </main>

            <form
              onSubmit={handleSubmit}
              className={`fixed left-0 right-0 border-t p-4 max-w-2xl mx-auto w-full z-10 ${inputBarClass}`}
              style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
            >
              {error ? <div className="text-[#E85D2B] text-xs mb-2 px-2">{error}</div> : null}
              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={handleShowTopicsMenu}
                  className="p-3 rounded-xl bg-[#2C2C2E] text-[#8E8E93] hover:text-white"
                  title="Меню тем"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Напишите сообщение..."
                  className="flex-1 border border-[#3A3A3C] rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#E85D2B] text-sm min-h-[48px] max-h-[150px] bg-[#2C2C2E] text-white placeholder-[#8E8E93]"
                  rows={1}
                  disabled={isSending}
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isSending}
                  className="bg-[#E85D2B] text-white rounded-xl p-3 disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      {!isDesktop && <BottomNav activeTab="help" />}

      <HelpSupportFormModal
        open={showSupportForm}
        value={supportFormValue}
        onChange={setSupportFormValue}
        onClose={() => setShowSupportForm(false)}
        onSubmit={handleSupportFormSubmit}
        submitting={supportFormSubmitting}
        error={supportError}
      />

      <DeleteConfirmationModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={confirmClearChat}
        title="Очистить историю чата?"
        description="Вы уверены, что хотите очистить всю историю переписки? Это действие нельзя отменить."
        confirmText="Очистить"
        cancelText="Отмена"
      />
    </>
  );
}
