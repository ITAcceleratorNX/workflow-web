"use client";

import { Suspense } from "react";
import { SurveyConstructor } from "@/components/surveys/constructor/survey-constructor";

/** Конструктор нового опроса: «Управление новостями» → «Опросы» → «Добавить опрос». */
export default function AdminWorkerNewSurveyPage() {
  // Экран «Вопрос N» на Mobile читает адрес (useSearchParams).
  return (
    <Suspense fallback={null}>
      <SurveyConstructor surveyId={null} />
    </Suspense>
  );
}
