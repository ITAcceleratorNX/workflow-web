"use client";

import Image from "next/image";
import { X, Building2, Users, ImageIcon } from "lucide-react";
import type { MeetingRoom, Office } from "@/lib/api";

interface MeetingRoomsMobileOfficeRoomsModalProps {
  office: Office;
  rooms: MeetingRoom[];
  loadingRooms: boolean;
  onClose: () => void;
  onRoomClick: (room: MeetingRoom) => void;
}

export function MeetingRoomsMobileOfficeRoomsModal({
  office,
  rooms,
  loadingRooms,
  onClose,
  onRoomClick,
}: MeetingRoomsMobileOfficeRoomsModalProps) {
  return (
    <div
      className="fixed inset-0 z-50"
      style={{ background: "linear-gradient(169.92deg, #F35713 -3.47%, #281504 104.23%)" }}
    >
      <div className="flex flex-col h-full pt-9 px-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-medium text-white">{office.name}</h2>
          <button type="button" onClick={onClose} className="p-1">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <p className="text-white text-sm font-medium mb-4">Доступные: {rooms.length}</p>

        <div className="flex gap-2 overflow-x-auto pb-4">
          {loadingRooms ? (
            Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="w-[112px] flex-shrink-0 animate-pulse">
                <div className="w-full h-[145px] bg-white/10 rounded" />
                <div className="mt-2 h-3 bg-white/10 rounded w-3/4" />
              </div>
            ))
          ) : (
            rooms.map((room) => (
              <button
                key={room.id}
                type="button"
                onClick={() => onRoomClick(room)}
                className="w-[112px] flex-shrink-0 text-left"
              >
                <div className="w-full h-[145px] bg-white/20 rounded overflow-hidden relative">
                  {room.photos && room.photos.length > 0 ? (
                    <Image
                      src={room.photos[0]}
                      alt={room.name}
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-white/40" />
                    </div>
                  )}
                  {room.photos && room.photos.length > 1 && (
                    <div className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[8px] text-white">
                      +{room.photos.length - 1}
                    </div>
                  )}
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-[10px] font-medium text-white leading-[9px]">{room.name}</p>
                  <div className="flex items-center gap-1">
                    <Building2 className="w-2 h-2 text-[#C1C1C1]" />
                    <span className="text-[8px] text-[#C1C1C1]">{room.floor} этаж</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-2 h-2 text-[#C1C1C1]" />
                    <span className="text-[8px] text-[#C1C1C1]">до {room.capacity} человек</span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
