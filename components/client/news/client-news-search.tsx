"use client";

import { useRef } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ClientNewsSearchProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function ClientNewsSearch({ value, onChange, className }: ClientNewsSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={cn("flex min-h-12 items-center gap-2 rounded-xl border border-[#3A3A3C] bg-[#2C2C2E] px-3 focus-within:ring-2 focus-within:ring-[#F35713]", className)}>
      <Search aria-hidden="true" className="h-5 w-5 shrink-0 text-[#8E8E93]" />
      <input
        ref={inputRef}
        type="search"
        aria-label="Поиск новостей"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Поиск новостей..."
        className="news-search-input h-11 min-w-0 flex-1 appearance-none border-0 bg-transparent py-2 text-base text-white placeholder:text-[#8E8E93] outline-none [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value.length > 0 && (
        <button
          type="button"
          aria-label="Очистить поиск"
          className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[#8E8E93] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F35713]"
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
