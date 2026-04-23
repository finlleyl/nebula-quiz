import { Image as ImageIcon, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { SaveIndicator } from "@/features/quiz-builder/SaveIndicator";
import { useDebouncedSave } from "@/features/quiz-builder/useDebouncedSave";
import { useImageUpload, useUpdateQuiz } from "@/features/quizzes/hooks";
import type { QuizDTO } from "@/features/quizzes/types";
import { Button } from "@/shared/ui/button";
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
  const [coverUrl, setCoverUrl] = useState<string | null>(
    quiz.cover_url ?? null,
  );
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    setDescription(quiz.description ?? "");
    setCoverUrl(quiz.cover_url ?? null);
  }, [quiz.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const status = useDebouncedSave({ description, coverUrl }, async (v) => {
    await updateQuiz.mutateAsync({
      description: v.description,
      cover_url: v.coverUrl ?? "",
    });
  });

  const onPickImage = () => fileInputRef.current?.click();
  const onImageFile = async (file: File | undefined) => {
    setImageError(null);
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setImageError("Только JPEG, PNG или WebP.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("Файл не должен превышать 5 МБ.");
      return;
    }
    try {
      const res = await imageUpload.mutateAsync(file);
      setCoverUrl(res.url);
    } catch {
      setImageError("Загрузка не удалась.");
    }
  };

  return (
    <div className="mx-auto max-w-[720px] space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">Настройки квиза</h2>
        <SaveIndicator status={status} />
      </div>

      <div className="card space-y-5 p-6">
        <p className="text-sm text-text-secondary">
          Название редактируется в шапке страницы.
        </p>

        <div>
          <label className="mb-2 block text-[13px] font-bold uppercase tracking-[0.06em] text-text-secondary">
            Описание
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="О чём этот квиз?"
            rows={4}
            maxLength={2000}
          />
        </div>

        <div>
          <label className="mb-2 block text-[13px] font-bold uppercase tracking-[0.06em] text-text-secondary">
            Обложка
          </label>
          {coverUrl ? (
            <div className="relative overflow-hidden rounded-md border border-border">
              <img
                src={coverUrl}
                alt=""
                className="max-h-[240px] w-full object-cover"
              />
              <button
                type="button"
                onClick={() => setCoverUrl(null)}
                aria-label="Удалить обложку"
                className="btn-icon absolute right-2 top-2 size-8 !bg-white/80"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <div className="placeholder-img h-[120px] rounded-md">
              Cover · 1600×900
            </div>
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={onPickImage}
            disabled={imageUpload.isPending}
            className="mt-2.5 w-full"
          >
            {imageUpload.isPending ? (
              <>
                <Upload className="size-4" /> Загрузка…
              </>
            ) : (
              <>
                <ImageIcon className="size-4" /> Загрузить (до 5 МБ)
              </>
            )}
          </Button>
          {imageError ? (
            <p className="mt-2 text-sm text-danger">{imageError}</p>
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
