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

export function SortableQuestionRow({ question, index, active, onSelect }: Props) {
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
        "flex items-center gap-3 rounded-[16px] border px-3 py-3 transition-colors",
        active
          ? "border-primary-500 bg-primary-500/10"
          : "border-border-subtle bg-bg-input hover:border-border",
      )}
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        className="cursor-grab text-text-muted hover:text-text-primary active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-bg-elevated text-xs font-semibold text-text-secondary">
        {index + 1}
      </span>
      <button
        type="button"
        onClick={onSelect}
        className="flex-1 truncate text-left text-sm text-text-primary"
      >
        {question.text || <span className="italic text-text-muted">Untitled</span>}
      </button>
      <span className="text-text-muted">
        {question.image_url ? (
          <ImageIcon className="size-4" />
        ) : (
          <Type className="size-4" />
        )}
      </span>
    </div>
  );
}
