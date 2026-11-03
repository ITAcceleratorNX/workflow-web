"use client";

import { use } from "react";
import { SurveyScreen } from "@/components/surveys/survey-screen";

/** Опрос клиента: вступление, вопросы и итог. Адрес открывает и push «Новый опрос». */
export default function ClientSurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  // Неверный адрес — тот же «Опрос недоступен», без запроса. Другой опрос — заново, без прежних ответов.
  const surveyId = /^[1-9]\d{0,9}$/.test(id) ? Number(id) : null;
  return <SurveyScreen key={id} surveyId={surveyId} />;
}
