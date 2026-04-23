import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookMarked, ChevronRight, Play, Trash2 } from "lucide-react";

import { libraryApi } from "@/features/quizzes/api";
import { useHostGame } from "@/features/live-game/hooks";
import { DashboardSidebar } from "@/pages/dashboard/DashboardSidebar";
import { Button } from "@/shared/ui/button";
import type { QuizDTO } from "@/features/quizzes/types";

function useLibrary() {
  return useQuery({
    queryKey: ["library"],
    queryFn: () => libraryApi.list().then((r) => r.quizzes),
  });
}

function useRemoveFromLibrary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (quizId: string) => libraryApi.remove(quizId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["library"] }),
  });
}

function LibraryQuizCard({ quiz }: { quiz: QuizDTO }) {
  const hostGame = useHostGame();
  const remove = useRemoveFromLibrary();

  return (
    <article className="card flex flex-col overflow-hidden">
      <div className="placeholder-img relative aspect-[16/9]">
        {quiz.cover_url ? (
          <img
            src={quiz.cover_url}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <span>{quiz.title.slice(0, 14)}</span>
        )}
        <span
          className={`chip absolute right-[10px] top-[10px] bg-bg-surface ${quiz.is_published ? "text-text-secondary" : "chip-warn"}`}
        >
          {quiz.is_published ? "Опубликован" : "Черновик"}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-[15px] font-bold leading-[1.3]">
          {quiz.title}
        </h3>
        {quiz.description ? (
          <p className="line-clamp-2 text-xs text-text-secondary">
            {quiz.description}
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-xs text-text-secondary">
            {quiz.plays_count.toLocaleString("ru-RU")} запусков
          </span>
          <div className="flex items-center gap-1.5">
            {quiz.is_published ? (
              <Button
                variant="secondary"
                size="sm"
                disabled={hostGame.isPending}
                onClick={() => hostGame.mutate(quiz.id)}
              >
                <Play className="size-3" /> Запустить
              </Button>
            ) : null}
            <button
              type="button"
              aria-label="Убрать из библиотеки"
              disabled={remove.isPending}
              onClick={() => remove.mutate(quiz.id)}
              className="btn-icon size-8 !bg-danger-soft !text-danger"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function LibraryPage() {
  const { data: quizzes, isPending, isError } = useLibrary();

  return (
    <div className="flex min-h-screen bg-bg-page">
      <DashboardSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-16 items-center gap-4 border-b border-divider bg-bg-surface px-8">
          <div className="text-[15px] text-text-tertiary">Игрок</div>
          <ChevronRight className="size-3.5 text-text-tertiary" />
          <div className="text-[15px] font-semibold">Моя библиотека</div>
        </div>

        <main className="flex-1 overflow-auto p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-md bg-accent-softer text-accent">
              <BookMarked className="size-5" />
            </div>
            <div>
              <h1 className="font-display text-[28px] font-extrabold tracking-[-0.02em]">
                Моя библиотека
              </h1>
              <p className="mt-1 text-sm text-text-secondary">
                Сохранённые квизы для быстрого доступа
              </p>
            </div>
          </div>

          {isPending ? (
            <div className="flex justify-center py-20">
              <div className="size-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            </div>
          ) : null}

          {isError ? (
            <div className="rounded-md bg-danger-soft px-6 py-4 text-sm text-danger">
              Не удалось загрузить библиотеку.
            </div>
          ) : null}

          {!isPending && !isError && quizzes && quizzes.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border-strong py-20 text-center text-text-secondary">
              <BookMarked className="size-10 opacity-40" />
              <p className="text-lg font-semibold">Библиотека пуста</p>
              <p className="max-w-xs text-sm">
                Загляните в{" "}
                <a href="/explore" className="font-semibold text-accent hover:underline">
                  Каталог
                </a>{" "}
                и сохраняйте квизы — они появятся здесь.
              </p>
            </div>
          ) : null}

          {!isPending && quizzes && quizzes.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {quizzes.map((quiz) => (
                <LibraryQuizCard key={quiz.id} quiz={quiz} />
              ))}
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
