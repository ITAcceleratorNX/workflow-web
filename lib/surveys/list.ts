import type { AdminSurveyFilter } from "./format";
import type { AdminSurvey, ClientSurvey } from "./types";

/**
 * Что показывает список опросов клиента. Сервер отдаёт доступные первыми (новые сверху), потом
 * пройденные; решения про точку и карточку — здесь, одни для Mobile и Desktop.
 */

export const availableSurveys = (surveys: readonly ClientSurvey[]) => surveys.filter((survey) => survey.state === "available");

export const completedSurveys = (surveys: readonly ClientSurvey[]) => surveys.filter((survey) => survey.state === "completed");

/** Точка на вкладке «Опросы»: есть доступный опрос, который клиент ещё не прошёл. */
export const hasAvailableSurveys = (surveys: readonly ClientSurvey[]) => surveys.some((survey) => survey.state === "available");

/** Опрос для карточки «Новый опрос» на главной и баннера Desktop — самый новый из доступных. */
export const latestAvailableSurvey = (surveys: readonly ClientSurvey[]) =>
  surveys.find((survey) => survey.state === "available") ?? null;

/** Опросы Администратора с выбранным статусом; порядок сервера (новые сверху) сохраняется. */
export const filterAdminSurveys = (surveys: readonly AdminSurvey[], filter: AdminSurveyFilter) =>
  filter === "all" ? [...surveys] : surveys.filter((survey) => survey.status === filter);
