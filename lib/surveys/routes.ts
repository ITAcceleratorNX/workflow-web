/** Адреса опросов. `/client/surveys/{id}` открывает и web push (backend surveyPush.js). */

/** Опрос: вступление, вопросы и итог прохождения. */
export const surveyHref = (surveyId: number) => `/client/surveys/${surveyId}`;

/** «К опросам»: вкладка «Опросы» в «Все новости» (`?tab=surveys`, hooks/use-news-section.ts). */
export const NEWS_SURVEYS_HREF = "/client/news?tab=surveys";

// Администратор: экраны опроса в «Управление новостями» (docs/surveys-plan.md, шаги 13–15).
const ADMIN_SURVEYS = "/admin-worker/management/news/surveys";

/** Список опросов: вкладка «Опросы» в «Управление новостями». */
export const ADMIN_SURVEYS_HREF = "/admin-worker/management/news?tab=surveys";

/** Конструктор нового опроса. */
export const ADMIN_SURVEY_NEW_HREF = `${ADMIN_SURVEYS}/new`;

/** Черновик в конструкторе. */
export const adminSurveyEditHref = (surveyId: number) => `${ADMIN_SURVEYS}/${surveyId}/edit`;

/** Предпросмотр: опрос глазами клиента, ответы не сохраняются. */
export const adminSurveyPreviewHref = (surveyId: number) => `${ADMIN_SURVEYS}/${surveyId}/preview`;

/** Результаты опубликованного или завершённого опроса. */
export const adminSurveyResultsHref = (surveyId: number) => `${ADMIN_SURVEYS}/${surveyId}/results`;
