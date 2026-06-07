"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  clampNewsScheduleDate,
  formatNewsScheduleDateTime,
  getNewsScheduleMaximumDate,
  getNewsScheduleMinimumDate,
} from "@/lib/dateTimeUtils";
import {
  createNews,
  updateNews,
  type NotificationType,
  type NewsPublishMode,
} from "@/lib/news-admin-api";

const NOTIFICATION_OPTIONS: { value: NotificationType; label: string }[] = [
  { value: "none", label: "Без уведомления" },
  { value: "push_sound", label: "Уведомление со звуком" },
  { value: "push_silent", label: "Уведомление без звука" },
];

function PillButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 text-sm font-medium ${
        active
          ? "border-[#F35713] bg-[#F35713] text-white"
          : "border-border bg-muted text-muted-foreground"
      }`}
    >
      {label}
    </button>
  );
}

export function AdminWorkerNewsEditorScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mode = searchParams.get("mode") === "edit" ? "edit" : "create";
  const editingId = mode === "edit" ? searchParams.get("id") : null;
  const initialImageUrl = searchParams.get("imageUrl") ?? "";
  const editingStatus = searchParams.get("status") ?? "active";
  const editingIsScheduled = mode === "edit" && editingStatus === "scheduled";
  const showPublishSchedule = mode === "create" || editingIsScheduled;

  const initialScheduledAt = useMemo(() => {
    const publishedAt = searchParams.get("publishedAt");
    let d: Date;
    if (publishedAt) {
      const parsed = new Date(publishedAt);
      d = Number.isNaN(parsed.getTime()) ? new Date(Date.now() + 60 * 60 * 1000) : parsed;
    } else {
      d = new Date(Date.now() + 60 * 60 * 1000);
    }
    return clampNewsScheduleDate(d);
  }, [searchParams]);

  const [title, setTitle] = useState(() => searchParams.get("title") ?? "");
  const [content, setContent] = useState(() => searchParams.get("content") ?? "");
  const [notificationType, setNotificationType] = useState<NotificationType>("none");
  const [publishMode, setPublishMode] = useState<NewsPublishMode>(() =>
    editingIsScheduled ? "schedule" : "now",
  );
  const [scheduledAt, setScheduledAt] = useState(initialScheduledAt);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (publishMode === "schedule") {
      setScheduledAt((prev) => clampNewsScheduleDate(prev));
    }
  }, [publishMode]);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const headerTitle = mode === "edit" ? "Редактировать новость" : "Новая новость";

  const scheduleMin = getNewsScheduleMinimumDate().toISOString().slice(0, 16);
  const scheduleMax = getNewsScheduleMaximumDate().toISOString().slice(0, 16);
  const scheduleValue = scheduledAt.toISOString().slice(0, 16);

  const handleImagePick = (file: File | null) => {
    setImageFile(file);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSave = useCallback(async () => {
    setFormError(null);
    const titleTrim = title.trim();
    const contentTrim = content.trim();
    if (!titleTrim) {
      setFormError("Заголовок обязателен");
      return;
    }
    if (!contentTrim) {
      setFormError("Текст новости обязателен");
      return;
    }

    if (showPublishSchedule && publishMode === "schedule") {
      const minD = getNewsScheduleMinimumDate();
      const maxD = getNewsScheduleMaximumDate();
      if (scheduledAt.getTime() < minD.getTime()) {
        setFormError("Укажите дату и время публикации в будущем");
        return;
      }
      if (scheduledAt.getTime() > maxD.getTime()) {
        setFormError("Дата публикации не может быть позже чем через год");
        return;
      }
    }

    setSubmitting(true);
    const basePayload = {
      title: titleTrim,
      content: contentTrim,
      notification_type: notificationType,
      image: imageFile,
    };

    let res;
    if (mode === "edit" && editingId) {
      if (editingIsScheduled) {
        res = await updateNews(parseInt(editingId, 10), {
          ...basePayload,
          publish_mode: publishMode,
          ...(publishMode === "schedule" ? { published_at: scheduledAt.toISOString() } : {}),
        });
      } else {
        res = await updateNews(parseInt(editingId, 10), basePayload);
      }
    } else {
      res = await createNews({
        ...basePayload,
        publish_mode: publishMode === "schedule" ? "schedule" : "now",
        ...(publishMode === "schedule" ? { published_at: scheduledAt.toISOString() } : {}),
      });
    }
    setSubmitting(false);

    if (res.ok) {
      toast({
        title: mode === "edit" ? "Сохранено" : "Готово",
        description:
          mode === "edit"
            ? "Новость обновлена"
            : publishMode === "schedule"
              ? "Новость запланирована"
              : "Новость добавлена",
      });
      router.push("/admin-worker/management/news");
    } else {
      setFormError(res.error);
      toast({ title: "Ошибка", description: res.error, variant: "destructive" });
    }
  }, [
    title,
    content,
    notificationType,
    imageFile,
    mode,
    editingId,
    editingIsScheduled,
    showPublishSchedule,
    publishMode,
    scheduledAt,
    router,
    toast,
  ]);

  return (
    <div className="space-y-4">
      <p className="text-lg font-semibold text-foreground">{headerTitle}</p>

      {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Заголовок *</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Заголовок новости" />
      </div>

      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Текст новости *</label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Содержание новости"
          rows={6}
        />
      </div>

      {showPublishSchedule ? (
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Публикация</label>
          <div className="flex flex-wrap gap-2">
            <PillButton active={publishMode === "now"} label="Сейчас" onClick={() => setPublishMode("now")} />
            <PillButton
              active={publishMode === "schedule"}
              label="Запланировать"
              onClick={() => setPublishMode("schedule")}
            />
          </div>
          {publishMode === "schedule" ? (
            <div className="space-y-2">
              <Input
                type="datetime-local"
                value={scheduleValue}
                min={scheduleMin}
                max={scheduleMax}
                onChange={(e) => {
                  const d = new Date(e.target.value);
                  if (!Number.isNaN(d.getTime())) setScheduledAt(clampNewsScheduleDate(d));
                }}
              />
              <p className="text-sm text-muted-foreground">
                {formatNewsScheduleDateTime(scheduledAt)}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Уведомление</label>
        <div className="flex flex-wrap gap-2">
          {NOTIFICATION_OPTIONS.map((opt) => (
            <PillButton
              key={opt.value}
              active={notificationType === opt.value}
              label={opt.label}
              onClick={() => setNotificationType(opt.value)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Изображение</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleImagePick(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex min-h-[140px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border p-4"
        >
          {imagePreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imagePreview} alt="" className="max-h-[140px] w-full rounded-lg object-cover" />
          ) : mode === "edit" && initialImageUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={initialImageUrl} alt="" className="max-h-[140px] w-full rounded-lg object-cover" />
              <span className="text-xs text-muted-foreground">Нажмите, чтобы заменить</span>
            </>
          ) : (
            <>
              <ImagePlus className="h-10 w-10 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Выбрать фото</span>
            </>
          )}
        </button>
      </div>

      <Button className="w-full" onClick={handleSave} disabled={submitting}>
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : mode === "edit" ? (
          "Сохранить"
        ) : (
          "Создать"
        )}
      </Button>
    </div>
  );
}
