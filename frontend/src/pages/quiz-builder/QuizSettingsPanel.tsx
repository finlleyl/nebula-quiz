import { Image as ImageIcon, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { SaveIndicator } from "@/features/quiz-builder/SaveIndicator";
import { useDebouncedSave } from "@/features/quiz-builder/useDebouncedSave";
import { useImageUpload, useUpdateQuiz } from "@/features/quizzes/hooks";
import type { QuizDTO } from "@/features/quizzes/types";
import { Textarea } from "@/shared/ui/Textarea";

interface Props {
  quiz: QuizDTO;
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function QuizSettingsPanel({ quiz }: Props) {
  const updateQuiz = useUpdateQuiz(quiz.id);
  const imageUpload = useImageUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [description, setDescription] = useState(quiz.description ?? "");
  const [coverUrl, setCoverUrl] = useState<string | null>(quiz.cover_url ?? null);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    setDescription(quiz.description ?? "");
    setCoverUrl(quiz.cover_url ?? null);
  }, [quiz.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const status = useDebouncedSave(
    { description, coverUrl },
    async (v) => {
      // Empty string signals clear on the backend (nullable-clearing
      // convention in service.UpdateQuiz).
      await updateQuiz.mutateAsync({
        description: v.description,
        cover_url: v.coverUrl ?? "",
      });
    },
  );

  const onPickImage = () => fileInputRef.current?.click();
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
      setCoverUrl(res.url);
    } catch {
      setImageError("Upload failed. Try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-text-primary">
          Quiz Settings
        </h2>
        <SaveIndicator status={status} />
      </div>

      <div className="space-y-5 rounded-3xl border border-border-subtle bg-bg-card p-6">
        <p className="text-sm text-text-muted">
          Title is edited inline in the header above.
        </p>

        <div>
          <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-text-muted">
            Description
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this quiz about?"
            rows={4}
            maxLength={2000}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-text-muted">
            Cover image
          </label>
          {coverUrl ? (
            <div className="relative overflow-hidden rounded-[16px] border border-border-subtle">
              <img
                src={coverUrl}
                alt=""
                className="max-h-[240px] w-full object-cover"
              />
              <button
                type="button"
                onClick={() => setCoverUrl(null)}
                aria-label="Remove cover"
                className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-bg-primary/80 text-text-primary hover:bg-accent-error"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onPickImage}
              disabled={imageUpload.isPending}
              className="flex w-full items-center justify-center gap-3 rounded-[16px] border-2 border-dashed border-border bg-bg-input px-6 py-10 text-text-secondary transition-colors hover:border-primary-500 hover:text-primary-400 disabled:opacity-50"
            >
              <ImageIcon className="size-5" />
              {imageUpload.isPending ? "Uploading…" : "Upload cover (5 MB max)"}
            </button>
          )}
          {imageError ? (
            <p className="mt-2 text-sm text-accent-error">{imageError}</p>
          ) : null}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => onImageFile(e.target.files?.[0] ?? undefined)}
          />
        </div>
      </div>
    </div>
  );
}
