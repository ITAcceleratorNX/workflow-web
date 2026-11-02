"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  toastDraftSaveFailed,
  toastDraftSaved,
  toastPublishFailed,
  toastQuestionDeleted,
  toastSurveyPublished,
} from "@/components/surveys/survey-toasts";
import { useToast } from "@/hooks/use-toast";
import {
  draftFromSurvey,
  draftInput,
  draftProblems,
  draftSnapshot,
  emptyDraft,
  hasDraftProblems,
  moveQuestion,
  publishProblems,
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

/** Что проверяет форма: «Сохранить черновик» и «Предпросмотр» — черновик, «Опубликовать» — ещё офисы и вопросы. */
export type DraftCheck = "draft" | "publish";

const problemsOf = (check: DraftCheck, draft: SurveyDraft) => (check === "publish" ? publishProblems(draft) : draftProblems(draft));

/**
 * Конструктор опроса (docs/surveys-plan.md, шаги 13–14): новый опрос или сохранённый черновик, его
 * вопросы, «Сохранить черновик» и «Опубликовать». Первое сохранение нового опроса создаёт его, и адрес
 * становится адресом черновика (`/surveys/{id}/edit`); следующие заменяют черновик целиком.
 * Опубликованный опрос не правится: его адрес ведёт к списку опросов.
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
  const [publishing, setPublishing] = useState(false);
  // Ошибки полей видны после проверки, которая их нашла, и дальше следуют за правками; проверка без ошибок их прячет.
  const [checked, setChecked] = useState<DraftCheck | null>(null);
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

  /** Проверка формы: ошибки остаются на виду и возвращаются; null — ошибок нет. */
  const check = useCallback(
    (kind: DraftCheck): DraftProblems | null => {
      const problems = problemsOf(kind, draft);
      const found = hasDraftProblems(problems);
      setChecked(found ? kind : null);
      return found ? problems : null;
    },
    [draft],
  );

  /** POST нового опроса или PUT черновика; новый опрос получает адрес черновика. */
  const persist = useCallback(async () => {
    const input = draftInput(draft);
    const result = id == null ? await surveysApi.createSurvey(input) : await surveysApi.updateSurvey(id, input);
    if (!result.ok) return result;
    setSaved(JSON.stringify(input));
    if (id == null) {
      setId(result.data.id);
      // Адрес черновика без перехода: форма остаётся как есть, обновление страницы откроет черновик.
      window.history.replaceState(null, "", adminSurveyEditHref(result.data.id));
    }
    return result;
  }, [draft, id]);

  /** «Сохранить черновик»: с ошибками ничего не уходит, форма их показывает (их возвращает и вызов). */
  const save = useCallback(async (): Promise<DraftProblems | null> => {
    const problems = check("draft");
    if (problems) return problems;
    setSaving(true);
    const result = await persist();
    setSaving(false);
    if (result.ok) toastDraftSaved(toast);
    else toastDraftSaveFailed(toast, result.error);
    return null;
  }, [check, persist, toast]);

  /**
   * «Опубликовать» в подтверждении (форму уже проверил `check("publish")`): несохранённые правки
   * уходят первыми, затем публикация и переход к списку опросов. false — не вышло, причина в уведомлении.
   */
  const publish = useCallback(async () => {
    setPublishing(true);
    let surveyId = id;
    let failure: string | null = null;
    if (surveyId == null || dirty) {
      const result = await persist();
      if (result.ok) surveyId = result.data.id;
      else failure = result.error;
    }
    if (surveyId != null && !failure) {
      const result = await surveysApi.publishSurvey(surveyId);
      if (!result.ok) failure = result.error;
    }
    setPublishing(false);
    if (failure) {
      toastPublishFailed(toast, failure);
      return false;
    }
    toastSurveyPublished(toast);
    router.replace(ADMIN_SURVEYS_HREF);
    return true;
  }, [id, dirty, persist, toast, router]);

  return {
    /** null — опрос ещё не сохранён. */
    id,
    draft,
    loading,
    loadError,
    reload: load,
    saving,
    publishing,
    dirty,
    /** Ошибки полей, если их пора показывать. */
    problems: checked ? problemsOf(checked, draft) : null,
    nextKey,
    patch,
    chooseAllOffices,
    chooseOffice,
    saveQuestion,
    reorderQuestion,
    deleteQuestion,
    check,
    save,
    publish,
  };
}

export type UseSurveyConstructorResult = ReturnType<typeof useSurveyConstructor>;
