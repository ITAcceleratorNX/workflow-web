"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import {
  calculateDeskHeights,
  DESK_HEIGHT_OPTIONS,
} from "@/lib/meeting-room-desk-height";

/** Mobile-калькулятор высоты стола — RN parity для `/meeting-rooms`. */
export function DeskHeightCalculatorMobile() {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [calculatedHeight, setCalculatedHeight] = useState<{
    sitting: number;
    standing: number;
  } | null>(null);
  const [showHeightDropdown, setShowHeightDropdown] = useState(false);

  const updateCalculation = (heightValue: string, weightValue: string) => {
    const h = parseFloat(heightValue);
    const w = parseFloat(weightValue);
    const result = calculateDeskHeights(h, !Number.isNaN(w) && w > 0 ? w : undefined);
    setCalculatedHeight(result);
  };

  return (
    <div className="space-y-6">
      <p className="text-[#D5D5D5] text-xs leading-4">
        Введите ваш рост и вес (опционально), чтобы получить рекомендации по высоте стола
      </p>

      <div className="space-y-2">
        <label className="text-white font-medium text-base">Ваш рост (в см)</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={height}
            onChange={(e) => {
              setHeight(e.target.value);
              updateCalculation(e.target.value, weight);
            }}
            placeholder="175"
            className="flex-1 bg-transparent border border-[#3A3A3A] rounded-lg px-4 py-3 text-white text-xs placeholder-[#6E6E6E] focus:outline-none focus:border-[#F35713]"
          />
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowHeightDropdown(!showHeightDropdown)}
              className="h-full px-4 bg-transparent border border-[#3A3A3A] rounded-lg text-white text-xs flex items-center gap-2 min-w-[100px]"
            >
              <span className="text-[#6E6E6E]">Выбрать</span>
              <ChevronRight
                className={`w-3 h-3 text-[#6E6E6E] transition-transform ${showHeightDropdown ? "rotate-90" : ""}`}
              />
            </button>
            {showHeightDropdown && (
              <div className="absolute top-full mt-1 right-0 bg-[#1C1C1E] border border-[#3A3A3A] rounded-lg overflow-hidden z-10 max-h-[200px] overflow-y-auto w-[100px]">
                {DESK_HEIGHT_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      const value = option.toString();
                      setHeight(value);
                      setShowHeightDropdown(false);
                      updateCalculation(value, weight);
                    }}
                    className={`w-full px-4 py-2 text-left text-xs hover:bg-[#F35713]/20 ${
                      height === option.toString()
                        ? "bg-[#F35713]/30 text-[#F35713]"
                        : "text-white"
                    }`}
                  >
                    {option} см
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <div className="space-y-2">
          <label className="text-white font-medium text-base">Ваш вес (в кг)</label>
          <input
            type="number"
            value={weight}
            onChange={(e) => {
              setWeight(e.target.value);
              updateCalculation(height, e.target.value);
            }}
            placeholder="70"
            className="w-full bg-transparent border border-[#3A3A3A] rounded-lg px-4 py-3 text-white text-xs placeholder-[#6E6E6E] focus:outline-none focus:border-[#F35713]"
          />
        </div>
        <p className="text-[#8D8D8D] text-[8px] leading-[14px]">
          Укажите вес для более точного расчёта высоты стола в положении стоя
        </p>
      </div>

      {calculatedHeight && (
        <div className="flex gap-4">
          <div className="flex-1 bg-[#E25B21] rounded-[10px] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium text-[15px]">Сидя</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.25 1.75C5.25 2.7165 4.4665 3.5 3.5 3.5C2.5335 3.5 1.75 2.7165 1.75 1.75C1.75 0.7835 2.5335 0 3.5 0C4.4665 0 5.25 0.7835 5.25 1.75Z" fill="white"/>
                <path d="M7 5.25H4.375C3.89175 5.25 3.5 5.64175 3.5 6.125V10.5H5.25V14H7V5.25Z" fill="white"/>
                <path d="M3.5 6.125V8.75H1.75L0 14H1.75L3.5 8.75" fill="white"/>
              </svg>
            </div>
            <span className="text-white font-medium text-xl">{calculatedHeight.sitting} см</span>
          </div>

          <div className="flex-1 bg-[#E25B21] rounded-[10px] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium text-[15px]">Стоя</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 3.5C8.10457 3.5 9 2.60457 9 1.5C9 0.395431 8.10457 -0.5 7 -0.5C5.89543 -0.5 5 0.395431 5 1.5C5 2.60457 5.89543 3.5 7 3.5Z" fill="white"/>
                <path d="M5.5 4.5H8.5V8.5H10V10H8.5V14H5.5V10H4V8.5H5.5V4.5Z" fill="white"/>
              </svg>
            </div>
            <span className="text-white font-medium text-xl">{calculatedHeight.standing} см</span>
          </div>
        </div>
      )}
    </div>
  );
}
