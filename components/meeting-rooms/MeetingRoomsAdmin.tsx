import { useState, useEffect, useMemo } from "react";
import {
  MeetingRoom,
  MeetingRoomStatus,
  MeetingRoomType,
  useMeetingRoomsStore,
} from "@/stores/meetingRoomsStore";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  MAX_ROOM_PHOTOS,
  MeetingRoomFormDialog,
  type FormPhotoItem,
  type RoomFormErrors,
  type RoomFormState,
} from "@/components/meeting-rooms/meeting-room-form-dialog";
import { MeetingRoomCard } from "@/components/meeting-rooms/MeetingRoomCard";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-media-query";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Trash2,
  Copy,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getOffices,
  Office,
  uploadMeetingRoomPhotos,
  deleteMeetingRoomPhoto,
} from "@/lib/api";

const EMPTY_FORM: RoomFormState = {
  office_id: null,
  name: "",
  floor: "",
  capacity: "",
  room_type: "meeting",
  status: "available",
  isActive: true,
  photos: [],
  description: "",
};

const toFormState = (room: MeetingRoom): RoomFormState => {
  const photos: FormPhotoItem[] = [];
  if (room.roomPhotos?.length) {
    room.roomPhotos.forEach((p) => {
      photos.push({ type: "existing", id: p.id, url: p.photo_url });
    });
  } else if (room.photos?.length) {
    room.photos.forEach((url) => {
      photos.push({ type: "existing", id: -1, url });
    });
  }
  return {
    id: room.id,
    office_id: room.office_id ?? room.office?.id ?? null,
    name: room.name,
    floor: room.floor,
    capacity: room.capacity,
    room_type: room.room_type,
    status: room.status,
    isActive: room.isActive,
    photos,
    description: room.description ?? "",
  };
};

const MAX_PHOTOS = MAX_ROOM_PHOTOS;
const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/png"];
const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024; // 2MB per file

interface MeetingRoomsAdminProps {
  variant?: "default" | "dark";
}

export function MeetingRoomsAdmin({ variant = "default" }: MeetingRoomsAdminProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const isDark = variant === "dark";
  const useDarkStyles = isDark || isMobile;
  const rooms = useMeetingRoomsStore((state) => state.rooms);
  const fetchRooms = useMeetingRoomsStore((state) => state.fetchRooms);
  const addRoom = useMeetingRoomsStore((state) => state.addRoom);
  const updateRoom = useMeetingRoomsStore((state) => state.updateRoom);
  const removeRoom = useMeetingRoomsStore((state) => state.removeRoom);
  const toggleRoomActive = useMeetingRoomsStore((state) => state.toggleRoomActive);
  const duplicateRoom = useMeetingRoomsStore((state) => state.duplicateRoom);
  const setRoomStatus = useMeetingRoomsStore((state) => state.setRoomStatus);

  const [open, setOpen] = useState(false);
  const [formState, setFormState] = useState<RoomFormState>(EMPTY_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [pendingDeleteRoom, setPendingDeleteRoom] = useState<MeetingRoom | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [errors, setErrors] = useState<RoomFormErrors>({});
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const role = useAuthStore((s) => s.user?.role ?? s.role);
  const userOfficeId = useAuthStore((s) => s.user?.office_id ?? null);
  // Офис-менеджер управляет только переговорными своего офиса.
  const officeLocked = role === "department-head";
  const [offices, setOffices] = useState<Office[]>([]);
  const [selectedOfficeId, setSelectedOfficeId] = useState<number | "all">("all");
  const [roomTypeFilter, setRoomTypeFilter] = useState<MeetingRoomType | "all">("all");
  const [originalExistingPhotoIds, setOriginalExistingPhotoIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    const loadOffices = async () => {
      try {
        const response = await getOffices();
        setOffices(response.data);
      } catch (error) {
        console.error("Ошибка при загрузке офисов:", error);
      }
    };
    loadOffices();
  }, []);


  const resetForm = () => {
    formState.photos.forEach((p) => {
      if (p.type === "new") URL.revokeObjectURL(p.preview);
    });
    setFormState(EMPTY_FORM);
    setIsEditing(false);
    setOriginalExistingPhotoIds(new Set());
    setErrors({});
    setTouched(false);
  };

  const handlePhotoFiles = (files: FileList | null) => {
    if (!files) {
      return;
    }

    const remainingSlots = MAX_PHOTOS - formState.photos.length;
    if (remainingSlots <= 0) {
      const msg = `Нельзя добавить больше ${MAX_PHOTOS} фото`;
      setErrors((e) => ({ ...e, photos: msg }));
      toast({ title: msg, variant: "destructive" });
      return;
    }

    const fileArray = Array.from(files);
    const unsupported = fileArray.filter((file) => !ACCEPTED_FILE_TYPES.includes(file.type));
    const oversize = fileArray.filter((file) => file.size > MAX_PHOTO_SIZE_BYTES);

    if (unsupported.length) {
      const msg = "Неподдерживаемый формат. Загружайте JPG или PNG.";
      setErrors((e) => ({ ...e, photos: msg }));
      toast({ title: "Неподдерживаемый формат", description: msg, variant: "destructive" });
    } else if (oversize.length) {
      const msg = "Каждое фото должно быть не больше 2MB";
      setErrors((e) => ({ ...e, photos: msg }));
      toast({ title: "Слишком большой файл", description: msg, variant: "destructive" });
    }

    const allowedFiles = fileArray
      .filter((file) => ACCEPTED_FILE_TYPES.includes(file.type) && file.size <= MAX_PHOTO_SIZE_BYTES)
      .slice(0, remainingSlots);

    if (!allowedFiles.length) {
      return;
    }

    const newItems: FormPhotoItem[] = allowedFiles.map((file) => ({
      type: "new",
      file,
      preview: URL.createObjectURL(file),
    }));
    setFormState((prev) => ({
      ...prev,
      photos: [...prev.photos, ...newItems],
    }));
    setErrors((e) => ({ ...e, photos: undefined }));
  };

  const handleRemovePhoto = (index: number) => {
    setFormState((prev) => {
      const photo = prev.photos[index];
      if (photo?.type === "new") {
        URL.revokeObjectURL(photo.preview);
      }
      return {
        ...prev,
        photos: prev.photos.filter((_, i) => i !== index),
      };
    });
    setErrors((e) => ({ ...e, photos: undefined }));
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      formState.photos.forEach((p) => {
        if (p.type === "new") URL.revokeObjectURL(p.preview);
      });
      resetForm();
    }
    setOpen(next);
  };

  const handleAddRoomClick = () => {
    resetForm();
    // Новая комната — в офисе из фильтра списка, иначе в своём офисе.
    const defaultOfficeId = officeLocked
      ? userOfficeId
      : selectedOfficeId !== "all"
        ? selectedOfficeId
        : userOfficeId;
    setFormState({ ...EMPTY_FORM, office_id: defaultOfficeId });
    setOpen(true);
  };

  const updateForm = (patch: Partial<RoomFormState>) => {
    setFormState((prev) => ({ ...prev, ...patch }));
    if (touched) {
      setErrors((prev) => {
        const next = { ...prev };
        if ("office_id" in patch) delete next.office;
        if ("name" in patch) delete next.name;
        if ("floor" in patch) delete next.floor;
        if ("capacity" in patch) delete next.capacity;
        if ("room_type" in patch) delete next.photos;
        return next;
      });
    }
  };

  const handleEdit = (room: MeetingRoom) => {
    setIsEditing(true);
    const state = toFormState(room);
    setFormState(state);
    const ids = new Set(
      state.photos
        .filter((p): p is { type: "existing"; id: number; url: string } =>
          p.type === "existing" && p.id >= 0
        )
        .map((p) => p.id)
    );
    setOriginalExistingPhotoIds(ids);
    setOpen(true);
  };

  const handleDuplicate = async (id: number) => {
    try {
      await duplicateRoom(id);
      toast({ title: "Комната скопирована", description: "Создана копия переговорной" });
    } catch (error) {
      toast({ title: "Ошибка", description: "Не удалось скопировать переговорную", variant: "destructive" });
    }
  };

  const requestDeleteRoom = (room: MeetingRoom) => {
    setPendingDeleteRoom(room);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDeleteRoom) {
      return;
    }

    try {
      await removeRoom(pendingDeleteRoom.id);
      toast({
        title: "Переговорная удалена",
        description: `Переговорная ${pendingDeleteRoom.name} удалена из справочника`,
      });

      if (formState.id === pendingDeleteRoom.id) {
        handleOpenChange(false);
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить переговорную",
        variant: "destructive",
      });
    } finally {
      setPendingDeleteRoom(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleDeleteDialogOpenChange = (openState: boolean) => {
    setDeleteDialogOpen(openState);
    if (!openState) {
      setPendingDeleteRoom(null);
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      await toggleRoomActive(id);
    } catch (error) {
      toast({ title: "Ошибка", description: "Не удалось изменить статус переговорной", variant: "destructive" });
    }
  };

  const handleStatusChange = async (id: number, status: MeetingRoomStatus) => {
    try {
      await setRoomStatus(id, status);
    } catch (error) {
      toast({ title: "Ошибка", description: "Не удалось обновить статус переговорной", variant: "destructive" });
    }
  };

  const filteredRooms = useMemo(() => {
    let result = rooms;

    if (selectedOfficeId !== "all") {
      result = result.filter((room) => room.office_id === selectedOfficeId);
    }

    if (roomTypeFilter !== "all") {
      result = result.filter((room) => room.room_type === roomTypeFilter);
    }

    return result;
  }, [rooms, selectedOfficeId, roomTypeFilter]);

  const validateForm = (): boolean => {
    const next: typeof errors = {};
    if (!formState.office_id) next.office = "Выберите офис";
    if (!formState.name.trim()) next.name = "Введите название комнаты";
    if (!formState.floor || Number(formState.floor) < 1) next.floor = "Выберите этаж";
    if (!formState.capacity || Number(formState.capacity) < 1) next.capacity = "Укажите вместимость";
    // Для переговорных фото обязательно, для кабинетов можно без фото
    if (formState.room_type === "meeting" && !formState.photos.length) {
      next.photos = "Добавьте минимум одно фото для переговорной";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    setTouched(true);
    if (!validateForm()) {
      toast({ title: "Заполните обязательные поля", variant: "destructive" });
      return;
    }

    const roomData = {
      office_id: formState.office_id,
      name: formState.name.trim(),
      floor: Number(formState.floor),
      capacity: Number(formState.capacity),
      room_type: formState.room_type,
      status: formState.status,
      isActive: formState.isActive,
      photos: [] as string[],
      description: formState.description.trim(),
    };

    const newFiles = formState.photos.filter((p): p is { type: "new"; file: File; preview: string } => p.type === "new");
    const errorMessage = (error: unknown) =>
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message;

    // Фото уходят вторым запросом, когда переговорная уже сохранена: его сбой — не сбой сохранения,
    // и пользователь должен узнать, что фото не загрузились, а не увидеть «добавлена».
    const uploadNewPhotos = async (roomId: number): Promise<string | null> => {
      if (!newFiles.length) return null;
      const fd = new FormData();
      newFiles.forEach((item) => fd.append("photos", item.file));
      try {
        await uploadMeetingRoomPhotos(roomId, fd);
        return null;
      } catch (error: unknown) {
        return errorMessage(error) || "Не удалось загрузить фото";
      }
    };

    setSubmitting(true);
    try {
      let photoError: string | null = null;
      if (isEditing && formState.id) {
        await updateRoom(formState.id, roomData);
        const keptExistingIds = new Set(
          formState.photos
            .filter((p): p is { type: "existing"; id: number; url: string } => p.type === "existing" && p.id >= 0)
            .map((p) => p.id)
        );
        const toDelete = [...originalExistingPhotoIds].filter((id) => !keptExistingIds.has(id));
        for (const photoId of toDelete) {
          await deleteMeetingRoomPhoto(formState.id, photoId);
        }
        photoError = await uploadNewPhotos(formState.id);
      } else {
        const newRoom = await addRoom(roomData);
        if (newRoom) photoError = await uploadNewPhotos(newRoom.id);
      }
      await fetchRooms();
      if (photoError) {
        toast({
          title: isEditing ? "Данные сохранены, фото не загрузились" : "Переговорная добавлена без фото",
          description: `${photoError.replace(/\.$/, "")}. Откройте переговорную и добавьте фото ещё раз.`,
          variant: "destructive",
        });
      } else {
        toast({ title: isEditing ? "Переговорная обновлена" : "Переговорная добавлена" });
      }
      handleOpenChange(false);
    } catch (error: unknown) {
      const msg = errorMessage(error) || (isEditing ? "Не удалось обновить переговорную" : "Не удалось добавить переговорную");
      toast({ title: "Ошибка", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const requestDeleteFromForm = () => {
    if (!formState.id) return;
    const roomToRemove =
      rooms.find((room) => room.id === formState.id) ||
      ({
        id: formState.id,
        name: formState.name,
        floor: Number(formState.floor) || 0,
        capacity: Number(formState.capacity) || 0,
        photos: formState.photos.map((p) => (p.type === "existing" ? p.url : p.preview)),
        status: formState.status,
        isActive: formState.isActive,
        description: formState.description,
      } as MeetingRoom);
    requestDeleteRoom(roomToRemove);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className={`flex flex-wrap items-center gap-2 ${isMobile ? "flex-col items-stretch" : ""}`}>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={`rounded-full px-4 py-1 text-sm ${useDarkStyles ? "border-white/20 text-white bg-[#2C2C2E]" : ""}`}>
              Всего: {filteredRooms.length}
            </Badge>
            <Badge variant="outline" className={`rounded-full px-4 py-1 text-sm ${useDarkStyles ? "border-white/20 text-white bg-[#2C2C2E]" : ""}`}>
              Активных: {filteredRooms.filter((room) => room.isActive).length}
            </Badge>
          </div>
          <Button
            className={`gap-2 ${isMobile ? "w-full" : ""} ${useDarkStyles ? "bg-[#E85D2B] hover:bg-[#E04A0A] text-white" : ""}`}
            onClick={handleAddRoomClick}
          >
            <Plus className="h-4 w-4" />
            Добавить комнату
          </Button>
        </div>
        <div className={`flex gap-2 w-full items-center ${isMobile ? "flex-col" : "flex-row flex-wrap"}`}>
          {offices.length > 0 && (
            <div className={isMobile ? "w-full" : "flex-1 min-w-[160px]"}>
              <Select
                value={selectedOfficeId === "all" ? "all" : selectedOfficeId.toString()}
                onValueChange={(value) => setSelectedOfficeId(value === "all" ? "all" : Number(value))}
              >
                <SelectTrigger className={`w-full ${useDarkStyles ? "bg-[#2C2C2E] border-white/10 text-white hover:bg-[#3A3A3C] [&>span]:text-white" : ""}`}>
                <SelectValue placeholder="Фильтр по офису" />
                </SelectTrigger>
                <SelectContent className={useDarkStyles ? "bg-[#2C2C2E] border-white/10" : ""}>
                  <SelectItem value="all" className={useDarkStyles ? "text-white focus:bg-white/10 focus:text-white" : ""}>Все офисы</SelectItem>
                  {offices.map((office) => (
                    <SelectItem key={office.id} value={office.id.toString()} className={useDarkStyles ? "text-white focus:bg-white/10 focus:text-white" : ""}>
                      {office.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className={isMobile ? "w-full" : "flex-1 min-w-[160px]"}>
            <Select
              value={roomTypeFilter}
              onValueChange={(value) =>
                setRoomTypeFilter(value as MeetingRoomType | "all")
              }
            >
              <SelectTrigger className={`w-full ${useDarkStyles ? "bg-[#2C2C2E] border-white/10 text-white hover:bg-[#3A3A3C] [&>span]:text-white" : ""}`}>
                <SelectValue placeholder="Тип комнаты" />
              </SelectTrigger>
              <SelectContent className={useDarkStyles ? "bg-[#2C2C2E] border-white/10" : ""}>
                <SelectItem value="all" className={useDarkStyles ? "text-white focus:bg-white/10 focus:text-white" : ""}>Все типы</SelectItem>
                <SelectItem value="meeting" className={useDarkStyles ? "text-white focus:bg-white/10 focus:text-white" : ""}>Переговорные</SelectItem>
                <SelectItem value="cabinet" className={useDarkStyles ? "text-white focus:bg-white/10 focus:text-white" : ""}>Кабинеты</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <MeetingRoomFormDialog
        open={open}
        onOpenChange={handleOpenChange}
        isEditing={isEditing}
        form={formState}
        onChange={updateForm}
        errors={touched ? errors : {}}
        offices={offices}
        officeLocked={officeLocked}
        submitting={submitting}
        onSubmit={handleSubmit}
        onDelete={isEditing ? requestDeleteFromForm : undefined}
        onAddPhotos={handlePhotoFiles}
        onRemovePhoto={handleRemovePhoto}
        dark={useDarkStyles}
      />

      <div className="space-y-4">
        {filteredRooms.length === 0 ? (
          <div className={`rounded-lg border border-dashed p-10 text-center ${useDarkStyles ? "border-white/20" : ""}`}>
            <h3 className={`text-lg font-semibold ${useDarkStyles ? "text-white" : ""}`}>Комнаты не найдены</h3>
            <p className={`mt-2 text-sm ${useDarkStyles ? "text-gray-400" : "text-muted-foreground"}`}>
              {selectedOfficeId === "all" 
                ? "Добавьте новую переговорную комнату."
                : "Для выбранного офиса комнаты не найдены."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredRooms.map((room) => (
              <MeetingRoomCard
                key={room.id}
                room={room}
                highlightInactive
                // Описание и действия видны сразу, без раскрытия карточки.
                isExpanded
                showOffice={true}
                darkTheme={useDarkStyles}
                footer={
                  <div className={`flex gap-2 ${isMobile ? "flex-col" : "flex-wrap items-center"}`}>
                    <Button size="sm" variant="outline" className={useDarkStyles ? "bg-transparent w-full sm:w-auto justify-center border-white/20 text-white hover:bg-white/10" : ""} onClick={() => handleEdit(room)}>
                      Редактировать
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={useDarkStyles ? "w-full sm:w-auto justify-center text-white hover:bg-white/10" : ""}
                      onClick={() =>
                        handleStatusChange(
                          room.id,
                          room.status === "available" ? "booked" : "available",
                        )
                      }
                    >
                      {room.status === "available" ? (isMobile ? "Забронировать" : "Отметить как забронированную") : "Освободить"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={useDarkStyles ? "w-full sm:w-auto justify-center text-white hover:bg-white/10" : ""}
                      onClick={() => handleToggleActive(room.id)}
                    >
                      {room.isActive ? (isMobile ? "На ремонт" : "Отправить на ремонт") : "Сделать активной"}
                    </Button>
                    <Button size="sm" variant="ghost" className={useDarkStyles ? "w-full sm:w-auto justify-center text-white hover:bg-white/10" : ""} onClick={() => handleDuplicate(room.id)}>
                      <Copy className="mr-1 h-4 w-4" />
                      Дублировать
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={`text-red-400 hover:bg-red-500/10 hover:text-red-300 ${isMobile ? "w-full justify-center" : "sm:ml-auto"}`}
                      onClick={() => requestDeleteRoom(room)}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Удалить
                    </Button>
                  </div>
                }
              />
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={handleDeleteDialogOpenChange}>
        <AlertDialogContent className={useDarkStyles ? "border-white/10 bg-[#1A1A1A] text-white" : ""}>
          <AlertDialogHeader>
            <AlertDialogTitle className={useDarkStyles ? "text-white" : ""}>Удаление переговорной</AlertDialogTitle>
            <AlertDialogDescription className={useDarkStyles ? "text-gray-400" : ""}>
              Вы уверены, что хотите удалить переговорную{" "}
              {pendingDeleteRoom ? `«${pendingDeleteRoom.name}»` : "эту комнату"}? Это
              действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={useDarkStyles ? "border-white/20 text-white hover:bg-white/10" : ""}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

