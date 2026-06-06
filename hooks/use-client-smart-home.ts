"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CLIENT_SMART_HOME_MOCK_DEVICES,
  CLIENT_SMART_HOME_MOCK_SUBSCRIPTIONS,
} from "@/constants/client-smart-home";
import {
  controlDevice,
  getClientRoomSubscriptions,
  getRoomDevicesForClient,
  type ClientRoomSubscription,
  type YandexDevice,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/useAuthStore";

export function useClientSmartHome() {
  const user = useAuthStore((s) => s.user);
  const isGuest = useAuthStore((s) => s.isGuest);
  const { toast } = useToast();

  const [subscriptions, setSubscriptions] = useState<ClientRoomSubscription[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [devices, setDevices] = useState<YandexDevice[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [isControlling, setIsControlling] = useState<string | null>(null);
  const [showRoomSelector, setShowRoomSelector] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadSubscriptions = async () => {
      if (isGuest) {
        setSubscriptions(CLIENT_SMART_HOME_MOCK_SUBSCRIPTIONS);
        setSelectedRoomId(1);
        return;
      }
      if (!user?.id) return;

      try {
        setLoading(true);
        const response = await getClientRoomSubscriptions(user.id);
        const subs = response.data.subscriptions || [];
        setSubscriptions(subs);
        if (subs.length > 0) {
          setSelectedRoomId((prev) => prev ?? subs[0].meeting_room_id);
        }
      } catch {
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить комнаты",
          variant: "destructive",
          duration: 4000,
        });
      } finally {
        setLoading(false);
      }
    };

    void loadSubscriptions();
  }, [user?.id, isGuest, toast]);

  useEffect(() => {
    const loadDevices = async () => {
      if (!selectedRoomId) return;

      if (isGuest) {
        setDevices(CLIENT_SMART_HOME_MOCK_DEVICES);
        return;
      }

      try {
        setIsLoadingDevices(true);
        const response = await getRoomDevicesForClient(selectedRoomId);
        setDevices(response.data.devices || []);
      } catch {
        toast({
          title: "Ошибка загрузки",
          description: "Не удалось загрузить устройства",
          variant: "destructive",
          duration: 4000,
        });
      } finally {
        setIsLoadingDevices(false);
      }
    };

    void loadDevices();
  }, [selectedRoomId, isGuest, toast]);

  const handleControlDevice = useCallback(
    async (device: YandexDevice, value: boolean) => {
      try {
        setIsControlling(device.id);

        if (!isGuest) {
          await controlDevice({
            device_id: device.id,
            action_type: "devices.capabilities.on_off",
            action_state: { instance: "on", value },
          });
        }

        toast({
          title: "Успешно",
          description: isGuest
            ? `(Демо) ${device.name} ${value ? "включено" : "выключено"}`
            : `${device.name} ${value ? "включено" : "выключено"}`,
          duration: 2000,
        });

        setDevices((prev) =>
          prev.map((d) => {
            if (d.id !== device.id) return d;
            const updated = { ...d, capabilities: d.capabilities?.map((c) => ({ ...c })) };
            const cap = updated.capabilities?.find((c) => c.type === "devices.capabilities.on_off");
            if (cap?.state) {
              cap.state = { ...cap.state, value };
            }
            return updated;
          }),
        );
      } catch {
        toast({
          title: "Ошибка",
          description: "Не удалось управлять устройством",
          variant: "destructive",
          duration: 4000,
        });
      } finally {
        setIsControlling(null);
      }
    },
    [isGuest, toast],
  );

  const getDeviceState = useCallback((device: YandexDevice): boolean | null => {
    const cap = device.capabilities?.find((c) => c.type === "devices.capabilities.on_off");
    return cap?.state?.value ?? null;
  }, []);

  const controllableDevices = useMemo(
    () =>
      devices.filter((d) =>
        d.capabilities?.some((c) => c.type === "devices.capabilities.on_off"),
      ),
    [devices],
  );

  const selectedRoom = useMemo(
    () => subscriptions.find((s) => s.meeting_room_id === selectedRoomId),
    [subscriptions, selectedRoomId],
  );

  const selectRoom = useCallback((roomId: number) => {
    setSelectedRoomId(roomId);
    setShowRoomSelector(false);
  }, []);

  const toggleRoomSelector = useCallback(() => {
    setShowRoomSelector((prev) => !prev);
  }, []);

  return {
    subscriptions,
    selectedRoomId,
    selectedRoom,
    devices,
    controllableDevices,
    isLoadingDevices,
    isControlling,
    showRoomSelector,
    loading,
    getDeviceState,
    handleControlDevice,
    selectRoom,
    toggleRoomSelector,
  };
}

export type UseClientSmartHomeResult = ReturnType<typeof useClientSmartHome>;
