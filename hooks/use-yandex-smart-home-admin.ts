"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createClientRoomSubscription,
  createRoomDevice,
  deleteClientRoomSubscription,
  deleteRoomDevice,
  getAllClientRoomSubscriptions,
  getAllRoomDevices,
  getMeetingRooms,
  getOfficeUsers,
  getOffices,
  getYandexDevicesList,
  type ClientRoomSubscription,
  type MeetingRoom,
  type Office,
  type RoomDevice,
  type YandexDevice,
} from "@/lib/api";
import {
  filterRoomDevicesByOffice,
  filterSubscriptionsByOffice,
  groupRoomDevicesByRoom,
} from "@/lib/yandex-smart-home-utils";
import { useToast } from "@/hooks/use-toast";
import { useYandexSmartHomeTokens } from "@/hooks/use-yandex-smart-home-tokens";

export interface OfficeUserOption {
  id: number;
  full_name: string;
  phone?: string;
  role?: string;
}

export function useYandexSmartHomeAdmin() {
  const { toast } = useToast();
  const tokens = useYandexSmartHomeTokens({ confirmDelete: false });

  const [offices, setOffices] = useState<Office[]>([]);
  const [officesLoading, setOfficesLoading] = useState(true);
  const [selectedOfficeId, setSelectedOfficeId] = useState<number | null>(null);
  const [showOfficeDropdown, setShowOfficeDropdown] = useState(false);

  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);

  const [roomDevices, setRoomDevices] = useState<RoomDevice[]>([]);
  const [yandexDevices, setYandexDevices] = useState<YandexDevice[]>([]);
  const [linksLoading, setLinksLoading] = useState(true);
  const [devicesListLoading, setDevicesListLoading] = useState(false);
  const [showRoomDropdown, setShowRoomDropdown] = useState(false);
  const [showDeviceDropdown, setShowDeviceDropdown] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<YandexDevice | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [deletingLinkId, setDeletingLinkId] = useState<number | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);

  const [subscriptions, setSubscriptions] = useState<ClientRoomSubscription[]>([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(true);
  const [officeUsers, setOfficeUsers] = useState<OfficeUserOption[]>([]);
  const [officeUsersLoading, setOfficeUsersLoading] = useState(false);
  const [selectedRoomIdForSub, setSelectedRoomIdForSub] = useState<number | null>(null);
  const [selectedUserIdForSub, setSelectedUserIdForSub] = useState<number | null>(null);
  const [showRoomSubDropdown, setShowRoomSubDropdown] = useState(false);
  const [showUserSubDropdown, setShowUserSubDropdown] = useState(false);
  const [isCreatingSub, setIsCreatingSub] = useState(false);
  const [subError, setSubError] = useState<string | null>(null);
  const [deletingSubId, setDeletingSubId] = useState<number | null>(null);

  useEffect(() => {
    setOfficesLoading(true);
    getOffices()
      .then((res) => setOffices(res.data ?? []))
      .catch(() => setOffices([]))
      .finally(() => setOfficesLoading(false));
  }, []);

  const loadRoomDevices = useCallback(async () => {
    setLinksLoading(true);
    try {
      const result = await getAllRoomDevices();
      setRoomDevices(result.data.devices ?? []);
    } catch {
      setRoomDevices([]);
    } finally {
      setLinksLoading(false);
    }
  }, []);

  const loadSubscriptions = useCallback(async () => {
    setSubscriptionsLoading(true);
    try {
      const result = await getAllClientRoomSubscriptions();
      setSubscriptions(result.data.subscriptions ?? []);
    } catch {
      setSubscriptions([]);
    } finally {
      setSubscriptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRoomDevices();
    void loadSubscriptions();
  }, [loadRoomDevices, loadSubscriptions]);

  useEffect(() => {
    if (selectedOfficeId == null) {
      setRooms([]);
      return;
    }
    setRoomsLoading(true);
    getMeetingRooms(selectedOfficeId)
      .then((res) => setRooms(res.data ?? []))
      .catch(() => setRooms([]))
      .finally(() => setRoomsLoading(false));
  }, [selectedOfficeId]);

  useEffect(() => {
    if (selectedOfficeId == null) {
      setOfficeUsers([]);
      setSelectedRoomIdForSub(null);
      setSelectedUserIdForSub(null);
      setShowRoomSubDropdown(false);
      setShowUserSubDropdown(false);
      setSubError(null);
      return;
    }
    setOfficeUsersLoading(true);
    setSelectedRoomIdForSub(null);
    setSelectedUserIdForSub(null);
    setShowRoomSubDropdown(false);
    setShowUserSubDropdown(false);
    setSubError(null);
    getOfficeUsers(selectedOfficeId)
      .then((res) => setOfficeUsers(res.data ?? []))
      .catch(() => setOfficeUsers([]))
      .finally(() => setOfficeUsersLoading(false));
  }, [selectedOfficeId]);

  const loadYandexDevices = useCallback(async () => {
    setDevicesListLoading(true);
    try {
      const result = await getYandexDevicesList();
      setYandexDevices(result.data.devices ?? []);
    } catch (err: unknown) {
      setYandexDevices([]);
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Не удалось загрузить устройства";
      toast({ title: "Ошибка", description: message, variant: "destructive", duration: 4000 });
    } finally {
      setDevicesListLoading(false);
    }
  }, [toast]);

  const selectOffice = useCallback((officeId: number | null) => {
    setSelectedOfficeId(officeId);
    setShowOfficeDropdown(false);
    setSelectedRoomId(null);
    setSelectedDevice(null);
    setShowRoomDropdown(false);
    setShowDeviceDropdown(false);
  }, []);

  const handleAddDeviceToRoom = useCallback(async () => {
    if (!selectedRoomId || !selectedDevice) return;
    setLinkError(null);
    setIsLinking(true);
    try {
      await createRoomDevice({
        meeting_room_id: selectedRoomId,
        device_id: selectedDevice.id,
        device_name: selectedDevice.name,
        device_type: selectedDevice.type,
      });
      toast({ title: "Устройство привязано к комнате", duration: 3000 });
      setSelectedRoomId(null);
      setSelectedDevice(null);
      setShowRoomDropdown(false);
      setShowDeviceDropdown(false);
      await loadRoomDevices();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Не удалось привязать устройство";
      setLinkError(message);
    } finally {
      setIsLinking(false);
    }
  }, [loadRoomDevices, selectedDevice, selectedRoomId, toast]);

  const handleUnlink = useCallback(
    async (id: number) => {
      setDeletingLinkId(id);
      try {
        await deleteRoomDevice(id);
        toast({ title: "Устройство отвязано", duration: 3000 });
        await loadRoomDevices();
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Не удалось отвязать устройство";
        toast({ title: "Ошибка", description: message, variant: "destructive", duration: 4000 });
      } finally {
        setDeletingLinkId(null);
      }
    },
    [loadRoomDevices, toast]
  );

  const handleCreateSubscription = useCallback(async () => {
    if (!selectedRoomIdForSub || !selectedUserIdForSub) return;
    setSubError(null);
    setIsCreatingSub(true);
    try {
      await createClientRoomSubscription({
        client_id: selectedUserIdForSub,
        meeting_room_id: selectedRoomIdForSub,
      });
      toast({
        title: "Доступ добавлен",
        description: "Пользователь может управлять умным офисом в этой комнате",
        duration: 3000,
      });
      setSelectedRoomIdForSub(null);
      setSelectedUserIdForSub(null);
      setShowRoomSubDropdown(false);
      setShowUserSubDropdown(false);
      await loadSubscriptions();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Не удалось добавить доступ";
      setSubError(message);
    } finally {
      setIsCreatingSub(false);
    }
  }, [loadSubscriptions, selectedRoomIdForSub, selectedUserIdForSub, toast]);

  const handleDeleteSubscription = useCallback(
    async (id: number) => {
      setDeletingSubId(id);
      try {
        await deleteClientRoomSubscription(id);
        toast({ title: "Доступ удалён", duration: 3000 });
        await loadSubscriptions();
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Не удалось удалить доступ";
        toast({ title: "Ошибка", description: message, variant: "destructive", duration: 4000 });
      } finally {
        setDeletingSubId(null);
      }
    },
    [loadSubscriptions, toast]
  );

  const refreshAll = useCallback(async () => {
    await Promise.all([tokens.loadTokens(), loadRoomDevices(), loadSubscriptions()]);
  }, [loadRoomDevices, loadSubscriptions, tokens]);

  const selectedOffice = useMemo(
    () => offices.find((office) => office.id === selectedOfficeId) ?? null,
    [offices, selectedOfficeId]
  );

  const selectedRoomName = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId)?.name ?? null,
    [rooms, selectedRoomId]
  );

  const selectedRoomNameForSub = useMemo(
    () => rooms.find((room) => room.id === selectedRoomIdForSub)?.name ?? null,
    [rooms, selectedRoomIdForSub]
  );

  const selectedUserNameForSub = useMemo(
    () => officeUsers.find((user) => user.id === selectedUserIdForSub)?.full_name ?? null,
    [officeUsers, selectedUserIdForSub]
  );

  const roomDevicesForOffice = useMemo(
    () => filterRoomDevicesByOffice(roomDevices, selectedOfficeId),
    [roomDevices, selectedOfficeId]
  );

  const groupedByRoom = useMemo(
    () => groupRoomDevicesByRoom(roomDevicesForOffice),
    [roomDevicesForOffice]
  );

  const subscriptionsForOffice = useMemo(
    () => filterSubscriptionsByOffice(subscriptions, selectedOfficeId),
    [selectedOfficeId, subscriptions]
  );

  const alreadyLinkedDeviceIds = useMemo(
    () => new Set(roomDevices.map((link) => link.device_id)),
    [roomDevices]
  );

  const availableYandexDevices = useMemo(
    () => yandexDevices.filter((device) => !alreadyLinkedDeviceIds.has(device.id)),
    [alreadyLinkedDeviceIds, yandexDevices]
  );

  return {
    ...tokens,
    offices,
    officesLoading,
    selectedOfficeId,
    selectedOffice,
    showOfficeDropdown,
    setShowOfficeDropdown,
    selectOffice,
    rooms,
    roomsLoading,
    roomDevicesForOffice,
    groupedByRoom,
    yandexDevices,
    linksLoading,
    devicesListLoading,
    showRoomDropdown,
    setShowRoomDropdown,
    showDeviceDropdown,
    setShowDeviceDropdown,
    selectedRoomId,
    setSelectedRoomId,
    selectedRoomName,
    selectedDevice,
    setSelectedDevice,
    isLinking,
    deletingLinkId,
    linkError,
    loadYandexDevices,
    handleAddDeviceToRoom,
    handleUnlink,
    subscriptionsForOffice,
    subscriptionsLoading,
    officeUsers,
    officeUsersLoading,
    selectedRoomIdForSub,
    setSelectedRoomIdForSub,
    selectedRoomNameForSub,
    selectedUserIdForSub,
    setSelectedUserIdForSub,
    selectedUserNameForSub,
    showRoomSubDropdown,
    setShowRoomSubDropdown,
    showUserSubDropdown,
    setShowUserSubDropdown,
    isCreatingSub,
    subError,
    deletingSubId,
    handleCreateSubscription,
    handleDeleteSubscription,
    availableYandexDevices,
    refreshAll,
  };
}

export type UseYandexSmartHomeAdminResult = ReturnType<typeof useYandexSmartHomeAdmin>;
