/** Адреса опросов клиента. `/client/surveys/{id}` открывает и web push (backend surveyPush.js). */

/** Опрос: вступление, вопросы и итог прохождения. */
export const surveyHref = (surveyId: number) => `/client/surveys/${surveyId}`;

/** «К опросам»: вкладка «Опросы» в «Все новости» (`?tab=surveys`, hooks/use-news-section.ts). */
export const NEWS_SURVEYS_HREF = "/client/news?tab=surveys";
