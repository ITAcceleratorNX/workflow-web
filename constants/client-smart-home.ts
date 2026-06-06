import type { ClientRoomSubscription, YandexDevice } from "@/lib/api";

export const CLIENT_SMART_HOME_MOCK_SUBSCRIPTIONS: ClientRoomSubscription[] = [
  {
    id: 1,
    client_id: 0,
    meeting_room_id: 1,
    created_at: "",
    updated_at: "",
    meetingRoom: {
      id: 1,
      name: "Кабинет 101 (демо)",
      office_id: 1,
      office: { id: 1, name: "Демо офис" },
    },
  },
];

export const CLIENT_SMART_HOME_MOCK_DEVICES: YandexDevice[] = [
  {
    id: "demo-lamp-1",
    name: "Свет (демо)",
    type: "devices.types.light",
    capabilities: [
      { type: "devices.capabilities.on_off", state: { instance: "on", value: false } },
    ],
  },
  {
    id: "demo-ac-1",
    name: "Кондиционер (демо)",
    type: "devices.types.thermostat.ac",
    capabilities: [
      { type: "devices.capabilities.on_off", state: { instance: "on", value: true } },
    ],
  },
];
