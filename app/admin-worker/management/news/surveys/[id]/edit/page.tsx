"use client";

import { Suspense, use } from "react";
import { SurveyConstructor } from "@/components/surveys/constructor/survey-constructor";

/** Черновик опроса в конструкторе: «Изменить» в списке опросов. */
export default function AdminWorkerEditSurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  // Неверный адрес сервер не найдёт: экран покажет «Не удалось загрузить опрос».
  const surveyId = /^\d{1,10}$/.test(id) ? Number(id) : 0;
  return (
    <Suspense fallback={null}>
      <SurveyConstructor key={id} surveyId={surveyId} />
    </Suspense>
  );
}
