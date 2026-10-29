"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import { getPreviewUrl } from "@/lib/imageOptimization";

type RequestDetailPhotoGridProps = {
  photos: Array<{ photo_url: string; created_at?: string }>;
  onPhotoClick: (photo: { url: string; created_at?: string }) => void;
};

/** Сетка фото — parity с workflow-mobile PhotoGrid в requests/[id].tsx. */
export function RequestDetailPhotoGrid({ photos, onPhotoClick }: RequestDetailPhotoGridProps) {
  // Файл удалён из хранилища или не загрузился — вместо значка битой картинки показываем заглушку.
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  if (!photos.length) return null;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Фотографии</p>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo, idx) => (
          <button
            key={`${photo.photo_url}-${idx}`}
            type="button"
            onClick={() =>
              !failed.has(photo.photo_url) &&
              onPhotoClick({ url: photo.photo_url, created_at: photo.created_at })
            }
            className="aspect-square rounded-xl overflow-hidden bg-muted active:opacity-80"
            aria-label={`Фото ${idx + 1}`}
          >
            {failed.has(photo.photo_url) ? (
              <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
                <ImageOff className="h-6 w-6" />
                <span className="text-xs">Фото недоступно</span>
              </span>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getPreviewUrl(photo.photo_url)}
                alt=""
                className="w-full h-full object-cover"
                onError={() => setFailed((prev) => new Set(prev).add(photo.photo_url))}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
