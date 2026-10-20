"use client";

import { useRef, type ChangeEvent, type ReactNode } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Office } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  MEETING_ROOM_FLOORS,
  type MeetingRoomStatus,
  type MeetingRoomType,
} from "@/stores/meetingRoomsStore";

export type FormPhotoItem =
  | { type: "existing"; id: number; url: string }
  | { type: "new"; file: File; preview: string };

export interface RoomFormState {
  id?: number;
  office_id: number | null;
  name: string;
  floor: number | "";
  capacity: number | "";
  room_type: MeetingRoomType;
  status: MeetingRoomStatus;
  isActive: boolean;
  photos: FormPhotoItem[];
  description: string;
}

export type RoomFormErrors = Partial<Record<"office" | "name" | "floor" | "capacity" | "photos", string>>;

export const MAX_ROOM_PHOTOS = 3;

interface MeetingRoomFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  form: RoomFormState;
  onChange: (patch: Partial<RoomFormState>) => void;
  errors: RoomFormErrors;
  offices: Office[];
  /** Офис-менеджер работает только со своим офисом — поле офиса не меняется. */
  officeLocked?: boolean;
  submitting: boolean;
  onSubmit: () => void;
  onDelete?: () => void;
  onAddPhotos: (files: FileList | null) => void;
  onRemovePhoto: (index: number) => void;
  dark: boolean;
}

/** Создание и редактирование переговорной: одна колонка по разделам, кнопки всегда на виду. */
export function MeetingRoomFormDialog({
  open,
  onOpenChange,
  isEditing,
  form,
  onChange,
  errors,
  offices,
  officeLocked = false,
  submitting,
  onSubmit,
  onDelete,
  onAddPhotos,
  onRemovePhoto,
  dark,
}: MeetingRoomFormDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isCabinet = form.room_type === "cabinet";

  const fieldClass = dark ? "bg-[#2C2C2E] border-white/10 text-white placeholder:text-gray-500" : "";
  const selectContentClass = dark ? "bg-[#2C2C2E] border-white/10" : "";
  const selectItemClass = dark ? "text-white focus:bg-white/10 focus:text-white" : "";
  const mutedText = dark ? "text-gray-400" : "text-muted-foreground";

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    onAddPhotos(event.target.files);
    // Тот же файл можно выбрать снова после удаления.
    event.target.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[90vh] w-[95vw] max-w-2xl flex-col gap-0 overflow-hidden p-0",
          dark && "border-white/10 bg-[#1A1A1A] text-white",
        )}
      >
        <DialogHeader className={cn("border-b px-6 py-4 text-left", dark && "border-white/10")}>
          <DialogTitle className={cn("text-xl", dark && "text-white")}>
            {isEditing ? "Редактирование переговорной" : "Новая переговорная"}
          </DialogTitle>
          <DialogDescription className={mutedText}>
            Поля со звёздочкой обязательны. Клиенты видят комнату в каталоге своего офиса.
          </DialogDescription>
        </DialogHeader>

        <form
          id="meeting-room-form"
          className="flex-1 space-y-6 overflow-y-auto px-6 py-5"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <FormSection title="Основное" dark={dark}>
            <Field label="Офис" required error={errors.office} htmlFor="meeting-room-office">
              <Select
                value={form.office_id ? String(form.office_id) : undefined}
                onValueChange={(value) => onChange({ office_id: Number(value) })}
                disabled={officeLocked}
              >
                <SelectTrigger id="meeting-room-office" className={cn(fieldClass, dark && "[&>span]:text-white")}>
                  <SelectValue placeholder="Выберите офис" />
                </SelectTrigger>
                <SelectContent className={selectContentClass}>
                  {offices.map((office) => (
                    <SelectItem key={office.id} value={String(office.id)} className={selectItemClass}>
                      {office.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Название" required error={errors.name} htmlFor="meeting-room-name">
              <Input
                id="meeting-room-name"
                placeholder="Например, Переговорная «Астана»"
                value={form.name}
                onChange={(event) => onChange({ name: event.target.value })}
                className={fieldClass}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Этаж" required error={errors.floor} htmlFor="meeting-room-floor">
                <Select
                  value={form.floor === "" ? undefined : String(form.floor)}
                  onValueChange={(value) => onChange({ floor: Number(value) })}
                >
                  <SelectTrigger id="meeting-room-floor" className={cn(fieldClass, dark && "[&>span]:text-white")}>
                    <SelectValue placeholder="Этаж" />
                  </SelectTrigger>
                  <SelectContent className={selectContentClass}>
                    {MEETING_ROOM_FLOORS.map((floor) => (
                      <SelectItem key={floor} value={String(floor)} className={selectItemClass}>
                        {floor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Вместимость, чел." required error={errors.capacity} htmlFor="meeting-room-capacity">
                <Input
                  id="meeting-room-capacity"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  placeholder="8"
                  value={form.capacity}
                  onChange={(event) =>
                    onChange({ capacity: event.target.value === "" ? "" : Number(event.target.value) })
                  }
                  className={fieldClass}
                />
              </Field>
            </div>

            <Field label="Тип комнаты">
              <Segmented
                dark={dark}
                value={form.room_type}
                onChange={(room_type) => onChange({ room_type })}
                options={[
                  { value: "meeting", label: "Переговорная" },
                  { value: "cabinet", label: "Кабинет" },
                ]}
              />
              <p className={cn("text-xs", mutedText)}>
                {isCabinet
                  ? "Кабинет не бронируется и не показывается в каталоге переговорных."
                  : "Переговорную бронируют клиенты и сотрудники."}
              </p>
            </Field>
          </FormSection>

          <FormSection
            title="Фотографии"
            hint={`${form.photos.length} из ${MAX_ROOM_PHOTOS} · JPG или PNG до 2 МБ${isCabinet ? "" : " · для переговорной нужно хотя бы одно"}`}
            dark={dark}
          >
            <div className="grid grid-cols-3 gap-3">
              {form.photos.map((photo, index) => (
                <div
                  key={photo.type === "existing" ? `existing-${photo.id}-${index}` : `new-${index}`}
                  className={cn(
                    "group relative aspect-[4/3] overflow-hidden rounded-lg border",
                    dark ? "border-white/10 bg-[#2C2C2E]" : "bg-muted",
                  )}
                >
                  <Image
                    src={photo.type === "existing" ? photo.url : photo.preview}
                    alt={`${form.name || "Переговорная"}, фото ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="200px"
                  />
                  {index === 0 && (
                    <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] text-white">
                      Обложка
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemovePhoto(index)}
                    aria-label={`Удалить фото ${index + 1}`}
                    className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {form.photos.length < MAX_ROOM_PHOTOS && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed text-sm transition",
                    dark
                      ? "border-white/20 text-gray-300 hover:border-[#E85D2B] hover:text-white"
                      : "text-muted-foreground hover:border-primary hover:text-foreground",
                    errors.photos && "border-red-500",
                  )}
                >
                  <ImagePlus className="h-6 w-6" />
                  Добавить фото
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png"
              multiple
              className="hidden"
              onChange={handleFiles}
            />
            {errors.photos && <p className="text-xs text-red-500">{errors.photos}</p>}
          </FormSection>

          <FormSection title="Описание" dark={dark}>
            <Textarea
              id="meeting-room-description"
              aria-label="Описание"
              placeholder="Расстановка мебели, вид из окна, особенности комнаты"
              value={form.description}
              onChange={(event) => onChange({ description: event.target.value })}
              className={cn("min-h-[96px]", fieldClass)}
            />
          </FormSection>

          <FormSection title="Доступность" dark={dark}>
            <div
              className={cn(
                "flex items-center justify-between gap-4 rounded-lg border p-3",
                dark ? "border-white/10 bg-[#2C2C2E]/60" : "",
              )}
            >
              <div>
                <p className="text-sm font-medium">Комната работает</p>
                <p className={cn("text-xs", mutedText)}>
                  Выключите на время ремонта — комната скроется из каталога, брони станут недоступны.
                </p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) => onChange({ isActive: Boolean(checked) })}
                aria-label="Комната работает"
              />
            </div>
            {!isCabinet && (
              <Field label="Отметка в каталоге">
                <Segmented
                  dark={dark}
                  value={form.status}
                  onChange={(status) => onChange({ status })}
                  options={[
                    { value: "available", label: "Доступна" },
                    { value: "booked", label: "Занята" },
                  ]}
                />
                <p className={cn("text-xs", mutedText)}>
                  Ярлык на карточке в каталоге. Свободное время по-прежнему считается по броням.
                </p>
              </Field>
            )}
          </FormSection>
        </form>

        <div
          className={cn(
            "flex flex-col-reverse gap-2 border-t px-6 py-4 sm:flex-row sm:items-center",
            dark && "border-white/10",
          )}
        >
          {isEditing && onDelete && (
            <Button
              type="button"
              variant="ghost"
              onClick={onDelete}
              disabled={submitting}
              className="text-red-400 hover:bg-red-500/10 hover:text-red-300 sm:mr-auto"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Удалить
            </Button>
          )}
          <div className="flex flex-col-reverse gap-2 sm:ml-auto sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className={dark ? "border-white/20 bg-transparent text-white hover:bg-white/10" : ""}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              form="meeting-room-form"
              disabled={submitting}
              className={dark ? "bg-[#E85D2B] text-white hover:bg-[#E04A0A]" : ""}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? "Сохранение…" : isEditing ? "Сохранить изменения" : "Создать комнату"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FormSection({ title, hint, dark, children }: { title: string; hint?: string; dark: boolean; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className={cn("text-sm font-semibold uppercase tracking-wide", dark ? "text-gray-300" : "text-muted-foreground")}>
          {title}
        </h3>
        {hint && <span className={cn("text-xs", dark ? "text-gray-500" : "text-muted-foreground")}>{hint}</span>}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  required,
  error,
  htmlFor,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="block text-sm">
        {label}
        {required && <span className="ml-0.5 text-[#E85D2B]">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
  dark,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  dark: boolean;
}) {
  return (
    <div
      role="radiogroup"
      className={cn("inline-flex w-full rounded-lg p-1 sm:w-auto", dark ? "bg-[#2C2C2E]" : "bg-muted")}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex-1 rounded-md px-4 py-1.5 text-sm font-medium transition sm:flex-none",
              selected
                ? "bg-[#E85D2B] text-white shadow"
                : dark
                  ? "text-gray-300 hover:text-white"
                  : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
