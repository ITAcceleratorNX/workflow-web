"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toastDraftSaveFailed, toastDraftSaved, toastQuestionDeleted } from "@/components/surveys/survey-toasts";
import { useToast } from "@/hooks/use-toast";
import {
  draftFromSurvey,
  draftInput,
  draftProblems,
  draftSnapshot,
  emptyDraft,
  hasDraftProblems,
  moveQuestion,
  putQuestion,
  removeQuestion,
  restoreQuestion,
  toggleAllOffices,
  toggleOffice,
  type DraftProblems,
  type DraftQuestion,
  type SurveyDraft,
} from "@/lib/surveys/draft";
import { surveysApi } from "@/lib/surveys-api";
import { ADMIN_SURVEYS_HREF, adminSurveyEditHref } from "@/lib/surveys/routes";

type DraftFields = Partial<Pick<SurveyDraft, "title" | "description" | "anonymous">>;

/**
 * Конструктор опроса (docs/surveys-plan.md, шаг 13): новый опрос или сохранённый черновик, его
 * вопросы и «Сохранить черновик». Первое сохранение нового опроса создаёт его, и адрес становится
 * адресом черновика (`/surveys/{id}/edit`); следующие заменяют черновик целиком. Опубликованный
 * опрос не правится: его адрес ведёт к списку опросов.
 */
export function useSurveyConstructor(surveyId: number | null) {
  const router = useRouter();
  const { toast } = useToast();
  const [id, setId] = useState(surveyId);
  const [draft, setDraft] = useState<SurveyDraft>(emptyDraft);
  const [saved, setSaved] = useState(() => draftSnapshot(emptyDraft()));
  const [loading, setLoading] = useState(surveyId != null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Ошибки полей видны после первого «Сохранить черновик», который их нашёл, и дальше следуют за правками.
  const [showProblems, setShowProblems] = useState(false);
  const request = useRef<AbortController | null>(null);
  const keys = useRef(0);

  const nextKey = useCallback(() => `n${(keys.current += 1)}`, []);

  const load = useCallback(async () => {
    if (surveyId == null) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setLoadError(null);
    const result = await surveysApi.getAdminSurvey(surveyId, controller.signal);
    if (controller.signal.aborted) return;
    if (!result.ok) {
      setLoadError(result.error);
      setLoading(false);
      return;
    }
    if (result.data.status !== "draft") {
      router.replace(ADMIN_SURVEYS_HREF);
      return;
    }
    const form = draftFromSurvey(result.data);
    setDraft(form);
    setSaved(draftSnapshot(form));
    setLoading(false);
  }, [surveyId, router]);

  useEffect(() => {
    void load();
    return () => request.current?.abort();
  }, [load]);

  const dirty = draftSnapshot(draft) !== saved;

  // Обновление или закрытие вкладки с несохранёнными правками браузер переспросит сам.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const patch = useCallback((fields: DraftFields) => setDraft((current) => ({ ...current, ...fields })), []);

  const chooseAllOffices = useCallback(() => setDraft(toggleAllOffices), []);
  const chooseOffice = useCallback(
    (officeId: number, allIds: readonly number[]) => setDraft((current) => toggleOffice(current, officeId, allIds)),
    [],
  );

  /** Вопрос из редактора: новый — в конец списка, изменённый — на своё место. */
  const saveQuestion = useCallback((question: DraftQuestion) => setDraft((current) => putQuestion(current, question)), []);

  /** Перетаскивание за «⋮⋮»: вопрос `key` встаёт на место вопроса `overKey`. */
  const reorderQuestion = useCallback(
    (key: string, overKey: string) => setDraft((current) => moveQuestion(current, key, overKey)),
    [],
  );

  /** Вопрос удаляется сразу; уведомление «Вопрос удалён» ставит его на место по «Вернуть». */
  const deleteQuestion = useCallback(
    (key: string) => {
      const { draft: next, removed } = removeQuestion(draft, key);
      if (!removed) return;
      setDraft(next);
      toastQuestionDeleted(toast, () => setDraft((current) => restoreQuestion(current, removed)));
    },
    [draft, toast],
  );

  /**
   * «Сохранить черновик»: с ошибками ничего не уходит, форма их показывает (их возвращает и вызов);
   * иначе POST нового опроса или PUT черновика.
   */
  const save = useCallback(async (): Promise<DraftProblems | null> => {
    const problems = draftProblems(draft);
    if (hasDraftProblems(problems)) {
      setShowProblems(true);
      return problems;
    }
    setSaving(true);
    const input = draftInput(draft);
    const result = id == null ? await surveysApi.createSurvey(input) : await surveysApi.updateSurvey(id, input);
    setSaving(false);
    if (!result.ok) {
      toastDraftSaveFailed(toast, result.error);
      return null;
    }
    setSaved(JSON.stringify(input));
    if (id == null) {
      setId(result.data.id);
      // Адрес черновика без перехода: форма остаётся как есть, обновление страницы откроет черновик.
      window.history.replaceState(null, "", adminSurveyEditHref(result.data.id));
    }
    toastDraftSaved(toast);
    return null;
  }, [draft, id, toast]);

  return {
    /** null — опрос ещё не сохранён. */
    id,
    draft,
    loading,
    loadError,
    reload: load,
    saving,
    dirty,
    /** Ошибки полей, если их пора показывать. */
    problems: showProblems ? draftProblems(draft) : null,
    nextKey,
    patch,
    chooseAllOffices,
    chooseOffice,
    saveQuestion,
    reorderQuestion,
    deleteQuestion,
    save,
  };
}

export type UseSurveyConstructorResult = ReturnType<typeof useSurveyConstructor>;
