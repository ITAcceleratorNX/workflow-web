"use client"

import NextImage from "next/image"
import { CalendarClock } from "lucide-react"
import { formatDateTime } from "@/lib/dateTimeUtils"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

type SelectedPhoto = { url: string; created_at?: string | null };
interface PhotoModalProps {
  selectedPhoto: SelectedPhoto | null;
  onClose: () => void;
}

export default function PhotoModal({ selectedPhoto, onClose }: PhotoModalProps) {
  return (
    <Dialog open={selectedPhoto != null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        layer={120}
        aria-describedby={undefined}
        overlayClassName="bg-black/90"
        className="h-[90dvh] w-[calc(100vw-2rem)] max-w-7xl border-0 bg-transparent p-0 shadow-none [&>button]:z-10 [&>button]:bg-black/85 [&>button]:text-white"
      >
        <DialogTitle className="sr-only">Просмотр фотографии</DialogTitle>
        {selectedPhoto && <>
          <NextImage
            fill
            unoptimized
            sizes="100vw"
            src={selectedPhoto.url || "/placeholder.svg"}
            alt="Увеличенное фото"
            className="object-contain rounded-xl"
          />
          {selectedPhoto.created_at && (
            <div className="absolute bottom-3 left-3 md:bottom-6 md:left-6 flex items-center gap-2 rounded-lg border border-white/20 bg-black/85 px-3 py-2 text-sm text-white">
              <CalendarClock className="h-4 w-4 shrink-0" />
              <span>{formatDateTime(selectedPhoto.created_at)}</span>
            </div>
          )}
        </>}
      </DialogContent>
    </Dialog>
  )
}
