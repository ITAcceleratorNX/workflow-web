import {
  Blinds,
  Lightbulb,
  Lock,
  Plug,
  Power,
  Speaker,
  Thermometer,
  Tv,
  Wind,
  type LucideIcon,
} from "lucide-react";
import type { ClientRoomSubscription, RoomDevice } from "@/lib/api";

export function formatYandexTokenExpiresAt(iso: string | null): string {
  if (!iso) return "—";
  try {
    const date = new Date(iso);
    const now = new Date();
    if (date < now) {
      return `Истёк ${date.toLocaleDateString("ru-RU")}`;
    }
    return `До ${date.toLocaleDateString("ru-RU")} ${date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  } catch {
    return iso;
  }
}

export function getSmartHomeDeviceIcon(
  deviceType: string | null | undefined,
  deviceName: string
): LucideIcon {
  const name = (deviceName || "").toLowerCase();
  const type = (deviceType || "").toLowerCase();

  if (
    name.includes("свет") ||
    name.includes("сеет") ||
    name.includes("лампа") ||
    name.includes("light") ||
    type.includes("light")
  ) {
    return Lightbulb;
  }
  if (
    name.includes("кондиционер") ||
    name.includes("вентил") ||
    name.includes("thermostat") ||
    type.includes("thermostat")
  ) {
    return Wind;
  }
  if (
    name.includes("шторы") ||
    name.includes("жалюзи") ||
    name.includes("curtain") ||
    type.includes("curtain") ||
    type.includes("openable")
  ) {
    return Blinds;
  }
  if (name.includes("розетка") || name.includes("socket") || type.includes("socket")) {
    return Plug;
  }
  if (name.includes("тв") || name.includes("телевизор") || type.includes("media_device")) {
    return Tv;
  }
  if (name.includes("колонка") || name.includes("speaker") || type.includes("speaker")) {
    return Speaker;
  }
  if (name.includes("термо") || type.includes("sensor")) {
    return Thermometer;
  }
  if (name.includes("замок") || name.includes("lock") || type.includes("lock")) {
    return Lock;
  }
  return Power;
}

export function getRoomDeviceOfficeId(link: RoomDevice): number | null | undefined {
  return link.meetingRoom?.office_id ?? link.meetingRoom?.office?.id;
}

export function getSubscriptionOfficeId(sub: ClientRoomSubscription): number | null | undefined {
  return sub.meetingRoom?.office_id ?? sub.meetingRoom?.office?.id;
}

export function filterRoomDevicesByOffice(
  links: RoomDevice[],
  officeId: number | null
): RoomDevice[] {
  if (officeId == null) return [];
  return links.filter((link) => getRoomDeviceOfficeId(link) === officeId);
}

export function filterSubscriptionsByOffice(
  subscriptions: ClientRoomSubscription[],
  officeId: number | null
): ClientRoomSubscription[] {
  if (officeId == null) return [];
  return subscriptions.filter((sub) => getSubscriptionOfficeId(sub) === officeId);
}

export function groupRoomDevicesByRoom(links: RoomDevice[]) {
  const map = new Map<number, { roomName: string; links: RoomDevice[] }>();
  for (const link of links) {
    const roomName = link.meetingRoom?.name ?? `Комната ${link.meeting_room_id}`;
    if (!map.has(link.meeting_room_id)) {
      map.set(link.meeting_room_id, { roomName, links: [] });
    }
    map.get(link.meeting_room_id)!.links.push(link);
  }
  return Array.from(map.entries()).map(([roomId, value]) => ({ roomId, ...value }));
}
