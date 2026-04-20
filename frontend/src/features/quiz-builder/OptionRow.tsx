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
        "flex items-center gap-3 rounded-pill border px-4 py-3 transition-colors",
        isCorrect
          ? "border-primary-500 bg-primary-500/10"
          : "border-border bg-bg-input",
      )}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-bg-elevated font-display text-sm font-bold text-text-primary">
        {letter}
      </span>
      <input
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="Option text"
        className="flex-1 bg-transparent text-base text-text-primary placeholder:text-text-placeholder focus:outline-none"
      />
      <button
        type="button"
        onClick={onToggleCorrect}
        aria-pressed={isCorrect}
        className={cn(
          "grid size-7 shrink-0 place-items-center rounded-full border-2 transition-colors",
          isCorrect
            ? "border-accent-amber bg-accent-amber text-bg-primary"
            : "border-border text-transparent hover:border-primary-400",
        )}
      >
        <Check className="size-4" />
      </button>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove option"
          className="rounded-pill p-1 text-text-muted hover:bg-accent-error/15 hover:text-accent-error"
        >
          <Trash2 className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
