"use client";

import { use } from "react";
import { AdminSurveyPreviewScreen } from "@/components/surveys/survey-preview";

/** Предпросмотр опроса глазами клиента: «Предпросмотр» в списке опросов. */
export default function AdminWorkerSurveyPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  // Неверный адрес сервер не найдёт: экран покажет «Не удалось загрузить опрос».
  const surveyId = /^\d{1,10}$/.test(id) ? Number(id) : 0;
  return <AdminSurveyPreviewScreen key={id} surveyId={surveyId} />;
}
