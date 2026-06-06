"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PRIVACY_CONTENT, type PrivacyLanguage } from "@/constants/privacy-content";

/** Mobile privacy — parity с workflow-mobile/app/privacy/index.tsx */
export function PrivacyViewMobile() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [lang, setLang] = useState<PrivacyLanguage>("ru");
  const [sectionOffsets, setSectionOffsets] = useState<number[]>([]);
  const [activeSection, setActiveSection] = useState(0);

  const content = PRIVACY_CONTENT[lang];

  useEffect(() => {
    setSectionOffsets([]);
    setActiveSection(0);
    scrollRef.current?.scrollTo({ top: 0 });
  }, [lang]);

  const handleSectionLayout = useCallback(
    (index: number) => (node: HTMLDivElement | null) => {
      if (!node || !scrollRef.current) return;
      const containerTop = scrollRef.current.getBoundingClientRect().top;
      const y = node.getBoundingClientRect().top - containerTop + scrollRef.current.scrollTop;
      setSectionOffsets((prev) => {
        const next = [...prev];
        next[index] = y;
        return next;
      });
    },
    []
  );

  const scrollToSection = useCallback(
    (index: number) => {
      const y = sectionOffsets[index];
      if (y !== undefined && scrollRef.current) {
        scrollRef.current.scrollTo({ top: y - 16, behavior: "smooth" });
        setActiveSection(index);
      }
    },
    [sectionOffsets]
  );

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || sectionOffsets.length === 0) return;
    const offsetY = el.scrollTop;
    let idx = 0;
    for (let i = 0; i < sectionOffsets.length; i++) {
      if (sectionOffsets[i] != null && offsetY >= sectionOffsets[i] - 32) {
        idx = i;
      }
    }
    setActiveSection(idx);
  }, [sectionOffsets]);

  return (
    <div className="min-h-screen flex flex-col bg-background safe-area-top safe-area-bottom">
      <div className="flex flex-1 flex-col px-4 pb-4 pt-2">
        <div className="flex items-center gap-3 border-b border-[#212121] pb-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex h-11 w-11 items-center justify-center text-primary"
            aria-label="Назад"
          >
            <ChevronLeft className="h-7 w-7" strokeWidth={2.5} />
          </button>
          <h1 className="flex-1 text-center text-lg font-bold leading-[22px] text-white">
            {content.title}
          </h1>
          <div className="flex gap-2">
            {(["ru", "en"] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLang(code)}
                className="rounded-full border px-4 py-2 text-[13px] font-semibold"
                style={{
                  borderColor: lang === code ? "#F35713" : "#212121",
                  background: lang === code ? "#F35713" : "transparent",
                  color: lang === code ? "#FFFFFF" : undefined,
                }}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="py-2.5 text-center">
          <p className="text-sm leading-5 text-[#7F7F7F]">{content.subtitle}</p>
          <p className="mt-1 text-xs text-[#7F7F7F]">{content.lastUpdate}</p>
        </div>

        <div className="border-b border-[#212121] py-2.5">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {content.sections.map((section, index) => (
              <button
                key={section.heading}
                type="button"
                onClick={() => scrollToSection(index)}
                className="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold"
                style={{
                  borderColor: activeSection === index ? "#F35713" : "#212121",
                  background: activeSection === index ? "#F35713" : "transparent",
                  color: activeSection === index ? "#FFFFFF" : "#7F7F7F",
                }}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#212121]">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-5"
          >
            {content.sections.map((section, index) => (
              <div
                key={section.heading}
                ref={handleSectionLayout(index)}
                className="mb-6 flex flex-col gap-2.5 last:mb-0"
              >
                <h2 className="text-[17px] font-bold leading-6 text-white">
                  {section.heading}
                </h2>
                <p className="whitespace-pre-line text-[15px] leading-6 text-white/90">
                  {section.content}
                </p>
              </div>
            ))}
            <div className="h-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
