"use client";

import { useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { Check, ChevronLeft, ChevronRight, ClipboardList, Eye, PenLine, Send, TriangleAlert, X } from "lucide-react";
import { ActionBar } from "@/components/ui/action-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChipTabs } from "@/components/ui/chip-tabs";
import { ChoiceCard } from "@/components/ui/choice-card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { IconActions } from "@/components/ui/icon-actions";
import { InfoBanner } from "@/components/ui/info-banner";
import { RatingScale } from "@/components/ui/rating-scale";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { DragHandle, SortableItem, SortableList } from "@/components/ui/sortable-list";
import { StepProgress } from "@/components/ui/step-progress";

const OPTIONS = ["Каждый день", "Несколько раз в неделю", "Реже раза в неделю", "Не пользуюсь"];
const STATUSES = [
  { value: "all", label: "Все" },
  { value: "draft", label: "Черновики" },
  { value: "published", label: "Опубликованные" },
  { value: "closed", label: "Завершённые" },
] as const;

/** Компоненты экранов опросов на тёмном холсте, как в макетах (шаг 8, docs/surveys-plan.md). */
export function SurveyKitDemo() {
  const [section, setSection] = useState<"news" | "surveys">("surveys");
  const [single, setSingle] = useState(1);
  const [several, setSeveral] = useState<number[]>([0, 1]);
  const [rating, setRating] = useState<number | null>(4);
  const [yes, setYes] = useState<boolean | null>(true);
  const [status, setStatus] = useState<(typeof STATUSES)[number]["value"]>("all");
  const [order, setOrder] = useState(OPTIONS);
  const [publishAsked, setPublishAsked] = useState(false);

  return (
    <section className="mb-8 space-y-5 rounded-2xl bg-ui-canvas p-4 text-ui-fg">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ui-fg/60">Опросы</h2>

      <SegmentedControl
        tone="filled"
        fill
        ariaLabel="Раздел новостей"
        value={section}
        onChange={setSection}
        options={[
          { value: "news", label: "Новости" },
          {
            value: "surveys",
            label: <>Опросы<span aria-hidden className="size-2 rounded-full bg-ui-accent" /></>,
            ariaLabel: "Опросы, есть новый опрос",
          },
        ]}
        className="rounded-[14px] p-1"
        optionClassName="min-h-10 rounded-[10px] text-[15px] font-semibold"
      />

      <div className="flex items-center gap-2">
        <Badge variant="accent">Опрос</Badge>
        <Badge variant="success">Пройдено</Badge>
        <Badge variant="success">Опубликован</Badge>
        <Badge variant="neutral">Черновик</Badge>
        <Badge variant="neutral">Завершён</Badge>
      </div>

      <ChipTabs variant="solid" ariaLabel="Статус" value={status} onChange={setStatus} tabs={STATUSES} />
      <div className="rounded-4pt-md bg-ui-raised p-4">
        <ChipTabs variant="solid" size="md" ariaLabel="Статус на карточке Desktop" value={status} onChange={setStatus} tabs={STATUSES} />
      </div>

      <IconActions
        actions={[
          { label: "Изменить", icon: <PenLine aria-hidden />, onClick: () => undefined },
          { label: "Предпросмотр", icon: <Eye aria-hidden />, onClick: () => undefined },
        ]}
      />

      <InfoBanner icon={<Eye />} action={{ label: "Закрыть", onClick: () => undefined }}>
        Предпросмотр — так опрос увидит клиент. Ответы не сохраняются.
      </InfoBanner>
      <div className="overflow-hidden rounded-4pt-lg bg-ui-raised">
        <InfoBanner variant="strip" icon={<Eye />} action={{ label: "Закрыть", onClick: () => undefined }}>
          Предпросмотр — так опрос увидит клиент. Ответы не сохраняются.
        </InfoBanner>
        <div className="h-16" />
      </div>

      <Button variant="accent" size="md" onClick={() => setPublishAsked(true)}>
        Опубликовать
      </Button>
      <ConfirmDialog
        open={publishAsked}
        onOpenChange={setPublishAsked}
        icon={<Send />}
        tone="accent"
        title="Опубликовать опрос?"
        description="«Удобство раздела «Задачи»» появится у клиентов в «Все новости → Опросы». После публикации вопросы нельзя будет изменить."
        facts={["5 вопросов", "~2 минуты"]}
        confirmLabel="Опубликовать"
        onConfirm={() => setPublishAsked(false)}
      />

      <SortableList ids={order} onMove={(id, overId) => setOrder((items) => arrayMove(items, items.indexOf(id), items.indexOf(overId)))}>
        <ul aria-label="Порядок вариантов" className="flex flex-col gap-2 rounded-4pt-lg bg-ui-raised p-4">
          {order.map((option, index) => (
            <SortableItem
              key={option}
              id={option}
              className="flex h-12 items-center gap-1.5 rounded-4pt-md bg-ui-surface pr-4 data-[dragging]:shadow-[0_12px_30px_rgba(0,0,0,0.55)]"
            >
              <DragHandle label={`Переместить вариант ${index + 1}`} className="h-12 w-6" />
              <span className="text-[15px]">{option}</span>
            </SortableItem>
          ))}
        </ul>
      </SortableList>

      <StepProgress total={5} current={2} label="Вопрос 2 из 5" />
      <div className="rounded-4pt-lg bg-ui-raised p-4">
        <StepProgress total={5} current={2} label="Вопрос 2 из 5 на карточке Desktop" surface="raised" />
      </div>

      <div role="radiogroup" aria-label="Один вариант" className="flex flex-col gap-2.5">
        {OPTIONS.map((option, index) => (
          <ChoiceCard key={option} kind="radio" selected={single === index} onSelect={() => setSingle(index)}>
            {option}
          </ChoiceCard>
        ))}
      </div>

      <div role="group" aria-label="Несколько вариантов" className="flex flex-col gap-2.5">
        {OPTIONS.map((option, index) => (
          <ChoiceCard
            key={option}
            kind="checkbox"
            selected={several.includes(index)}
            onSelect={() => setSeveral((chosen) => (chosen.includes(index) ? chosen.filter((i) => i !== index) : [...chosen, index]))}
          >
            {option}
          </ChoiceCard>
        ))}
      </div>

      <RatingScale value={rating} onChange={setRating} minLabel="Совсем неудобно" maxLabel="Очень удобно" ariaLabel="Оценка от 1 до 5" />

      <div role="radiogroup" aria-label="Да или нет" className="grid grid-cols-2 gap-2.5">
        <ChoiceCard kind="radio" variant="tile" icon={<Check />} selected={yes === true} onSelect={() => setYes(true)}>Да</ChoiceCard>
        <ChoiceCard kind="radio" variant="tile" icon={<X />} selected={yes === false} onSelect={() => setYes(false)}>Нет</ChoiceCard>
      </div>

      <EmptyState
        tile="neutral"
        icon={<ClipboardList />}
        title="Сейчас нет доступных опросов"
        description="Когда появится новый опрос, мы покажем его здесь и на главной"
      />
      <EmptyState tile="success" size="lg" icon={<Check />} title="Ответы отправлены" description="Ваши ответы помогут сделать Workflow удобнее" />
      <EmptyState
        tile="danger"
        size="lg"
        icon={<TriangleAlert />}
        title="Не удалось отправить ответы"
        description="Проверьте подключение к интернету и попробуйте ещё раз. Ответы остались заполненными."
      />

      <ActionBar className="static -mx-4">
        <Button variant="neutral-outline" size="block"><ChevronLeft />Назад</Button>
        <Button variant="accent" size="block">Далее<ChevronRight /></Button>
      </ActionBar>
    </section>
  );
}
