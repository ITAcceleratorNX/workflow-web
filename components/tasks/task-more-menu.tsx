"use client";

import { BarChart3, MoreHorizontal, Users } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ListGroup, ListRow } from "@/components/ui/list-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type TaskMoreMenuProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenStats: () => void;
  onOpenTeams: () => void;
  variant: "sheet" | "popover";
};

/** «•••» of the tasks screen: the task statistics and the user's teams. */
export function TaskMoreMenu({ open, onOpenChange, onOpenStats, onOpenTeams, variant }: TaskMoreMenuProps) {
  const trigger = (
    <button
      type="button"
      aria-label="Ещё: статистика и команды"
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={variant === "sheet" ? () => onOpenChange(true) : undefined}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[10px] text-ui-accent transition-colors hover:bg-ui-fg/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70",
        variant === "sheet" ? "size-11" : "size-9 border border-ui-fg/10 bg-ui-surface text-ui-fg/80",
      )}
    >
      <MoreHorizontal className="size-6" aria-hidden />
    </button>
  );

  const rows = (tone: "raised" | "plain") => (
    <ListGroup tone={tone === "raised" ? "raised" : "surface"} className={tone === "plain" ? "bg-transparent" : undefined}>
      <ListRow icon={<BarChart3 />} label="Статистика" onClick={onOpenStats} />
      <ListRow icon={<Users />} label="Команды" onClick={onOpenTeams} />
    </ListGroup>
  );

  if (variant === "popover") {
    return (
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={8}
          className="w-[240px] rounded-[14px] border-ui-fg/[0.12] bg-ui-popover p-1 text-ui-fg shadow-[0_12px_30px_rgba(0,0,0,0.55)]"
        >
          {rows("plain")}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <>
      {trigger}
      <BottomSheet open={open} onOpenChange={onOpenChange} title="Ещё">
        {rows("raised")}
      </BottomSheet>
    </>
  );
}
