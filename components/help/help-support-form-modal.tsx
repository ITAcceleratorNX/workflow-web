"use client";

import type { FormEvent } from "react";
import { Headphones, Loader2, Send, X } from "lucide-react";

type HelpSupportFormModalProps = {
  open: boolean;
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  submitting: boolean;
  error: string | null;
};

export function HelpSupportFormModal({
  open,
  value,
  onChange,
  onClose,
  onSubmit,
  submitting,
  error,
}: HelpSupportFormModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="bg-[#1C1C1E] w-full max-w-lg rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto pb-[calc(24px+env(safe-area-inset-bottom,0px)+80px)] md:pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Headphones className="w-5 h-5 text-[#E85D2B]" />
            Обращение в поддержку
          </h2>
          <button
            type="button"
            onClick={() => !submitting && onClose()}
            className="p-2 rounded-full bg-[#2C2C2E] text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-gray-400 text-sm mb-4">
          Опишите вашу проблему. Администратор свяжется с вами в чате.
        </p>
        <form onSubmit={onSubmit}>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Опишите проблему..."
            className="w-full border border-[#3A3A3C] rounded-xl p-4 bg-[#2C2C2E] text-white placeholder-gray-500 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-[#E85D2B] resize-none"
            disabled={submitting}
            rows={4}
          />
          {error ? <p className="text-[#E85D2B] text-sm mt-2">{error}</p> : null}
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={() => !submitting && onClose()}
              className="flex-1 py-3 rounded-xl bg-[#2C2C2E] text-gray-400 hover:text-white"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={!value.trim() || submitting}
              className="flex-1 py-3 rounded-xl bg-[#E85D2B] text-white hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Отправить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
