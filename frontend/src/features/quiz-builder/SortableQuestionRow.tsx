import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Image as ImageIcon, Type } from "lucide-react";

import type { QuestionDTO } from "@/features/quizzes/types";
import { cn } from "@/shared/lib/utils";

interface Props {
  question: QuestionDTO;
  index: number;
  active: boolean;
  onSelect: () => void;
}

export function SortableQuestionRow({
  question,
  index,
  active,
  onSelect,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: question.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className={cn(
        "flex items-center gap-2.5 rounded-sm p-2.5 transition-colors",
        active
          ? "bg-accent-softer ring-1 ring-accent/20"
          : "hover:bg-bg-muted",
      )}
    >
      <button
        type="button"
        aria-label="Перетащить"
        className="cursor-grab text-text-tertiary active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <span
        className={cn(
          "grid size-6 shrink-0 place-items-center rounded-xs font-mono text-xs font-bold",
          active ? "bg-accent text-white" : "bg-bg-muted text-text-secondary",
        )}
      >
        {index + 1}
      </span>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "flex-1 truncate text-left text-[13px]",
          active ? "font-semibold" : "font-medium text-text-secondary",
        )}
      >
        {question.text || (
          <span className="italic text-text-tertiary">Без текста</span>
        )}
      </button>
      <span className="text-text-tertiary">
        {question.image_url ? (
          <ImageIcon className="size-3.5" />
        ) : (
          <Type className="size-3.5" />
        )}
      </span>
    </div>
  );
}
