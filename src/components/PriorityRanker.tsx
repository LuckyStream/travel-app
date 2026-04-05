"use client";

import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { PriorityKey } from "@/lib/types";

const LABELS: Record<PriorityKey, string> = {
  sightseeing: "Sightseeing",
  food: "Food & dining",
  shopping: "Shopping",
  relaxation: "Relaxation",
};

function SortableRow({ id, label }: { id: PriorityKey; label: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex cursor-grab items-center gap-3 rounded-xl border border-surface-muted bg-surface px-3 py-2.5 active:cursor-grabbing ${
        isDragging ? "border-accent/50 shadow-lg ring-1 ring-accent/30" : ""
      }`}
      {...attributes}
      {...listeners}
    >
      <span className="text-ink-muted select-none">⋮⋮</span>
      <span className="text-sm font-medium text-ink">{label}</span>
    </div>
  );
}

type Props = {
  value: PriorityKey[];
  onChange: (order: PriorityKey[]) => void;
};

export function PriorityRanker({ value, onChange }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = value.indexOf(active.id as PriorityKey);
    const newIndex = value.indexOf(over.id as PriorityKey);
    if (oldIndex === -1 || newIndex === -1) return;
    onChange(arrayMove(value, oldIndex, newIndex));
  };

  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-muted">
        Drag to rank priorities (top = most important)
      </p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={value} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {value.map((id) => (
              <SortableRow key={id} id={id} label={LABELS[id]} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
