import { useState, useEffect, useMemo, ChangeEvent } from "react";
import {
  MeetingRoom,
  MeetingRoomStatus,
  MeetingRoomType,
  useMeetingRoomsStore,
} from "@/stores/meetingRoomsStore";
import { MeetingRoomCard } from "@/components/meeting-rooms/MeetingRoomCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileImage,
  Plus,
  Save,
  Trash2,
  Copy,
  X,
} from "lucide-react";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getOffices, Office } from "@/lib/api";

interface RoomFormState {
  id?: number;
  name: string;
  floor: number | "";
  capacity: number | "";
  room_type: MeetingRoomType;
  status: MeetingRoomStatus;
  isActive: boolean;
  photos: string[];
  description: string;
}

const EMPTY_FORM: RoomFormState = {
  name: "",
  floor: "",
  capacity: "",
  room_type: "meeting",
  status: "available",
  isActive: true,
  photos: [],
  description: "",
};

const toFormState = (room: MeetingRoom): RoomFormState => ({
  id: room.id,
  name: room.name,
  floor: room.floor,
  capacity: room.capacity,
  room_type: room.room_type,
  status: room.status,
  isActive: room.isActive,
  photos: [...(room.photos ?? [])],
  description: room.description ?? "",
});

const floorsRange = Array.from({ length: 10 }, (_, index) => index + 1);
const capacities = [2, 4, 6, 8, 10, 12];
const MAX_PHOTOS = 3;
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
  const loading = useMeetingRoomsStore((state) => state.loading);
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
  const [expandedRooms, setExpandedRooms] = useState<Set<number>>(new Set());
  const [errors, setErrors] = useState<{ name?: string; floor?: string; capacity?: string; photos?: string }>({});
  const [touched, setTouched] = useState(false);
  const [offices, setOffices] = useState<Office[]>([]);
  const [selectedOfficeId, setSelectedOfficeId] = useState<number | "all">("all");
  const [roomTypeFilter, setRoomTypeFilter] = useState<MeetingRoomType | "all">("all");

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
    setFormState(EMPTY_FORM);
    setIsEditing(false);
    setErrors({});
    setTouched(false);
  };

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const handlePhotoFiles = async (files: FileList | null) => {
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

    try {
      const dataUrls = await Promise.all(
        allowedFiles.map((file) => readFileAsDataUrl(file)),
      );
      setFormState((prev) => ({
        ...prev,
        photos: [...prev.photos, ...dataUrls],
      }));
      setErrors((e) => ({ ...e, photos: undefined }));
    } catch (error) {
      console.error(error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось прочитать выбранные файлы.",
        variant: "destructive",
      });
    }
  };

  const handlePhotoInputChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    await handlePhotoFiles(event.target.files);
    event.target.value = "";
  };

  const handleRemovePhoto = (index: number) => {
    setFormState((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, photoIndex) => photoIndex !== index),
    }));
    setErrors((e) => ({ ...e, photos: undefined }));
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      resetForm();
    }
  };

  const handleAddRoomClick = () => {
    resetForm();
    setOpen(true);
  };

  const handleCancel = () => {
    handleOpenChange(false);
  };

  const handleEdit = (room: MeetingRoom) => {
    setIsEditing(true);
    setFormState(toFormState(room));
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

  const toggleRoomExpand = (roomId: number) => {
    setExpandedRooms((prev) => {
      const next = new Set(prev);
      if (next.has(roomId)) {
        next.delete(roomId);
      } else {
        next.add(roomId);
      }
      return next;
    });
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

    const payload = {
      name: formState.name.trim(),
      floor: Number(formState.floor),
      capacity: Number(formState.capacity),
      room_type: formState.room_type,
      status: formState.status,
      isActive: formState.isActive,
      photos: formState.photos,
      description: formState.description.trim(),
    } satisfies Omit<MeetingRoom, "id">;

    try {
      if (isEditing && formState.id) {
        await updateRoom(formState.id, payload);
        toast({ title: "Переговорная обновлена" });
      } else {
        await addRoom(payload);
        toast({ title: "Переговорная добавлена" });
      }
      handleOpenChange(false);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: isEditing ? "Не удалось обновить переговорную" : "Не удалось добавить переговорную",
        variant: "destructive",
      });
    }
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

      {/* Форма создания/редактирования комнаты в модальном окне */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className={`w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none ${
            useDarkStyles ? "bg-[#1A1A1A] text-white" : ""
          }`}
        >
          <Card className={useDarkStyles ? "border-white/10 bg-transparent" : ""}>
            <CardHeader className={useDarkStyles ? "border-b border-white/10" : ""}>
              <CardTitle className={useDarkStyles ? "text-white" : ""}>
                {isEditing ? "Редактирование переговорной" : "Новая переговорная"}
              </CardTitle>
            </CardHeader>
            <CardContent className={useDarkStyles ? "text-white" : ""}>
              <div className="grid gap-6 sm:grid-cols-[2fr_1fr]">
                <ScrollArea className="h-[60vh] pr-4">
                  <div className="space-y-4 px-2">
                    <div className="space-y-2">
                      <Label htmlFor="meeting-room-name" className={useDarkStyles ? "text-gray-300" : ""}>
                        Название
                      </Label>
                      <Input
                        id="meeting-room-name"
                        placeholder="Переговорная Астана"
                        value={formState.name}
                        onChange={(event) =>
                          setFormState((prev) => ({ ...prev, name: event.target.value }))
                        }
                        className={useDarkStyles ? "bg-[#2C2C2E] border-white/10 text-white placeholder:text-gray-500" : ""}
                      />
                      {touched && errors.name ? (
                        <p className="text-xs text-red-500">{errors.name}</p>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="meeting-room-floor" className={useDarkStyles ? "text-gray-300" : ""}>
                          Этаж
                        </Label>
                        <Select
                          value={formState.floor === "" ? undefined : String(formState.floor)}
                          onValueChange={(value) =>
                            setFormState((prev) => ({ ...prev, floor: Number(value) }))
                          }
                        >
                          <SelectTrigger
                            id="meeting-room-floor"
                            className={
                              useDarkStyles
                                ? "bg-[#2C2C2E] border-white/10 text-white [&>span]:text-white"
                                : ""
                            }
                          >
                            <SelectValue placeholder="Выберите этаж" />
                          </SelectTrigger>
                          <SelectContent
                            className={useDarkStyles ? "bg-[#2C2C2E] border-white/10" : ""}
                          >
                            {floorsRange.map((floor) => (
                              <SelectItem
                                key={floor}
                                value={String(floor)}
                                className={
                                  useDarkStyles
                                    ? "text-white focus:bg.white/10 focus:text-white"
                                    : ""
                                }
                              >
                                {floor}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {touched && errors.floor ? (
                          <p className="text-xs text-red-500">{errors.floor}</p>
                        ) : null}
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="meeting-room-capacity"
                          className={useDarkStyles ? "text-gray-300" : ""}
                        >
                          Вместимость
                        </Label>
                        <Input
                          id="meeting-room-capacity"
                          type="number"
                          min={1}
                          value={formState.capacity}
                          onChange={(event) =>
                            setFormState((prev) => ({
                              ...prev,
                              capacity:
                                event.target.value === "" ? "" : Number(event.target.value),
                            }))
                          }
                          className={
                            useDarkStyles
                              ? "bg-[#2C2C2E] border-white/10 text-white placeholder:text-gray-500"
                              : ""
                          }
                        />
                        {touched && errors.capacity ? (
                          <p className="text-xs text-red-500">{errors.capacity}</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className={useDarkStyles ? "text-gray-300" : ""}>Тип комнаты</Label>
                      <div
                        className={`flex gap-3 ${
                          isMobile ? "flex-col" : "flex-wrap items-center"
                        }`}
                      >
                        <Button
                          type="button"
                          variant={formState.room_type === "meeting" ? "default" : "outline"}
                          className={`bg-transparent ${
                            isMobile ? "w-full justify-center" : ""
                          } ${
                            useDarkStyles
                              ? formState.room_type === "meeting"
                                ? "bg-[#E85D2B] hover:bg-[#E04A0A] text-white"
                                : "border-white/20 text-white hover:bg-white/10"
                              : ""
                          }`}
                          onClick={() =>
                            setFormState((prev) => ({ ...prev, room_type: "meeting" }))
                          }
                        >
                          Переговорная
                        </Button>
                        <Button
                          type="button"
                          variant={formState.room_type === "cabinet" ? "default" : "outline"}
                          className={`bg-transparent rounded-full ${
                            isMobile ? "w-full justify-center" : ""
                          } ${
                            useDarkStyles
                              ? formState.room_type === "cabinet"
                                ? "bg-[#E85D2B] hover:bg-[#E04A0A] text-white"
                                : "border-white/20 text-white hover:bg-white/10"
                              : ""
                          }`}
                          onClick={() =>
                            setFormState((prev) => ({ ...prev, room_type: "cabinet" }))
                          }
                        >
                          Кабинет (без бронирования)
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className={useDarkStyles ? "text-gray-300" : ""}>Статус</Label>
                      <div
                        className={`flex gap-3 ${
                          isMobile ? "flex-col" : "flex-wrap items-center"
                        }`}
                      >
                        <Button
                          type="button"
                          variant={formState.status === "available" ? "default" : "outline"}
                          className={`rounded-full ${
                            isMobile ? "w-full justify-center" : ""
                          } ${
                            useDarkStyles
                              ? formState.status === "available"
                                ? "bg-[#E85D2B] hover:bg-[#E04A0A] text-white"
                                : "border-white/20 text-white hover:bg-white/10"
                              : ""
                          }`}
                          onClick={() =>
                            setFormState((prev) => ({ ...prev, status: "available" }))
                          }
                        >
                          Доступна
                        </Button>
                        <Button
                          type="button"
                          variant={formState.status === "booked" ? "default" : "outline"}
                          className={`bg-transparent rounded-full ${
                            isMobile ? "w-full justify-center" : ""
                          } ${
                            useDarkStyles
                              ? formState.status === "booked"
                                ? "bg-[#E85D2B] hover:bg-[#E04A0A] text-white"
                                : "border-white/20 text-white hover:bg-white/10"
                              : ""
                          }`}
                          onClick={() =>
                            setFormState((prev) => ({ ...prev, status: "booked" }))
                          }
                        >
                          Забронирована
                        </Button>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
                <div className="flex flex-col gap-4 px-2">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label
                        htmlFor="meeting-room-photos"
                        className={useDarkStyles ? "text-gray-300" : ""}
                      >
                        Фотографии (до 3 шт.)
                      </Label>
                      <Input
                        id="meeting-room-photos"
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        multiple
                        onChange={handlePhotoInputChange}
                        className={
                          useDarkStyles
                            ? "bg-[#2C2C2E] border-white/10 text-white file:text-white"
                            : ""
                        }
                      />
                      <p
                        className={`text-xs ${
                          useDarkStyles ? "text-gray-400" : "text-muted-foreground"
                        }`}
                      >
                        Поддерживаются форматы JPG и PNG. Максимум {MAX_PHOTOS} фото, размер
                        каждого ≤ 2MB.
                      </p>
                      {touched && errors.photos ? (
                        <p className="text-xs text-red-500">{errors.photos}</p>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {formState.photos.length ? (
                        formState.photos.map((photo, index) => (
                          <div
                            key={`${photo}-${index}`}
                            className={`relative aspect-square overflow-hidden rounded-lg border ${
                              useDarkStyles ? "border-white/10 bg-[#2C2C2E]" : "bg-muted"
                            }`}
                          >
                            <Image
                              src={photo}
                              alt={`${formState.name || "Фото переговорной"} ${index + 1}`}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 50vw, 160px"
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="destructive"
                              className="absolute top-2 right-2 h-8 w-8 rounded-full"
                              onClick={() => handleRemovePhoto(index)}
                              aria-label="Удалить фото"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div
                          className={`col-span-2 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-8 text-sm ${
                            useDarkStyles
                              ? "border-white/20 bg-[#2C2C2E]/50 text-gray-400"
                              : "bg-muted/40 text-muted-foreground"
                          }`}
                        >
                          <FileImage className="h-8 w-8" />
                          <span>Фотографии пока не выбраны</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="meeting-room-description"
                      className={useDarkStyles ? "text-gray-300" : ""}
                    >
                      Описание
                    </Label>
                    <Textarea
                      id="meeting-room-description"
                      placeholder="Дополнительная информация о комнате"
                      value={formState.description}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, description: event.target.value }))
                      }
                      rows={5}
                      className={
                        useDarkStyles
                          ? "bg-[#2C2C2E] border-white/10 text-white placeholder:text-gray-500"
                          : ""
                      }
                    />
                  </div>

                  <div
                    className={`flex items-center justify-between rounded-md border p-3 ${
                      useDarkStyles ? "border-white/10" : ""
                    }`}
                  >
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          useDarkStyles ? "text-white" : ""
                        }`}
                      >
                        Комната активна
                      </p>
                      <p
                        className={`text-xs ${
                          useDarkStyles ? "text-gray-400" : "text-muted-foreground"
                        }`}
                      >
                        Используется в каталоге для клиентов
                      </p>
                    </div>
                    <Switch
                      checked={formState.isActive}
                      onCheckedChange={(checked) =>
                        setFormState((prev) => ({ ...prev, isActive: Boolean(checked) }))
                      }
                    />
                  </div>
                </div>
              </div>
              <div
                className={`flex flex-wrap items-center gap-2 pt-4 border-t ${
                  useDarkStyles ? "border-white/10" : ""
                } ${isMobile ? "flex-col" : ""}`}
              >
                {isEditing ? (
                  <Button
                    type="button"
                    variant="destructive"
                    className={isMobile ? "w-full" : ""}
                    onClick={() => {
                      if (formState.id) {
                        const roomToRemove =
                          rooms.find((room) => room.id === formState.id) ||
                          ({
                            id: formState.id,
                            name: formState.name,
                            floor: Number(formState.floor) || 0,
                            capacity: Number(formState.capacity) || 0,
                            photos: formState.photos,
                            status: formState.status,
                            isActive: formState.isActive,
                            description: formState.description,
                          } as MeetingRoom);
                        requestDeleteRoom(roomToRemove);
                      }
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Удалить
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className={`${isMobile ? "w-full" : ""} ${
                    useDarkStyles
                      ? "bg-transparent border-white/20 text-white hover:bg-white/10"
                      : ""
                  }`}
                >
                  Отмена
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  className={`gap-2 ${isMobile ? "w-full" : ""} ${
                    useDarkStyles ? "bg-[#E85D2B] hover:bg-[#E04A0A] text-white" : ""
                  }`}
                  disabled={loading}
                >
                  <Save className="h-4 w-4" />
                  Сохранить
                </Button>
              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>

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
                isExpanded={expandedRooms.has(room.id)}
                onToggleExpand={() => toggleRoomExpand(room.id)}
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
                      variant="destructive"
                      className={isMobile ? "w-full justify-center" : useDarkStyles ? "border-red-500/50 text-red-400 hover:bg-red-500/20" : ""}
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

