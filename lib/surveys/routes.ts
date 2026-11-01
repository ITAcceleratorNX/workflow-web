/** Адреса опросов клиента. `/client/surveys/{id}` открывает и web push (backend surveyPush.js). */

/** Опрос: вступление, вопросы и итог прохождения. */
export const surveyHref = (surveyId: number) => `/client/surveys/${surveyId}`;
