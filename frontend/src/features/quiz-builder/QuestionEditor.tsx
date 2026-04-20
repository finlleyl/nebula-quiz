import { Image as ImageIcon, Plus, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useImageUpload } from "@/features/quizzes/hooks";
import type {
  AnswerOptionDTO,
  QuestionDTO,
  QuestionType,
} from "@/features/quizzes/types";
import { Badge } from "@/shared/ui/Badge";
import { Textarea } from "@/shared/ui/Textarea";

import { OptionRow } from "./OptionRow";
import { QuestionSettings } from "./QuestionSettings";
import { SaveIndicator } from "./SaveIndicator";
import { useDebouncedSave } from "./useDebouncedSave";

interface Props {
  orderIdx: number;
  question: QuestionDTO;
  onSave: (patch: {
    text: string;
    image_url: string | null;
    question_type: QuestionType;
    time_limit_seconds: number;
    points: number;
    options: { text: string; is_correct: boolean }[];
  }) => Promise<unknown>;
  onDelete: () => void;
}

const letterFor = (i: number) => String.fromCharCode("A".charCodeAt(0) + i);

export function QuestionEditor({ orderIdx, question, onSave, onDelete }: Props) {
  const [text, setText] = useState(question.text);
  const [imageUrl, setImageUrl] = useState<string | null>(
    question.image_url ?? null,
  );
  const [questionType, setQuestionType] = useState<QuestionType>(
    question.question_type,
  );
  const [timeLimit, setTimeLimit] = useState(question.time_limit_seconds);
  const [points, setPoints] = useState(question.points);
  const [options, setOptions] = useState<AnswerOptionDTO[]>(question.options);

  // Re-sync local state when switching between questions.
  useEffect(() => {
    setText(question.text);
    setImageUrl(question.image_url ?? null);
    setQuestionType(question.question_type);
    setTimeLimit(question.time_limit_seconds);
    setPoints(question.points);
    setOptions(question.options);
  }, [question.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Coerce single-choice to exactly one correct option.
  // If none is currently correct, default to the first.
  useEffect(() => {
    if (questionType !== "single") return;
    if (options.length === 0) return;
    const correctCount = options.filter((o) => o.is_correct).length;
    if (correctCount === 1) return;
    const keep = options.findIndex((o) => o.is_correct);
    const idxToKeep = keep < 0 ? 0 : keep;
    setOptions((prev) =>
      prev.map((o, i) => ({ ...o, is_correct: i === idxToKeep })),
    );
  }, [questionType, options]);

  const status = useDebouncedSave(
    { text, imageUrl, questionType, timeLimit, points, options },
    async (v) => {
      await onSave({
        text: v.text,
        image_url: v.imageUrl,
        question_type: v.questionType,
        time_limit_seconds: v.timeLimit,
        points: v.points,
        options: v.options.map((o) => ({
          text: o.text,
          is_correct: o.is_correct,
        })),
      });
    },
  );

  const imageUpload = useImageUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const onPickImage = () => fileInputRef.current?.click();
  const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
  const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

  const onImageFile = async (file: File | undefined) => {
    setImageError(null);
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setImageError("Only JPEG, PNG or WebP.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("Image must be under 5 MB.");
      return;
    }
    try {
      const res = await imageUpload.mutateAsync(file);
      setImageUrl(res.url);
    } catch {
      setImageError("Upload failed. Try again.");
    }
  };

  const setOptionText = (i: number, value: string) =>
    setOptions((prev) =>
      prev.map((o, idx) => (idx === i ? { ...o, text: value } : o)),
    );
  const toggleCorrect = (i: number) =>
    setOptions((prev) => {
      if (questionType === "single") {
        return prev.map((o, idx) => ({ ...o, is_correct: idx === i }));
      }
      return prev.map((o, idx) =>
        idx === i ? { ...o, is_correct: !o.is_correct } : o,
      );
    });
  const removeOption = (i: number) =>
    setOptions((prev) => prev.filter((_, idx) => idx !== i));
  const addOption = () =>
    setOptions((prev) => [...prev, { text: "", is_correct: false }]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge tone="primary">{orderIdx + 1}</Badge>
          <h2 className="font-display text-xl font-bold text-text-primary">
            Question Editor
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <SaveIndicator status={status} />
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete question"
            className="rounded-pill p-2 text-text-muted transition-colors hover:bg-accent-error/15 hover:text-accent-error"
          >
            <Trash2 className="size-5" />
          </button>
        </div>
      </div>

      <div className="relative rounded-[24px] border border-border-subtle bg-bg-card p-6">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your question here..."
          rows={4}
          className="border-transparent bg-transparent text-lg focus-visible:ring-0"
        />

        {imageUrl ? (
          <div className="relative mt-4 overflow-hidden rounded-[16px] border border-border-subtle">
            <img
              src={imageUrl}
              alt=""
              className="max-h-[280px] w-full object-cover"
            />
            <button
              type="button"
              onClick={() => setImageUrl(null)}
              aria-label="Remove image"
              className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-bg-primary/80 text-text-primary hover:bg-accent-error"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-end gap-3">
          {imageError ? (
            <span className="text-sm text-accent-error">{imageError}</span>
          ) : null}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => onImageFile(e.target.files?.[0] ?? undefined)}
          />
          <button
            type="button"
            onClick={onPickImage}
            disabled={imageUpload.isPending}
            aria-label="Attach image"
            className="rounded-pill p-2 text-text-muted transition-colors hover:bg-primary-500/15 hover:text-primary-400 disabled:opacity-50"
          >
            <ImageIcon className="size-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {options.map((opt, i) => (
          <OptionRow
            key={opt.id ?? i}
            letter={letterFor(i)}
            text={opt.text}
            isCorrect={opt.is_correct}
            questionType={questionType}
            onTextChange={(v) => setOptionText(i, v)}
            onToggleCorrect={() => toggleCorrect(i)}
            onRemove={options.length > 2 ? () => removeOption(i) : undefined}
          />
        ))}
        {options.length < 10 ? (
          <button
            type="button"
            onClick={addOption}
            className="flex items-center justify-center gap-2 rounded-pill border-2 border-dashed border-border px-4 py-3 text-text-secondary hover:border-primary-500 hover:text-primary-400"
          >
            <Plus className="size-4" />
            Add Option
          </button>
        ) : null}
      </div>

      <QuestionSettings
        timeLimit={timeLimit}
        questionType={questionType}
        points={points}
        onTimeLimit={setTimeLimit}
        onQuestionType={setQuestionType}
        onPoints={setPoints}
      />
    </div>
  );
}
