"use client";

import { useCallback, useEffect, useState } from "react";
import {
  controlDevice,
  createClientRoomSubscription,
  createRoomDevice,
  deleteClientRoomSubscription,
  deleteRoomDevice,
  getAllUsers,
  getMeetingRooms,
  getOffices,
  getRoomDevices,
  getRoomDevicesForClient,
  getRoomSubscriptions,
  getYandexDevicesList,
  type ClientRoomSubscription,
  type ControlDeviceRequest,
  type MeetingRoom,
  type Office,
  type RoomDevice,
  type YandexDevice,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface UserInfo {
  id: number;
  full_name: string;
  phone: string;
  role: string;
}

export function useSmartHomeManagement() {
  const { toast } = useToast();

  const [step, setStep] = useState<"offices" | "cabinets">("offices");
  const [offices, setOffices] = useState<Office[]>([]);
  const [selectedOffice, setSelectedOffice] = useState<Office | null>(null);
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<MeetingRoom | null>(null);
  const [roomLinkedDevices, setRoomLinkedDevices] = useState<RoomDevice[]>([]);
  const [roomYandexDevices, setRoomYandexDevices] = useState<YandexDevice[]>([]);
  const [allYandexDevices, setAllYandexDevices] = useState<YandexDevice[]>([]);
  const [roomSubscriptions, setRoomSubscriptions] = useState<ClientRoomSubscription[]>([]);
  const [allUsers, setAllUsers] = useState<UserInfo[]>([]);
  const [loadingOffices, setLoadingOffices] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [isControlling, setIsControlling] = useState<string | null>(null);
  const [isDeletingDevice, setIsDeletingDevice] = useState<number | null>(null);
  const [isDeletingSub, setIsDeletingSub] = useState<number | null>(null);
  const [isAddingDevice, setIsAddingDevice] = useState(false);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [devicesExpanded, setDevicesExpanded] = useState(true);
  const [accessExpanded, setAccessExpanded] = useState(true);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [selectedNewDevice, setSelectedNewDevice] = useState("");
  const [selectedNewEmployee, setSelectedNewEmployee] = useState<number | "">("");
  const [employeeFilter, setEmployeeFilter] = useState("");

  const loadOffices = useCallback(async () => {
    try {
      setLoadingOffices(true);
      const response = await getOffices();
      setOffices(response.data || []);
    } catch (err) {
      console.error("Error loading offices:", err);
    } finally {
      setLoadingOffices(false);
    }
  }, []);

  const loadAllYandexDevices = useCallback(async () => {
    try {
      const response = await getYandexDevicesList();
      setAllYandexDevices(response.data.devices || []);
    } catch (err) {
      console.error("Error loading Yandex devices:", err);
    }
  }, []);

  const loadAllUsers = useCallback(async () => {
    try {
      const response = await getAllUsers();
      const users = response.data?.users || response.data || [];
      setAllUsers(users);
    } catch (err) {
      console.error("Error loading users:", err);
    }
  }, []);

  useEffect(() => {
    void loadOffices();
    void loadAllYandexDevices();
    void loadAllUsers();
  }, [loadAllUsers, loadAllYandexDevices, loadOffices]);

  const handleSelectRoom = useCallback(
    async (room: MeetingRoom) => {
      setSelectedRoom(room);
      setShowAddDevice(false);
      setShowAddEmployee(false);
      setSelectedNewDevice("");
      setSelectedNewEmployee("");
      setEmployeeFilter("");

      setLoadingDevices(true);
      try {
        const [linkedResp, clientResp] = await Promise.all([
          getRoomDevices(room.id),
          getRoomDevicesForClient(room.id).catch(() => ({ data: { devices: [] } })),
        ]);
        setRoomLinkedDevices(linkedResp.data.devices || []);
        setRoomYandexDevices(clientResp.data.devices || []);
      } catch (err) {
        console.error("Error loading room devices:", err);
        setRoomLinkedDevices([]);
        setRoomYandexDevices([]);
      } finally {
        setLoadingDevices(false);
      }

      setLoadingSubscriptions(true);
      try {
        const response = await getRoomSubscriptions(room.id);
        setRoomSubscriptions(response.data.subscriptions || []);
      } catch (err) {
        console.error("Error loading subscriptions:", err);
        setRoomSubscriptions([]);
      } finally {
        setLoadingSubscriptions(false);
      }
    },
    []
  );

  const handleSelectOffice = useCallback(
    async (office: Office) => {
      setSelectedOffice(office);
      setSelectedRoom(null);
      setStep("cabinets");
      try {
        setLoadingRooms(true);
        const response = await getMeetingRooms(office.id);
        const allRooms = response.data || [];
        setRooms(allRooms);
        if (allRooms.length > 0) {
          await handleSelectRoom(allRooms[0]);
        }
      } catch (err) {
        console.error("Error loading rooms:", err);
        setRooms([]);
      } finally {
        setLoadingRooms(false);
      }
    },
    [handleSelectRoom]
  );

  const handleBackToOffices = useCallback(() => {
    setStep("offices");
    setSelectedOffice(null);
    setSelectedRoom(null);
    setRooms([]);
    setRoomLinkedDevices([]);
    setRoomYandexDevices([]);
    setRoomSubscriptions([]);
  }, []);

  const getDeviceState = useCallback((device: YandexDevice): boolean | null => {
    const capability = device.capabilities?.find(
      (cap: { type?: string }) => cap.type === "devices.capabilities.on_off"
    );
    if (capability?.state?.value !== undefined) {
      return capability.state.value;
    }
    return null;
  }, []);

  const handleToggleDevice = useCallback(
    async (device: YandexDevice) => {
      const currentState = getDeviceState(device);
      if (currentState === null) return;

      try {
        setIsControlling(device.id);
        const request: ControlDeviceRequest = {
          device_id: device.id,
          action_type: "devices.capabilities.on_off",
          action_state: {
            instance: "on",
            value: !currentState,
          },
        };
        await controlDevice(request);

        setRoomYandexDevices((prev) =>
          prev.map((item) => {
            if (item.id !== device.id) return item;
            const updated = { ...item };
            const cap = updated.capabilities?.find(
              (candidate: { type?: string }) => candidate.type === "devices.capabilities.on_off"
            );
            if (cap) {
              cap.state = { ...cap.state, value: !currentState };
            }
            return updated;
          })
        );

        toast({
          title: "Успешно",
          description: `${device.name} ${!currentState ? "включено" : "выключено"}`,
          duration: 2000,
        });
      } catch {
        toast({
          title: "Ошибка",
          description: "Не удалось управлять устройством",
          variant: "destructive",
          duration: 3000,
        });
      } finally {
        setIsControlling(null);
      }
    },
    [getDeviceState, toast]
  );

  const handleAddDevice = useCallback(async () => {
    if (!selectedNewDevice || !selectedRoom) return;
    const device = allYandexDevices.find((item) => item.id === selectedNewDevice);
    if (!device) return;

    try {
      setIsAddingDevice(true);
      await createRoomDevice({
        meeting_room_id: selectedRoom.id,
        device_id: device.id,
        device_name: device.name,
        device_type: device.type,
      });
      toast({
        title: "Устройство добавлено",
        description: `${device.name} добавлено в ${selectedRoom.name}`,
        duration: 2000,
      });
      setSelectedNewDevice("");
      setShowAddDevice(false);
      await handleSelectRoom(selectedRoom);
    } catch (err: unknown) {
      toast({
        title: "Ошибка",
        description:
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Не удалось добавить устройство",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsAddingDevice(false);
    }
  }, [allYandexDevices, handleSelectRoom, selectedNewDevice, selectedRoom, toast]);

  const handleDeleteDevice = useCallback(
    async (roomDevice: RoomDevice) => {
      try {
        setIsDeletingDevice(roomDevice.id);
        await deleteRoomDevice(roomDevice.id);
        toast({
          title: "Устройство удалено",
          description: `${roomDevice.device_name} удалено`,
          duration: 2000,
        });
        if (selectedRoom) await handleSelectRoom(selectedRoom);
      } catch (err: unknown) {
        toast({
          title: "Ошибка",
          description:
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            "Не удалось удалить устройство",
          variant: "destructive",
          duration: 3000,
        });
      } finally {
        setIsDeletingDevice(null);
      }
    },
    [handleSelectRoom, selectedRoom, toast]
  );

  const handleAddEmployee = useCallback(async () => {
    if (!selectedNewEmployee || !selectedRoom) return;

    try {
      setIsAddingEmployee(true);
      await createClientRoomSubscription({
        client_id: selectedNewEmployee as number,
        meeting_room_id: selectedRoom.id,
      });
      const user = allUsers.find((item) => item.id === selectedNewEmployee);
      toast({
        title: "Сотрудник добавлен",
        description: `${user?.full_name || "Сотрудник"} получил доступ`,
        duration: 2000,
      });
      setSelectedNewEmployee("");
      setShowAddEmployee(false);
      if (selectedRoom) await handleSelectRoom(selectedRoom);
    } catch (err: unknown) {
      toast({
        title: "Ошибка",
        description:
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Не удалось добавить сотрудника",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsAddingEmployee(false);
    }
  }, [allUsers, handleSelectRoom, selectedNewEmployee, selectedRoom, toast]);

  const handleDeleteSubscription = useCallback(
    async (sub: ClientRoomSubscription) => {
      try {
        setIsDeletingSub(sub.id);
        await deleteClientRoomSubscription(sub.id);
        const name = (sub.subscribedClient || sub.client)?.full_name || "Сотрудник";
        toast({
          title: "Доступ забран",
          description: `У ${name} забран доступ`,
          duration: 2000,
        });
        if (selectedRoom) await handleSelectRoom(selectedRoom);
      } catch (err: unknown) {
        toast({
          title: "Ошибка",
          description:
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            "Не удалось удалить доступ",
          variant: "destructive",
          duration: 3000,
        });
      } finally {
        setIsDeletingSub(null);
      }
    },
    [handleSelectRoom, selectedRoom, toast]
  );

  const getAvailableDevices = useCallback(() => {
    const linkedIds = roomLinkedDevices.map((item) => item.device_id);
    return allYandexDevices.filter((device) => !linkedIds.includes(device.id));
  }, [allYandexDevices, roomLinkedDevices]);

  const getAvailableEmployees = useCallback(() => {
    const subscribedIds = roomSubscriptions.map((item) => item.client_id);
    const isCabinet = selectedRoom?.room_type === "cabinet";
    let filtered = isCabinet
      ? allUsers.filter((user) => user.role !== "client")
      : allUsers.filter((user) => user.role === "client");
    filtered = filtered.filter((user) => !subscribedIds.includes(user.id));
    if (employeeFilter.trim()) {
      const query = employeeFilter.toLowerCase();
      filtered = filtered.filter(
        (user) => user.full_name.toLowerCase().includes(query) || user.phone.includes(query)
      );
    }
    return filtered;
  }, [allUsers, employeeFilter, roomSubscriptions, selectedRoom?.room_type]);

  const findYandexDevice = useCallback(
    (deviceId: string): YandexDevice | undefined => {
      return roomYandexDevices.find((device) => device.id === deviceId);
    },
    [roomYandexDevices]
  );

  return {
    step,
    offices,
    selectedOffice,
    rooms,
    selectedRoom,
    roomLinkedDevices,
    roomSubscriptions,
    loadingOffices,
    loadingRooms,
    loadingDevices,
    loadingSubscriptions,
    isControlling,
    isDeletingDevice,
    isDeletingSub,
    isAddingDevice,
    isAddingEmployee,
    devicesExpanded,
    setDevicesExpanded,
    accessExpanded,
    setAccessExpanded,
    showAddDevice,
    setShowAddDevice,
    showAddEmployee,
    setShowAddEmployee,
    selectedNewDevice,
    setSelectedNewDevice,
    selectedNewEmployee,
    setSelectedNewEmployee,
    employeeFilter,
    setEmployeeFilter,
    handleSelectOffice,
    handleSelectRoom,
    handleBackToOffices,
    getDeviceState,
    handleToggleDevice,
    handleAddDevice,
    handleDeleteDevice,
    handleAddEmployee,
    handleDeleteSubscription,
    getAvailableDevices,
    getAvailableEmployees,
    findYandexDevice,
  };
}

export type UseSmartHomeManagementResult = ReturnType<typeof useSmartHomeManagement>;
