"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Building2,
  ChevronDown,
  DoorOpen,
  ImagePlus,
  Info,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  parseFloorField,
  toHHmm,
  toHHmmss,
} from "@/lib/office-management-utils";
import {
  createMeetingRoom,
  createOffice,
  createOfficeWithPhoto,
  deleteMeetingRoom,
  deleteOffice,
  fetchManagedOffices,
  getOfficeRooms,
  updateMeetingRoom,
  updateOffice,
  updateOfficeWithPhoto,
  updateOfficeWorkingHours,
  type ManagedOffice,
  type MeetingRoom,
} from "@/lib/offices-management-api";

type AdminOfficeManagementScreenProps = {
  onRegisterRefresh?: (refetch: () => Promise<void>) => void;
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-1.5 text-[13px] font-medium text-muted-foreground">{children}</p>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2.5 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}

/** Управление офисами — parity с workflow-mobile admin-worker/office.tsx */
export function AdminOfficeManagementScreen({
  onRegisterRefresh,
}: AdminOfficeManagementScreenProps) {
  const { toast } = useToast();
  const newPhotoInputRef = useRef<HTMLInputElement>(null);
  const editPhotoInputRef = useRef<HTMLInputElement>(null);

  const [offices, setOffices] = useState<ManagedOffice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [savingHoursId, setSavingHoursId] = useState<number | null>(null);
  const [startInput, setStartInput] = useState("");
  const [endInput, setEndInput] = useState("");
  const [autoTrack, setAutoTrack] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editBlock, setEditBlock] = useState("");
  const [editFloor, setEditFloor] = useState("");
  const [savingDataId, setSavingDataId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newBlock, setNewBlock] = useState("");
  const [newFloor, setNewFloor] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newOfficePhoto, setNewOfficePhoto] = useState<File | null>(null);
  const [editOfficePhoto, setEditOfficePhoto] = useState<File | null>(null);

  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomFloor, setNewRoomFloor] = useState("");
  const [newRoomCapacity, setNewRoomCapacity] = useState("");
  const [roomCreateError, setRoomCreateError] = useState<string | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  const [editRoomName, setEditRoomName] = useState("");
  const [editRoomFloor, setEditRoomFloor] = useState("");
  const [editRoomCapacity, setEditRoomCapacity] = useState("");
  const [savingRoomId, setSavingRoomId] = useState<number | null>(null);
  const [deletingRoomId, setDeletingRoomId] = useState<number | null>(null);

  const [deleteOfficeTarget, setDeleteOfficeTarget] = useState<ManagedOffice | null>(null);
  const [deleteRoomTarget, setDeleteRoomTarget] = useState<{
    room: MeetingRoom;
    officeId: number;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchManagedOffices();
    if (result.ok) setOffices(result.data);
    else {
      setOffices([]);
      setError(result.error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    onRegisterRefresh?.(load);
  }, [onRegisterRefresh, load]);

  const loadRooms = useCallback(async (officeId: number) => {
    setRoomsLoading(true);
    const result = await getOfficeRooms(officeId);
    setRooms(result.ok ? result.data : []);
    setRoomsLoading(false);
  }, []);

  const expand = useCallback(
    async (office: ManagedOffice) => {
      const id = office.id;
      if (expandedId === id) {
        setExpandedId(null);
        setShowAddRoom(false);
        setEditingRoomId(null);
        setRoomCreateError(null);
        setEditOfficePhoto(null);
        return;
      }
      setExpandedId(id);
      setShowAddRoom(false);
      setEditingRoomId(null);
      setRoomCreateError(null);
      setEditOfficePhoto(null);
      setStartInput(toHHmm(office.working_hours_start ?? ""));
      setEndInput(toHHmm(office.working_hours_end ?? ""));
      setAutoTrack(!!office.auto_track_enabled);
      setEditName(office.name ?? "");
      setEditAddress(office.address ?? "");
      setEditCity(office.city ?? "");
      setEditBlock(office.block ?? "");
      setEditFloor(office.floor != null ? String(office.floor) : "");
      setRooms([]);
      await loadRooms(id);
    },
    [expandedId, loadRooms],
  );

  const handleAddRoom = async (officeId: number) => {
    const name = newRoomName.trim();
    if (!name) {
      setRoomCreateError("Введите название комнаты");
      return;
    }
    const floor = parseInt(newRoomFloor, 10);
    const capacity = parseInt(newRoomCapacity, 10);
    if (Number.isNaN(floor) || floor < 0) {
      setRoomCreateError("Этаж — число ≥ 0");
      return;
    }
    if (Number.isNaN(capacity) || capacity < 1) {
      setRoomCreateError("Вместимость — число ≥ 1");
      return;
    }
    setRoomCreateError(null);
    setIsCreatingRoom(true);
    const result = await createMeetingRoom({ name, office_id: officeId, floor, capacity });
    if (result.ok) {
      toast({ title: "Переговорная добавлена" });
      setNewRoomName("");
      setNewRoomFloor("");
      setNewRoomCapacity("");
      setShowAddRoom(false);
      await loadRooms(officeId);
    } else {
      setRoomCreateError(result.error);
    }
    setIsCreatingRoom(false);
  };

  const startEditRoom = (room: MeetingRoom) => {
    setEditingRoomId(room.id);
    setEditRoomName(room.name ?? "");
    setEditRoomFloor(String(room.floor ?? 0));
    setEditRoomCapacity(String(room.capacity ?? 1));
  };

  const saveRoom = async (roomId: number, officeId: number) => {
    const name = editRoomName.trim();
    if (!name) {
      toast({ title: "Введите название комнаты", variant: "destructive" });
      return;
    }
    const floor = parseInt(editRoomFloor, 10);
    const capacity = parseInt(editRoomCapacity, 10);
    if (Number.isNaN(floor) || floor < 0 || Number.isNaN(capacity) || capacity < 1) {
      toast({ title: "Этаж ≥ 0, вместимость ≥ 1", variant: "destructive" });
      return;
    }
    setSavingRoomId(roomId);
    const result = await updateMeetingRoom(roomId, { name, floor, capacity });
    if (result.ok) {
      toast({ title: "Данные комнаты сохранены" });
      setEditingRoomId(null);
      await loadRooms(officeId);
    } else {
      toast({ title: "Ошибка", description: result.error, variant: "destructive" });
    }
    setSavingRoomId(null);
  };

  const confirmDeleteRoom = async () => {
    if (!deleteRoomTarget) return;
    const { room, officeId } = deleteRoomTarget;
    setDeletingRoomId(room.id);
    const result = await deleteMeetingRoom(room.id);
    if (result.ok) {
      toast({ title: "Переговорная удалена" });
      await loadRooms(officeId);
    } else {
      toast({ title: "Ошибка", description: result.error, variant: "destructive" });
    }
    setDeletingRoomId(null);
    setDeleteRoomTarget(null);
  };

  const saveOfficeData = async (officeId: number) => {
    if (!editName.trim()) {
      toast({ title: "Введите название офиса", variant: "destructive" });
      return;
    }
    const floorParsed = parseFloorField(editFloor);
    if (!floorParsed.ok) {
      toast({ title: "Этаж — целое число ≥ 0", variant: "destructive" });
      return;
    }
    const blockTrim = editBlock.trim();
    setSavingDataId(officeId);

    let result;
    if (editOfficePhoto) {
      const fd = new FormData();
      fd.append("name", editName.trim());
      fd.append("address", editAddress.trim());
      fd.append("city", editCity.trim());
      fd.append("block", blockTrim);
      fd.append("floor", floorParsed.value === null ? "" : String(floorParsed.value));
      fd.append("photo", editOfficePhoto);
      result = await updateOfficeWithPhoto(officeId, fd);
      setEditOfficePhoto(null);
    } else {
      result = await updateOffice(officeId, {
        name: editName.trim(),
        address: editAddress.trim() || undefined,
        city: editCity.trim() || undefined,
        block: blockTrim || null,
        floor: floorParsed.value,
      });
    }

    if (result.ok) {
      toast({ title: "Данные офиса сохранены" });
      const d = result.data;
      setOffices((prev) =>
        prev.map((o) =>
          o.id === officeId
            ? {
                ...o,
                name: editName.trim(),
                address: editAddress.trim(),
                city: editCity.trim(),
                block: d?.block ?? (blockTrim || null),
                floor: d?.floor ?? floorParsed.value,
                photo: d?.photo ?? o.photo,
              }
            : o,
        ),
      );
    } else {
      toast({ title: "Ошибка", description: result.error, variant: "destructive" });
    }
    setSavingDataId(null);
  };

  const handleCreateOffice = async () => {
    if (!newName.trim() || !newAddress.trim() || !newCity.trim()) {
      setCreateError("Заполните название, адрес и город");
      return;
    }
    const floorParsed = parseFloorField(newFloor);
    if (!floorParsed.ok) {
      setCreateError("Этаж — целое число ≥ 0");
      return;
    }
    setCreateError(null);
    setIsCreating(true);
    const blockTrim = newBlock.trim();
    let result;
    if (newOfficePhoto) {
      const fd = new FormData();
      fd.append("name", newName.trim());
      fd.append("address", newAddress.trim());
      fd.append("city", newCity.trim());
      fd.append("block", blockTrim);
      fd.append("floor", floorParsed.value === null ? "" : String(floorParsed.value));
      fd.append("photo", newOfficePhoto);
      result = await createOfficeWithPhoto(fd);
    } else {
      result = await createOffice({
        name: newName.trim(),
        address: newAddress.trim(),
        city: newCity.trim(),
        block: blockTrim || undefined,
        floor: floorParsed.value,
      });
    }
    if (result.ok) {
      toast({ title: "Офис создан" });
      setNewName("");
      setNewAddress("");
      setNewCity("");
      setNewBlock("");
      setNewFloor("");
      setNewOfficePhoto(null);
      setShowCreateForm(false);
      await load();
    } else {
      setCreateError(result.error);
    }
    setIsCreating(false);
  };

  const confirmDeleteOffice = async () => {
    if (!deleteOfficeTarget) return;
    const office = deleteOfficeTarget;
    setDeletingId(office.id);
    const result = await deleteOffice(office.id);
    if (result.ok) {
      toast({ title: "Офис удалён" });
      if (expandedId === office.id) setExpandedId(null);
      await load();
    } else {
      toast({ title: "Ошибка", description: result.error, variant: "destructive" });
    }
    setDeletingId(null);
    setDeleteOfficeTarget(null);
  };

  const saveWorkingHours = async (officeId: number) => {
    const start = toHHmmss(startInput);
    const end = toHHmmss(endInput);
    if (!start || !end) {
      toast({ title: "Введите начало и конец рабочего дня", variant: "destructive" });
      return;
    }
    setSavingHoursId(officeId);
    const result = await updateOfficeWorkingHours(officeId, {
      working_hours_start: start,
      working_hours_end: end,
      auto_track_enabled: autoTrack,
    });
    if (result.ok) {
      toast({ title: "Часы сохранены" });
      setOffices((prev) =>
        prev.map((o) =>
          o.id === officeId
            ? {
                ...o,
                working_hours_start: start,
                working_hours_end: end,
                auto_track_enabled: autoTrack,
              }
            : o,
        ),
      );
    } else {
      toast({ title: "Ошибка", description: result.error, variant: "destructive" });
    }
    setSavingHoursId(null);
  };

  if (loading && offices.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-[#F35713]" />
        <p className="text-sm text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">{error}</p>
        <button
          type="button"
          onClick={() => load()}
          className="mt-3 rounded-lg bg-[#F35713] px-4 py-2 text-sm font-semibold text-white"
        >
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => {
          if (showCreateForm) setNewOfficePhoto(null);
          setShowCreateForm((v) => !v);
        }}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F35713] py-3 text-[15px] font-semibold text-white"
      >
        <Building2 className="h-5 w-5" />
        {showCreateForm ? "Отмена" : "Добавить офис"}
      </button>

      {showCreateForm ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <SectionLabel>Новый офис</SectionLabel>
          <FieldLabel>Название</FieldLabel>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Введите название"
            className="mb-3"
          />
          <FieldLabel>Адрес</FieldLabel>
          <Input
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            placeholder="Улица, дом"
            className="mb-3"
          />
          <FieldLabel>Город</FieldLabel>
          <Input
            value={newCity}
            onChange={(e) => setNewCity(e.target.value)}
            placeholder="Город"
            className="mb-3"
          />
          <div className="mb-3 grid grid-cols-2 gap-2.5">
            <div>
              <FieldLabel>Блок</FieldLabel>
              <Input
                value={newBlock}
                onChange={(e) => setNewBlock(e.target.value)}
                placeholder="Необязательно"
              />
            </div>
            <div>
              <FieldLabel>Этаж</FieldLabel>
              <Input
                value={newFloor}
                onChange={(e) => setNewFloor(e.target.value)}
                placeholder="Необязательно"
                inputMode="numeric"
              />
            </div>
          </div>
          <input
            ref={newPhotoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setNewOfficePhoto(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => newPhotoInputRef.current?.click()}
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#F35713] py-3 text-[15px] font-semibold text-[#F35713]"
          >
            <ImagePlus className="h-5 w-5" />
            {newOfficePhoto ? "Фото выбрано" : "Добавить фото офиса"}
          </button>
          {createError ? <p className="mb-2 text-sm text-destructive">{createError}</p> : null}
          <button
            type="button"
            onClick={handleCreateOffice}
            disabled={isCreating}
            className="flex w-full items-center justify-center rounded-xl bg-[#F35713] py-3 font-semibold text-white disabled:opacity-50"
          >
            {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Создать офис"}
          </button>
        </div>
      ) : null}

      {offices.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">Нет офисов</p>
      ) : (
        offices.map((office) => {
          const isExpanded = expandedId === office.id;
          const hoursStr =
            office.working_hours_start && office.working_hours_end
              ? `${toHHmm(office.working_hours_start)} – ${toHHmm(office.working_hours_end)}`
              : "—";
          return (
            <div key={office.id} className="overflow-hidden rounded-2xl border border-border bg-card">
              <button
                type="button"
                onClick={() => expand(office)}
                className="flex w-full items-center justify-between gap-2 p-4 text-left"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Building2 className="h-[22px] w-[22px] shrink-0 text-[#F35713]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[17px] font-semibold text-foreground">{office.name}</p>
                    <p className="truncate text-[13px] text-muted-foreground">
                      {office.city ?? ""} {office.address ?? ""}
                    </p>
                    {office.block || office.floor != null ? (
                      <p className="truncate text-[13px] text-muted-foreground">
                        {[office.block ? `Блок ${office.block}` : null, office.floor != null ? `${office.floor} этаж` : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      {hoursStr}
                      {office.auto_track_enabled ? " · авто-трекер" : ""}
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`h-6 w-6 shrink-0 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
                />
              </button>

              {isExpanded ? (
                <div className="border-t border-border p-4 space-y-4">
                  <div>
                    <SectionLabel>Данные офиса</SectionLabel>
                    <FieldLabel>Название</FieldLabel>
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="mb-3" />
                    <FieldLabel>Адрес</FieldLabel>
                    <Input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} className="mb-3" />
                    <FieldLabel>Город</FieldLabel>
                    <Input value={editCity} onChange={(e) => setEditCity(e.target.value)} className="mb-3" />
                    <div className="mb-3 grid grid-cols-2 gap-2.5">
                      <div>
                        <FieldLabel>Блок</FieldLabel>
                        <Input value={editBlock} onChange={(e) => setEditBlock(e.target.value)} placeholder="Необязательно" />
                      </div>
                      <div>
                        <FieldLabel>Этаж</FieldLabel>
                        <Input
                          value={editFloor}
                          onChange={(e) => setEditFloor(e.target.value)}
                          placeholder="Необязательно"
                          inputMode="numeric"
                        />
                      </div>
                    </div>
                    <input
                      ref={editPhotoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setEditOfficePhoto(e.target.files?.[0] ?? null)}
                    />
                    <button
                      type="button"
                      onClick={() => editPhotoInputRef.current?.click()}
                      className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#F35713] py-3 text-[15px] font-semibold text-[#F35713]"
                    >
                      <ImagePlus className="h-5 w-5" />
                      {editOfficePhoto ? "Фото выбрано" : "Изменить фото офиса"}
                    </button>
                    <button
                      type="button"
                      onClick={() => saveOfficeData(office.id)}
                      disabled={savingDataId === office.id}
                      className="flex w-full items-center justify-center rounded-xl bg-[#F35713] py-3 font-semibold text-white disabled:opacity-50"
                    >
                      {savingDataId === office.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Сохранить данные офиса"
                      )}
                    </button>
                  </div>

                  <div>
                    <SectionLabel>Рабочие часы</SectionLabel>
                    <FieldLabel>Начало дня</FieldLabel>
                    <Input
                      value={startInput}
                      onChange={(e) => setStartInput(e.target.value)}
                      placeholder="09:00"
                      className="mb-3"
                    />
                    <FieldLabel>Конец дня</FieldLabel>
                    <Input
                      value={endInput}
                      onChange={(e) => setEndInput(e.target.value)}
                      placeholder="18:00"
                      className="mb-3"
                    />
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <span className="flex-1 text-[15px] text-foreground">
                        Авто-трекер по рабочим часам
                      </span>
                      <Switch checked={autoTrack} onCheckedChange={setAutoTrack} />
                    </div>
                    <button
                      type="button"
                      onClick={() => saveWorkingHours(office.id)}
                      disabled={savingHoursId === office.id}
                      className="flex w-full items-center justify-center rounded-xl bg-[#F35713] py-3 font-semibold text-white disabled:opacity-50"
                    >
                      {savingHoursId === office.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Сохранить часы"
                      )}
                    </button>
                  </div>

                  <div>
                    <SectionLabel>Переговорные</SectionLabel>
                    {roomsLoading ? (
                      <Loader2 className="mx-auto my-3 h-6 w-6 animate-spin text-[#F35713]" />
                    ) : (
                      <>
                        <div className="mb-3 space-y-2">
                          {rooms.map((r) => (
                            <div key={r.id}>
                              {editingRoomId === r.id ? (
                                <div className="space-y-2 rounded-xl bg-muted/50 p-3">
                                  <FieldLabel>Название</FieldLabel>
                                  <Input value={editRoomName} onChange={(e) => setEditRoomName(e.target.value)} />
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <FieldLabel>Этаж</FieldLabel>
                                      <Input
                                        value={editRoomFloor}
                                        onChange={(e) => setEditRoomFloor(e.target.value)}
                                        inputMode="numeric"
                                      />
                                    </div>
                                    <div>
                                      <FieldLabel>Вместимость</FieldLabel>
                                      <Input
                                        value={editRoomCapacity}
                                        onChange={(e) => setEditRoomCapacity(e.target.value)}
                                        inputMode="numeric"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex gap-2 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => saveRoom(r.id, office.id)}
                                      disabled={savingRoomId === r.id}
                                      className="rounded-xl bg-[#F35713] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                                    >
                                      {savingRoomId === r.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        "Сохранить"
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingRoomId(null)}
                                      className="px-4 py-2.5 text-sm text-muted-foreground"
                                    >
                                      Отмена
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-3 py-2.5">
                                  <div className="flex min-w-0 flex-1 items-center gap-2">
                                    <DoorOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    <div className="min-w-0">
                                      <p className="truncate font-medium text-foreground">{r.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        этаж {r.floor ?? 0} · {r.capacity ?? 0} чел.
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => startEditRoom(r)}
                                      disabled={deletingRoomId === r.id}
                                      className="rounded-lg p-2 active:opacity-70"
                                      aria-label="Редактировать"
                                    >
                                      <Pencil className="h-5 w-5 text-[#F35713]" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setDeleteRoomTarget({ room: r, officeId: office.id })
                                      }
                                      disabled={deletingRoomId === r.id}
                                      className="rounded-lg p-2 active:opacity-70"
                                      aria-label="Удалить"
                                    >
                                      {deletingRoomId === r.id ? (
                                        <Loader2 className="h-5 w-5 animate-spin text-destructive" />
                                      ) : (
                                        <Trash2 className="h-5 w-5 text-destructive" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {!showAddRoom ? (
                          <button
                            type="button"
                            onClick={() => setShowAddRoom(true)}
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#F35713] py-3 text-[15px] font-semibold text-[#F35713]"
                          >
                            <Plus className="h-5 w-5" />
                            Добавить переговорную
                          </button>
                        ) : (
                          <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-3.5">
                            <SectionLabel>Новая переговорная</SectionLabel>
                            <FieldLabel>Название</FieldLabel>
                            <Input
                              value={newRoomName}
                              onChange={(e) => setNewRoomName(e.target.value)}
                              placeholder="Переговорная"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <FieldLabel>Этаж</FieldLabel>
                                <Input
                                  value={newRoomFloor}
                                  onChange={(e) => setNewRoomFloor(e.target.value)}
                                  placeholder="0"
                                  inputMode="numeric"
                                />
                              </div>
                              <div>
                                <FieldLabel>Вместимость</FieldLabel>
                                <Input
                                  value={newRoomCapacity}
                                  onChange={(e) => setNewRoomCapacity(e.target.value)}
                                  placeholder="1"
                                  inputMode="numeric"
                                />
                              </div>
                            </div>
                            {roomCreateError ? (
                              <p className="text-sm text-destructive">{roomCreateError}</p>
                            ) : null}
                            <div className="flex items-center gap-3 pt-1">
                              <button
                                type="button"
                                onClick={() => handleAddRoom(office.id)}
                                disabled={isCreatingRoom}
                                className="rounded-xl bg-[#F35713] px-5 py-2.5 font-semibold text-white disabled:opacity-50"
                              >
                                {isCreatingRoom ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Создать"
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowAddRoom(false);
                                  setRoomCreateError(null);
                                  setNewRoomName("");
                                  setNewRoomFloor("");
                                  setNewRoomCapacity("");
                                }}
                                className="text-sm text-muted-foreground"
                              >
                                Отмена
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setDeleteOfficeTarget(office)}
                    disabled={deletingId === office.id}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-destructive py-3 font-semibold text-white disabled:opacity-50"
                  >
                    {deletingId === office.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="h-[18px] w-[18px]" />
                        Удалить офис
                      </>
                    )}
                  </button>
                </div>
              ) : null}
            </div>
          );
        })
      )}

      <div className="flex items-start gap-2.5 rounded-xl bg-[rgba(243,87,19,0.12)] p-3">
        <Info className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#F35713]" />
        <p className="text-xs text-muted-foreground">
          Координаты на карте (широта и долгота) при необходимости задаются в веб-версии.
        </p>
      </div>

      <AlertDialog
        open={deleteOfficeTarget != null}
        onOpenChange={(open) => !open && setDeleteOfficeTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить офис?</AlertDialogTitle>
            <AlertDialogDescription>
              Офис «{deleteOfficeTarget?.name}» будет удалён. Переговорные и привязки тоже могут быть
              затронуты.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDeleteOffice}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteRoomTarget != null}
        onOpenChange={(open) => !open && setDeleteRoomTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить переговорную?</AlertDialogTitle>
            <AlertDialogDescription>
              Комната «{deleteRoomTarget?.room.name}» будет удалена.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDeleteRoom}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
