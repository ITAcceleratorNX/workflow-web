"use client";

import { getPreviewUrl } from "@/lib/imageOptimization";

type RequestDetailPhotoGridProps = {
  photos: Array<{ photo_url: string; created_at?: string }>;
  onPhotoClick: (photo: { url: string; created_at?: string }) => void;
};

/** Сетка фото — parity с workflow-mobile PhotoGrid в requests/[id].tsx. */
export function RequestDetailPhotoGrid({ photos, onPhotoClick }: RequestDetailPhotoGridProps) {
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
              onPhotoClick({ url: photo.photo_url, created_at: photo.created_at })
            }
            className="aspect-square rounded-xl overflow-hidden bg-muted active:opacity-80"
            aria-label={`Фото ${idx + 1}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getPreviewUrl(photo.photo_url)}
              alt=""
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
