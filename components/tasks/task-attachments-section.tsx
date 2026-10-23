"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Loader2, Paperclip, Trash2 } from "lucide-react";
import { ListGroup, ListRow } from "@/components/ui/list-group";
import { useToast } from "@/hooks/use-toast";
import {
  deleteUserTaskAttachment,
  getUserTaskAttachments,
  uploadUserTaskAttachments,
  type UserTaskAttachment,
} from "@/lib/user-tasks-api";
import { toastTaskError } from "@/components/tasks/task-toasts";
import { cn } from "@/lib/utils";

const MAX_FILES = 10;
const ACCEPT = "image/*,video/*,.pdf,.doc,.docx,.rtf,.zip,.rar,.7z,.tar,.gz";
const KIND_LABEL: Record<UserTaskAttachment["file_kind"], string> = { image: "Фото", video: "Видео", document: "Документ" };

type Props = {
  taskId: number;
  canEdit: boolean;
  /** `inset` — inside the desktop card. */
  tone?: "surface" | "inset";
};

/**
 * «Вложения» of a task: photos, videos and documents; the author adds and removes them. Hidden
 * for a reader when there is nothing attached.
 */
export function TaskAttachmentsSection({ taskId, canEdit, tone = "surface" }: Props) {
  const { toast } = useToast();
  const [items, setItems] = useState<UserTaskAttachment[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    void getUserTaskAttachments(taskId).then((res) => {
      if (cancelled) return;
      setItems(res.ok ? res.data : []);
      if (!res.ok) toastTaskError(toast, "Не удалось загрузить вложения", res.error);
    });
    return () => {
      cancelled = true;
    };
  }, [taskId, toast]);

  const upload = async (files: FileList) => {
    const list = Array.from(files).slice(0, MAX_FILES);
    if (list.length === 0 || uploading) return;
    setUploading(true);
    const res = await uploadUserTaskAttachments(taskId, list);
    setUploading(false);
    if (res.ok) setItems((current) => [...res.data, ...(current ?? [])]);
    else toastTaskError(toast, "Не удалось прикрепить файл", res.error);
  };

  const remove = async (attachment: UserTaskAttachment) => {
    const before = items;
    setItems((current) => current?.filter((item) => item.id !== attachment.id) ?? null);
    const res = await deleteUserTaskAttachment(taskId, attachment.id);
    if (!res.ok) {
      setItems(before);
      toastTaskError(toast, "Не удалось удалить вложение", res.error);
    }
  };

  if (items == null) {
    return (
      <div role="status" className="flex items-center gap-2 text-[13px] text-ui-fg/50">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Вложения…
      </div>
    );
  }
  if (items.length === 0 && !canEdit) return null;

  return (
    <section aria-label="Вложения" className="flex flex-col gap-2">
      <p className="text-[13px] font-medium text-ui-fg/50">Вложения{items.length ? ` · ${items.length}` : ""}</p>
      <ListGroup tone={tone === "inset" ? "inset" : "surface"}>
        {items.map((item) => (
          <div key={item.id} className={cn("flex items-center gap-3", tone === "inset" ? "py-2" : "py-2.5 pl-3.5 pr-2")}>
            <a
              href={item.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-w-0 flex-1 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70"
            >
              {item.file_kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element -- Cloudinary files of the user, any size
                <img src={item.file_url} alt="" loading="lazy" className="size-10 shrink-0 rounded-lg object-cover" />
              ) : (
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-ui-fg/[0.06]">
                  <FileText className="size-5 text-ui-fg/60" aria-hidden />
                </span>
              )}
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm text-ui-fg">{item.file_name || KIND_LABEL[item.file_kind]}</span>
                <span className="text-xs text-ui-fg/50">{KIND_LABEL[item.file_kind]}</span>
              </span>
            </a>
            {canEdit ? (
              <button
                type="button"
                onClick={() => void remove(item)}
                aria-label={`Удалить вложение ${item.file_name ?? ""}`.trim()}
                className="flex size-11 shrink-0 items-center justify-center rounded-lg text-ui-danger hover:bg-ui-danger/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70"
              >
                <Trash2 className="size-[18px]" aria-hidden />
              </button>
            ) : null}
          </div>
        ))}
        {canEdit ? (
          <ListRow
            icon={uploading ? <Loader2 className="animate-spin" /> : <Paperclip />}
            label={uploading ? "Загружаем…" : "Прикрепить файл"}
            tone="accent"
            chevron={false}
            density={tone === "inset" ? "compact" : "regular"}
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          />
        ) : null}
      </ListGroup>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(event) => {
          if (event.target.files) void upload(event.target.files);
          event.target.value = "";
        }}
      />
    </section>
  );
}
