"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MeetingRoomPhotoCarouselProps {
  photos?: string[];
  altPrefix: string;
  className?: string;
  imageClassName?: string;
  emptyClassName?: string;
  darkTheme?: boolean;
  size?: "card" | "hero";
}

export function MeetingRoomPhotoCarousel({
  photos,
  altPrefix,
  className,
  imageClassName = "object-cover w-full h-full",
  emptyClassName,
  darkTheme = false,
  size = "card",
}: MeetingRoomPhotoCarouselProps) {
  const isHero = size === "hero";
  const navButtonClass = isHero
    ? "left-2 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white border-0"
    : "left-1 h-5 w-5 rounded-full bg-black/50 hover:bg-black/70 text-white border-0";
  const navNextClass = isHero
    ? "right-2 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white border-0"
    : "right-1 h-5 w-5 rounded-full bg-black/50 hover:bg-black/70 text-white border-0";
  const countBadgeClass = isHero
    ? "absolute bottom-3 right-3 rounded-full bg-black/75 px-3 py-1 text-xs font-medium text-white z-10"
    : "absolute bottom-1 right-1 rounded-full bg-black/75 px-1.5 py-0.5 text-[10px] font-medium text-white";

  if (!photos || photos.length === 0) {
    return (
      <div
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center gap-0.5",
          darkTheme ? "text-[#8E8E93]" : "text-muted-foreground",
          emptyClassName,
        )}
      >
        <ImageIcon className={isHero ? "h-12 w-12" : "h-6 w-6"} />
        <span className={isHero ? "text-sm" : "text-[10px]"}>
          {isHero ? "Фото не загружено" : "Нет фото"}
        </span>
      </div>
    );
  }

  return (
    <Carousel opts={{ loop: true, align: "start" }} className={cn("absolute inset-0 w-full h-full", className)}>
      <CarouselContent className="-ml-0 h-full">
        {photos.map((photo, index) => (
          <CarouselItem key={index} className="pl-0 basis-full">
            <div className="relative w-full h-full">
              <img
                src={photo}
                alt={`${altPrefix} — фото ${index + 1}`}
                className={imageClassName}
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      {photos.length > 1 && (
        <>
          <CarouselPrevious className={navButtonClass} />
          <CarouselNext className={navNextClass} />
          <div className={countBadgeClass}>
            {isHero ? `${photos.length} фото` : photos.length}
          </div>
        </>
      )}
    </Carousel>
  );
}
