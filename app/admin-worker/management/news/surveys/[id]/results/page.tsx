"use client";

import { Suspense, use } from "react";
import { SurveyResultsScreen } from "@/components/surveys/results/survey-results-screen";

/** Опрос после публикации: «Результаты» в списке опросов. */
export default function AdminWorkerSurveyResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  // Неверный адрес сервер не найдёт: экран покажет «Не удалось загрузить результаты».
  const surveyId = /^\d{1,10}$/.test(id) ? Number(id) : 0;
  return (
    <Suspense fallback={null}>
      <SurveyResultsScreen key={id} surveyId={surveyId} />
    </Suspense>
  );
}
