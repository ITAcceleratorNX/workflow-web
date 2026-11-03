"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Eye, ListChecks, Loader2, Plus, Send } from "lucide-react";
import { AdminWorkerManagementMobileLayout } from "@/components/admin-worker/management/admin-worker-management-mobile-layout";
import { DesktopManagementPage } from "@/components/layout/desktop-management-page";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FieldError, FieldInput, FieldLabel, FieldTextarea } from "@/components/ui/field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useIsDesktop } from "@/hooks/use-media-query";
import { useSurveyConstructor, type UseSurveyConstructorResult } from "@/hooks/use-survey-constructor";
import {
  DRAFT_LIMITS,
  hasQuestionProblems,
  newQuestion,
  questionProblems,
  type DraftProblems,
  type DraftQuestion,
} from "@/lib/surveys/draft";
import { durationLabel, publishConfirmText, questionsCountLabel, responseModeHint } from "@/lib/surveys/format";
import { estimateMinutes, previewFromDraft } from "@/lib/surveys/preview";
import { ADMIN_SURVEYS_HREF } from "@/lib/surveys/routes";
import type { SurveyQuestionType, SurveyToTake } from "@/lib/surveys/types";
import { cn } from "@/lib/utils";
import { DESKTOP_ACTION, SurveyRetryButton, type SurveyLayout } from "../survey-frame";
import { SurveyPreview, SurveyPreviewDialog } from "../survey-preview";
import { OfficesField } from "./offices-field";
import { QuestionEditor, type QuestionEditorHandle } from "./question-editor";
import { QuestionList } from "./question-list";
import { QuestionTypeMenu } from "./question-type-menu";

type FormProps = { builder: UseSurveyConstructorResult; layout: SurveyLayout };

type FieldRefs = { titleRef: React.Ref<HTMLInputElement>; officesRef: React.Ref<HTMLButtonElement> };

/** Заголовок, описание, офисы и режим ответов. */
function SurveyFields({ builder, layout, titleRef, officesRef }: FormProps & FieldRefs) {
  const { draft, problems, patch, chooseAllOffices, chooseOffice } = builder;
  const titleId = useId();
  const titleErrorId = useId();
  const descriptionId = useId();
  const modeId = useId();
  // On Mobile the form is a raised card: its fields are darker, as in the mockup.
  const fieldTone = layout === "mobile" ? "bg-ui-surface" : undefined;
  return (
    <>
      <div className="flex flex-col gap-2">
        <FieldLabel htmlFor={titleId}>Заголовок *</FieldLabel>
        <FieldInput
          ref={titleRef}
          id={titleId}
          value={draft.title}
          placeholder="Название опроса"
          maxLength={DRAFT_LIMITS.title}
          aria-invalid={Boolean(problems?.title)}
          aria-describedby={problems?.title ? titleErrorId : undefined}
          onChange={(event) => patch({ title: event.target.value })}
          className={cn(layout === "mobile" ? "h-[50px]" : "h-12", fieldTone)}
        />
        {problems?.title ? <FieldError id={titleErrorId}>{problems.title}</FieldError> : null}
      </div>
      <div className="flex flex-col gap-2">
        <FieldLabel htmlFor={descriptionId}>Описание</FieldLabel>
        <FieldTextarea
          id={descriptionId}
          value={draft.description}
          placeholder="Коротко о том, зачем опрос"
          maxLength={DRAFT_LIMITS.description}
          onChange={(event) => patch({ description: event.target.value })}
          className={cn("min-h-[100px] leading-[22px]", fieldTone)}
        />
      </div>
      <OfficesField
        layout={layout}
        allOffices={draft.allOffices}
        officeIds={draft.officeIds}
        onToggleAll={chooseAllOffices}
        onToggle={chooseOffice}
        error={problems?.offices}
        buttonRef={officesRef}
      />
      <div className="flex flex-col gap-2">
        <p id={modeId} className="text-[13px] font-medium text-ui-fg/55">
          Режим ответов
        </p>
        <SegmentedControl
          tone="filled"
          fill
          ariaLabel="Режим ответов"
          value={draft.anonymous ? "anonymous" : "named"}
          onChange={(mode) => patch({ anonymous: mode === "anonymous" })}
          options={[
            { value: "anonymous", label: "Анонимный" },
            { value: "named", label: "Именной" },
          ]}
          // The track stands out from its background: darker on the raised card of Mobile, raised on the Desktop page.
          className={layout === "mobile" ? "rounded-[14px] bg-ui-surface p-1" : "rounded-4pt-md border border-ui-fg/10 bg-ui-raised p-1"}
          optionClassName="min-h-10 rounded-[10px] text-[15px] font-semibold"
        />
        <p className="text-[13px] text-ui-fg/55">{responseModeHint(draft.anonymous)}</p>
      </div>
    </>
  );
}

type QuestionsBlockProps = FormProps & {
  addQuestion: (type: SurveyQuestionType) => void;
  selectedKey: string | null;
  openQuestion: (key: string) => void;
  /** «Добавить вопрос»: the focus of «Опубликовать» without questions. */
  addRef: React.Ref<HTMLButtonElement>;
};

/** «Вопросы»: пусто — подсказка; иначе список и «Добавить вопрос» с выбором типа. */
function QuestionsBlock({ builder, layout, addQuestion, selectedKey, openQuestion, addRef }: QuestionsBlockProps) {
  const desktop = layout === "desktop";
  const { draft, problems, reorderQuestion, deleteQuestion } = builder;
  const [menu, setMenu] = useState(false);
  const errorId = useId();
  const count = draft.questions.length;
  const full = count >= DRAFT_LIMITS.questions;
  const error = problems?.noQuestions;
  const addProps = { ref: addRef, "aria-describedby": error ? errorId : undefined };

  const addButton = count ? (
    <Button
      {...addProps}
      variant="accent-outline"
      disabled={full}
      onClick={desktop ? undefined : () => setMenu(true)}
      className="h-[50px] w-full rounded-4pt-md border-dashed border-ui-fg/20 text-base"
    >
      <Plus aria-hidden />
      Добавить вопрос
    </Button>
  ) : desktop ? (
    <Button {...addProps} variant="accent" size="md" className={DESKTOP_ACTION}>
      <Plus aria-hidden />
      Добавить вопрос
    </Button>
  ) : (
    <Button
      {...addProps}
      variant="raised"
      onClick={() => setMenu(true)}
      className="h-[50px] w-full rounded-[14px] bg-ui-accent-soft text-base text-ui-accent-on-soft hover:bg-ui-accent-soft hover:brightness-125"
    >
      <Plus aria-hidden />
      Добавить вопрос
    </Button>
  );
  const add = <QuestionTypeMenu layout={layout} open={menu} onOpenChange={setMenu} onSelect={addQuestion} trigger={addButton} />;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[13px] font-medium text-ui-fg/55">{count ? `Вопросы · ${count}` : "Вопросы"}</p>
        {desktop && count ? <p className="text-right text-xs text-ui-fg/55">Перетащите, чтобы изменить порядок</p> : null}
      </div>
      {count ? (
        <QuestionList
          questions={draft.questions}
          layout={layout}
          problems={problems?.questions ?? null}
          selectedKey={selectedKey}
          onOpen={openQuestion}
          onMove={reorderQuestion}
          onDelete={deleteQuestion}
        />
      ) : (
        <div className={cn("rounded-4pt-lg border border-dashed px-4 py-7", error ? "border-ui-danger/70" : "border-ui-fg/20")}>
          <EmptyState
            tile="neutral"
            icon={<ListChecks />}
            title="Вопросов пока нет"
            description="Добавьте хотя бы один вопрос, чтобы опубликовать опрос"
            action={desktop ? add : undefined}
          />
        </div>
      )}
      {count || !desktop ? add : null}
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  );
}

type ActionsProps = FormProps & { onPreview: () => void; onSave: () => void; onPublish: () => void };

/** «Предпросмотр», «Сохранить черновик», «Опубликовать». */
function SurveyActions({ builder, layout, onPreview, onSave, onPublish }: ActionsProps) {
  const desktop = layout === "desktop";
  const busy = builder.saving || builder.publishing;
  const action = { size: desktop ? ("md" as const) : ("block" as const), className: desktop ? DESKTOP_ACTION : undefined };
  return (
    <div className={cn("flex", desktop ? "justify-end gap-2.5 border-t border-ui-fg/10 pt-[18px]" : "flex-col gap-2.5 pt-1")}>
      {/* On the raised card of Mobile a filled button would not show: outlined, as in the mockup. */}
      <Button
        variant={desktop ? "raised" : "neutral-outline"}
        {...action}
        onClick={onPreview}
        // Without questions there is nothing to show: the empty block says what to add.
        disabled={busy || !builder.draft.questions.length}
      >
        <Eye aria-hidden />
        Предпросмотр
      </Button>
      <Button variant="neutral-outline" {...action} onClick={onSave} disabled={busy} aria-busy={builder.saving}>
        {builder.saving ? <Loader2 aria-hidden className="animate-spin" /> : null}
        Сохранить черновик
      </Button>
      <Button variant="accent" {...action} onClick={onPublish} disabled={busy}>
        Опубликовать
      </Button>
    </div>
  );
}

type PageProps = {
  layout: SurveyLayout;
  title: string;
  onBack: () => void;
  children: ReactNode;
};

/** The page of the constructor: Mobile — the management header with «Назад», Desktop — «Опрос». */
function ConstructorPage({ layout, title, onBack, children }: PageProps) {
  if (layout === "desktop") {
    return (
      <DesktopManagementPage title="Опрос" backHref={ADMIN_SURVEYS_HREF} onBack={onBack}>
        <div className="flex flex-col gap-[18px] text-ui-fg">
          <h2 className="text-xl font-bold">{title}</h2>
          {children}
        </div>
      </DesktopManagementPage>
    );
  }
  return (
    <AdminWorkerManagementMobileLayout title={title} backHref={ADMIN_SURVEYS_HREF} onBack={onBack}>
      <div className="flex flex-col gap-4 rounded-[24px] bg-ui-raised p-4 text-ui-fg">{children}</div>
    </AdminWorkerManagementMobileLayout>
  );
}

/**
 * Конструктор опроса Администратора (Figma «Новый опрос — пустая форма» … «Опубликовать опрос?»):
 * поля, офисы и режим, вопросы пяти типов, «Предпросмотр», «Сохранить черновик» и «Опубликовать»
 * с подтверждением. На Mobile вопрос правится на экране «Вопрос N» со своей записью в истории
 * (браузерное «Назад» закрывает его без сохранения), на Desktop — сразу в панели справа.
 */
export function SurveyConstructor({ surveyId }: { surveyId: number | null }) {
  const layout: SurveyLayout = useIsDesktop() ? "desktop" : "mobile";
  const desktop = layout === "desktop";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const builder = useSurveyConstructor(surveyId);
  const { draft, nextKey, saveQuestion } = builder;
  const titleRef = useRef<HTMLInputElement>(null);
  const officesRef = useRef<HTMLButtonElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const [leaving, setLeaving] = useState(false);
  const [preview, setPreview] = useState<SurveyToTake | null>(null);
  const [publishAsked, setPublishAsked] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [editing, setEditing] = useState<DraftQuestion | null>(null);
  const [editorProblems, setEditorProblems] = useState(false);
  const editorRef = useRef<QuestionEditorHandle>(null);
  const [editorFocus, setEditorFocus] = useState(0);

  // The editor takes the focus once it shows what it was asked for: a new question, its errors.
  useEffect(() => {
    if (editorFocus) editorRef.current?.focus();
  }, [editorFocus]);
  const focusEditor = () => setEditorFocus((count) => count + 1);

  const title = builder.id == null ? "Новый опрос" : "Черновик";

  const leave = useCallback(() => {
    if (window.history.length > 1) router.back();
    else router.replace(ADMIN_SURVEYS_HREF);
  }, [router]);
  const back = () => (builder.dirty ? setLeaving(true) : leave());

  // Mobile «Вопрос N»: opened with its own entry in the history, so «Назад» of the browser closes it.
  const openEditor = (question: DraftQuestion) => {
    setEditing(question);
    setEditorProblems(false);
    window.history.pushState(null, "", `${pathname}?question=${question.key}`);
  };
  const closeEditor = () => window.history.back();
  const editorOpen = !desktop && editing != null && searchParams.get("question") === editing.key;

  const addQuestion = (type: SurveyQuestionType) => {
    const question = newQuestion(type, nextKey);
    if (desktop) {
      saveQuestion(question);
      setSelectedKey(question.key);
      focusEditor();
    } else {
      openEditor(question);
    }
  };
  const openQuestion = (key: string) => {
    if (desktop) {
      setSelectedKey(key);
      return;
    }
    const question = draft.questions.find((item) => item.key === key);
    if (question) openEditor(question);
  };

  /** Errors found by a check: an invalid question opens in the panel; the first error takes the focus, in the order of the form. */
  const showProblems = (problems: DraftProblems) => {
    const invalid = draft.questions.find((question) => problems.questions[question.key]);
    if (invalid && desktop) setSelectedKey(invalid.key);
    if (problems.title) titleRef.current?.focus();
    else if (problems.offices) officesRef.current?.focus();
    else if (problems.noQuestions) addRef.current?.focus();
    else if (invalid && desktop) focusEditor();
  };

  const saveDraft = async () => {
    const problems = await builder.save();
    if (problems) showProblems(problems);
  };

  // «Предпросмотр» shows the form as it is now, unsaved edits too. Mobile: a screen of its own with
  // an entry in the history, so «Назад» of the browser closes it; Desktop: a window over the form.
  const openPreview = () => {
    const problems = builder.check("draft");
    if (problems) {
      showProblems(problems);
      return;
    }
    setPreview(previewFromDraft(draft));
    if (!desktop) window.history.pushState(null, "", `${pathname}?preview=1`);
  };
  const closePreview = () => (desktop ? setPreview(null) : window.history.back());
  const previewOpen = !desktop && preview != null && searchParams.get("preview") === "1";

  const askPublish = () => {
    const problems = builder.check("publish");
    if (problems) showProblems(problems);
    else setPublishAsked(true);
  };
  const minutes = estimateMinutes(draft.questions.map((question) => question.type));
  const publishDialog = (
    <ConfirmDialog
      open={publishAsked}
      onOpenChange={setPublishAsked}
      icon={<Send />}
      tone="accent"
      title="Опубликовать опрос?"
      description={publishConfirmText(draft.title.trim(), layout)}
      facts={[questionsCountLabel(draft.questions.length), ...(minutes == null ? [] : [durationLabel(minutes)])]}
      confirmLabel="Опубликовать"
      busy={builder.publishing}
      onConfirm={() => {
        void builder.publish().then((published) => {
          // A success leaves for the list of surveys; after a failure (in the notice) the form is back in view.
          if (!published) setPublishAsked(false);
        });
      }}
    />
  );

  const leaveDialog = (
    <ConfirmDialog
      open={leaving}
      onOpenChange={setLeaving}
      title="Выйти без сохранения?"
      description="Изменения не сохранятся"
      confirmLabel="Выйти"
      cancelLabel="Остаться"
      onConfirm={() => {
        setLeaving(false);
        leave();
      }}
    />
  );

  if (builder.loading || builder.loadError) {
    return (
      <ConstructorPage layout={layout} title={title} onBack={leave}>
        {builder.loadError ? (
          <div role="alert" className="py-10">
            <EmptyState
              icon={<AlertCircle />}
              title="Не удалось загрузить опрос"
              description={builder.loadError}
              action={<SurveyRetryButton onClick={() => void builder.reload()} />}
            />
          </div>
        ) : (
          <div role="status" aria-label="Загружаем опрос" className="flex flex-col gap-4">
            {[52, 100, 48, 140].map((height) => (
              <div key={height} style={{ height }} className="animate-pulse rounded-4pt-md bg-ui-fg/[0.06]" />
            ))}
          </div>
        )}
      </ConstructorPage>
    );
  }

  if (previewOpen && preview) return <SurveyPreview survey={preview} layout="mobile" onClose={closePreview} />;

  if (editorOpen && editing) {
    const index = draft.questions.findIndex((question) => question.key === editing.key);
    const problems = questionProblems(editing);
    return (
      <ConstructorPage layout={layout} title={`Вопрос ${index < 0 ? draft.questions.length + 1 : index + 1}`} onBack={closeEditor}>
        <QuestionEditor
          ref={editorRef}
          question={editing}
          layout={layout}
          problems={editorProblems ? problems : null}
          nextKey={nextKey}
          onChange={setEditing}
        />
        <Button
          variant="accent"
          size="block"
          onClick={() => {
            if (hasQuestionProblems(problems)) {
              setEditorProblems(true);
              focusEditor();
              return;
            }
            saveQuestion(editing);
            closeEditor();
          }}
        >
          Сохранить
        </Button>
      </ConstructorPage>
    );
  }

  const selected = desktop ? draft.questions.find((question) => question.key === selectedKey) ?? null : null;
  const selectedNumber = selected ? draft.questions.indexOf(selected) + 1 : 0;
  const form = (
    <>
      <SurveyFields builder={builder} layout={layout} titleRef={titleRef} officesRef={officesRef} />
      <QuestionsBlock
        builder={builder}
        layout={layout}
        addQuestion={addQuestion}
        selectedKey={selectedKey}
        openQuestion={openQuestion}
        addRef={addRef}
      />
    </>
  );
  const actions = (
    <SurveyActions
      builder={builder}
      layout={layout}
      onPreview={openPreview}
      onSave={() => void saveDraft()}
      onPublish={askPublish}
    />
  );

  return (
    <ConstructorPage layout={layout} title={title} onBack={back}>
      {desktop ? (
        <>
          {/* Figma: the form up to 600 px and the question beside it; a narrow screen puts the question under the form. */}
          <div className="flex flex-wrap items-start gap-6">
            <div className={cn("flex min-w-0 flex-[1_1_440px] flex-col gap-4", selected ? "max-w-[600px]" : "max-w-[860px]")}>{form}</div>
            {selected ? (
              <section
                aria-label={`Вопрос ${selectedNumber}`}
                className="flex min-w-0 flex-[1_1_340px] flex-col gap-4 rounded-4pt-lg border border-ui-fg/10 bg-ui-raised p-5"
              >
                <h3 className="text-base font-bold">Вопрос {selectedNumber}</h3>
                <QuestionEditor
                  ref={editorRef}
                  key={selected.key}
                  question={selected}
                  layout={layout}
                  problems={builder.problems?.questions[selected.key] ?? null}
                  nextKey={nextKey}
                  onChange={saveQuestion}
                />
              </section>
            ) : null}
          </div>
          {actions}
          <SurveyPreviewDialog survey={preview} onClose={closePreview} />
        </>
      ) : (
        <>
          {form}
          {actions}
        </>
      )}
      {leaveDialog}
      {publishDialog}
    </ConstructorPage>
  );
}
