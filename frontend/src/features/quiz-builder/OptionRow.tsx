import { Check, Trash2 } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import type { QuestionType } from "@/features/quizzes/types";

interface Props {
  letter: string;
  text: string;
  isCorrect: boolean;
  questionType: QuestionType;
  onTextChange: (text: string) => void;
  onToggleCorrect: () => void;
  onRemove?: () => void;
}

export function OptionRow({
  letter,
  text,
  isCorrect,
  onTextChange,
  onToggleCorrect,
  onRemove,
}: Props) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-md border p-[14px_16px] transition-colors",
        isCorrect
          ? "border-2 border-success bg-success-soft"
          : "border-border bg-bg-surface",
      )}
    >
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-md font-display text-sm font-extrabold",
          isCorrect ? "bg-success text-white" : "bg-bg-muted text-text-secondary",
        )}
      >
        {letter}
      </span>
      <input
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="Вариант ответа"
        className="flex-1 bg-transparent text-[15px] font-medium text-text-primary placeholder:text-text-placeholder focus:outline-none"
      />
      <button
        type="button"
        onClick={onToggleCorrect}
        aria-pressed={isCorrect}
        className={cn(
          "grid size-7 shrink-0 place-items-center rounded-full transition-colors",
          isCorrect
            ? "bg-success text-white"
            : "border-2 border-border-strong text-transparent",
        )}
      >
        <Check className="size-3.5" strokeWidth={3} />
      </button>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Удалить вариант"
          className="rounded-pill p-1 text-text-tertiary hover:bg-danger-soft hover:text-danger"
        >
          <Trash2 className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
