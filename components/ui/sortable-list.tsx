"use client";

import { createContext, useContext, useId, type CSSProperties, type ReactNode } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
  type Modifier,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

/** Items move only up and down the list. */
const verticalOnly: Modifier = ({ transform }) => ({ ...transform, x: 0 });
const MODIFIERS = [verticalOnly];

const INSTRUCTIONS = {
  draggable:
    "Чтобы переместить, нажмите пробел или Enter, выберите место стрелками вверх и вниз и снова нажмите пробел или Enter. Escape отменяет перемещение.",
};

type SortableListProps = {
  /** Keys of the items in their order, the `id` of each `SortableItem`. */
  ids: string[];
  /** The item `id` was dropped at the place of the item `overId`. */
  onMove: (id: string, overId: string) => void;
  /** The list itself (`ol`/`ul`) with a `SortableItem` per key. */
  children: ReactNode;
};

/**
 * A list put in order by dragging the handle «⋮⋮» of its items (Figma «Все 5 вопросов добавлены»,
 * «Вопрос 1 — один вариант»): with the mouse or a finger, or from the keyboard — the handle takes
 * the focus, Space or Enter picks the item up and puts it down, the arrows move it, Escape cancels.
 * A screen reader hears the place: «Место 3 из 5».
 */
export function SortableList({ ids, onMove, children }: SortableListProps) {
  // The id of the instructions for the handles: the same on the server and in the browser.
  const id = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    // The page follows the item at once: during a smooth scroll a quick second arrow press is lost.
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates, scrollBehavior: "instant" }),
  );
  const place = (item: UniqueIdentifier) => `${ids.indexOf(String(item)) + 1} из ${ids.length}`;
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Перемещение, место ${place(active.id)}`,
    onDragOver: ({ over }) => (over ? `Место ${place(over.id)}` : undefined),
    onDragEnd: ({ active, over }) =>
      over ? `Поставлено на место ${place(over.id)}` : `Перемещение отменено, место ${place(active.id)}`,
    onDragCancel: ({ active }) => `Перемещение отменено, место ${place(active.id)}`,
  };

  return (
    <DndContext
      id={id}
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={MODIFIERS}
      accessibility={{ announcements, screenReaderInstructions: INSTRUCTIONS }}
      onDragEnd={({ active, over }) => {
        if (over && active.id !== over.id) onMove(String(active.id), String(over.id));
      }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

type Handle = {
  /** Marks the handle as the element the drag starts from. */
  setActivator: (element: HTMLElement | null) => void;
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
  dragging: boolean;
};

const HandleContext = createContext<Handle | null>(null);

type SortableItemProps = {
  id: string;
  className?: string;
  /** The content with its `DragHandle`. */
  children: ReactNode;
};

/**
 * An item of a `SortableList`: an `li` that follows its handle. While dragged it goes above the
 * others and carries `data-dragging`: an item with a surface of its own (a card) lifts itself with
 * `data-[dragging]:shadow-…`; a row of fields moves without a shadow, it has nothing to cast it.
 */
export function SortableItem({ id, className, children }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: CSSProperties = { transform: CSS.Translate.toString(transform), transition };
  return (
    <HandleContext.Provider value={{ setActivator: setActivatorNodeRef, attributes, listeners, dragging: isDragging }}>
      <li ref={setNodeRef} style={style} data-dragging={isDragging || undefined} className={cn(className, isDragging && "relative z-10")}>
        {children}
      </li>
    </HandleContext.Provider>
  );
}

/** The handle «⋮⋮» of a `SortableItem`; `label` says what it moves: «Переместить вопрос 2». */
export function DragHandle({ label, className }: { label: string; className?: string }) {
  const handle = useContext(HandleContext);
  if (!handle) throw new Error("DragHandle is used outside of a SortableItem");
  const { setActivator, attributes, listeners, dragging } = handle;
  return (
    <button
      ref={setActivator}
      type="button"
      {...attributes}
      {...listeners}
      // A button by its own role: how to move it, the screen reader reads from the instructions.
      aria-roledescription={undefined}
      aria-label={label}
      className={cn(
        "flex shrink-0 cursor-grab touch-none items-center justify-center rounded-4pt-xs text-ui-fg/35 transition-colors hover:text-ui-fg/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70 [&_svg]:size-[18px]",
        dragging && "cursor-grabbing text-ui-fg/60",
        className,
      )}
    >
      <GripVertical aria-hidden />
    </button>
  );
}
