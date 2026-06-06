"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PRIVACY_CONTENT, type PrivacyLanguage } from "@/constants/privacy-content";

/** Desktop privacy view — pixel-parity с прежним app/privacy/page.tsx */
export function PrivacyViewDesktop() {
  const [lang, setLang] = useState<PrivacyLanguage>("ru");
  const content = PRIVACY_CONTENT[lang];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#040404" }}>
      <div className="flex flex-col px-4 pt-6 pb-8 md:px-8 md:pt-8 max-w-5xl mx-auto w-full flex-1">
        <Link
          href="/login"
          className="flex items-center gap-2 self-start mb-4 group"
          style={{ color: "#6E6E6E" }}
        >
          <ArrowLeft className="w-5 h-5 group-hover:opacity-80 transition-opacity" />
          <span
            style={{
              fontFamily: "'SF Pro Text', sans-serif",
              fontWeight: 500,
              fontSize: "18px",
            }}
          >
            {lang === "ru" ? "Назад" : "Back"}
          </span>
        </Link>

        <div
          className="flex flex-col flex-1 rounded-xl overflow-hidden min-h-[calc(100vh-140px)]"
          style={{ background: "#ffffff", color: "#212121" }}
        >
          <div className="p-5 md:p-6 pb-0 flex-shrink-0">
            <div className="flex gap-2 mb-5">
              {(["ru", "en"] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLang(code)}
                  className="px-5 py-2.5 rounded-full text-sm font-medium transition-colors"
                  style={{
                    fontFamily: "'SF Pro Text', sans-serif",
                    background: lang === code ? "#F35713" : "#ffffff",
                    color: lang === code ? "#ffffff" : "#212121",
                    border: lang === code ? "none" : "1px solid #e0e0e0",
                  }}
                >
                  {code.toUpperCase()}
                </button>
              ))}
            </div>

            <h1
              className="text-center font-bold mb-2"
              style={{
                fontFamily: "'SF Pro Text', sans-serif",
                fontSize: "26px",
                lineHeight: "32px",
                color: "#212121",
              }}
            >
              {content.title}
            </h1>
            <p
              className="text-center mb-1"
              style={{
                fontFamily: "'SF Pro Text', sans-serif",
                fontSize: "18px",
                color: "#212121",
              }}
            >
              {content.subtitle}
            </p>
            <p
              className="text-center mb-5"
              style={{
                fontFamily: "'SF Pro Text', sans-serif",
                fontSize: "15px",
                color: "#6E6E6E",
              }}
            >
              {content.lastUpdate}
            </p>
          </div>

          <div className="privacy-card-scroll flex-1 overflow-y-auto px-5 md:px-6 pb-5 md:pb-6">
            <div className="flex flex-col gap-6">
              {content.sections.map((section) => (
                <div key={section.heading}>
                  <h2
                    className="font-bold mb-3"
                    style={{
                      fontFamily: "'SF Pro Text', sans-serif",
                      fontSize: "18px",
                      lineHeight: "26px",
                    }}
                  >
                    {section.heading}
                  </h2>
                  <div
                    className="whitespace-pre-line text-[16px] leading-[26px]"
                    style={{ fontFamily: "'SF Pro Text', sans-serif" }}
                  >
                    {section.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
