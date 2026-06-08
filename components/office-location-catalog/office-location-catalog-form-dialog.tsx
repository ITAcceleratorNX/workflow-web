"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DESKTOP_MANAGEMENT_DIALOG_CONTENT_CLASS,
  MANAGEMENT_MODAL_DARK_CLASS,
} from "@/constants/management-modal-ui";
import { useIsDesktop } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

export type OfficeLocationCatalogFormValues = {
  block: string;
  floor_zone: string;
  room: string;
  sort_order: number;
};

type OfficeLocationCatalogFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  loading?: boolean;
  error?: string | null;
  defaultBlock?: string;
  defaultFloorZone?: string;
  defaultRoom?: string;
  defaultSortOrder?: number;
  onClose: () => void;
  onSubmit: (values: OfficeLocationCatalogFormValues) => Promise<void>;
};

export function OfficeLocationCatalogFormDialog({
  open,
  mode,
  loading = false,
  error,
  defaultBlock = "",
  defaultFloorZone = "",
  defaultRoom = "",
  defaultSortOrder = 0,
  onClose,
  onSubmit,
}: OfficeLocationCatalogFormDialogProps) {
  const isDesktop = useIsDesktop();
  const [block, setBlock] = useState("");
  const [floorZone, setFloorZone] = useState("");
  const [room, setRoom] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setBlock(defaultBlock);
    setFloorZone(defaultFloorZone);
    setRoom(defaultRoom);
    setSortOrder(String(defaultSortOrder ?? 0));
    setLocalError(null);
  }, [open, defaultBlock, defaultFloorZone, defaultRoom, defaultSortOrder]);

  const handleSave = async () => {
    setLocalError(null);
    const n = Number(sortOrder);
    if (Number.isNaN(n)) {
      setLocalError("Укажите число для порядка сортировки");
      return;
    }
    await onSubmit({
      block: block.trim(),
      floor_zone: floorZone.trim(),
      room: room.trim(),
      sort_order: n,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !loading && onClose()}>
      <DialogContent
        className={cn(
          "max-w-md",
          isDesktop && DESKTOP_MANAGEMENT_DIALOG_CONTENT_CLASS,
          isDesktop && MANAGEMENT_MODAL_DARK_CLASS,
          isDesktop && "p-6 gap-4",
        )}
      >
        <DialogHeader className={isDesktop ? "text-left space-y-1" : undefined}>
          <DialogTitle>{mode === "create" ? "Новый шаблон" : "Редактирование"}</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Блок, этаж и помещение — как в форме заявки клиента
        </p>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="loc-block">Блок</Label>
            <Input
              id="loc-block"
              placeholder="Например: А"
              value={block}
              onChange={(e) => setBlock(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="loc-floor">Этаж / зона</Label>
            <Input
              id="loc-floor"
              placeholder="Например: 2 этаж"
              value={floorZone}
              onChange={(e) => setFloorZone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="loc-room">Помещение</Label>
            <Input
              id="loc-room"
              placeholder="Название помещения"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="loc-sort">Порядок сортировки</Label>
            <Input
              id="loc-sort"
              placeholder="0"
              inputMode="numeric"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </div>

          {error || localError ? (
            <p className="text-sm text-destructive">{error || localError}</p>
          ) : null}

          <div className="flex gap-3 pt-2">
            <Button className="flex-1" onClick={() => void handleSave()} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Сохранение...
                </>
              ) : (
                "Сохранить"
              )}
            </Button>
            <Button className="flex-1" variant="outline" onClick={onClose} disabled={loading}>
              Отмена
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
