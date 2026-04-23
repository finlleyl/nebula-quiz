import { ArrowLeft, Check, Clock, Loader2, Pencil, Play } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useHostGame } from "@/features/live-game/hooks";
import { useQuiz } from "@/features/quizzes/hooks";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

const LETTERS = ["A", "Б", "В", "Г", "Д", "Е", "Ж", "З"];

export default function QuizPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuiz(id);
  const hostGame = useHostGame();

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg-page text-text-secondary">
        Загружаем квиз…
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg-page text-danger">
        Не удалось загрузить квиз.
      </div>
    );
  }

  const { quiz, questions } = data;
  const canHost = quiz.is_published && questions.length > 0;

  return (
    <div className="min-h-screen bg-bg-page">
      <header className="sticky top-0 z-20 border-b border-divider bg-bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-[960px] items-center gap-3 px-6 py-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-icon"
            aria-label="Назад"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="flex-1" />
          <span
            className={
              quiz.is_published ? "chip chip-success" : "chip chip-warn"
            }
          >
            {quiz.is_published ? "Опубликован" : "Черновик"}
          </span>
          <Button variant="secondary" asChild>
            <Link to={`/quizzes/${quiz.id}/edit`}>
              <Pencil className="size-4" /> Редактировать
            </Link>
          </Button>
          <Button
            disabled={!canHost || hostGame.isPending}
            title={
              !quiz.is_published
                ? "Опубликуйте квиз, чтобы запустить"
                : questions.length === 0
                  ? "Добавьте хотя бы один вопрос"
                  : undefined
            }
            onClick={() => hostGame.mutate(quiz.id)}
            className="shadow-accent"
          >
            {hostGame.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Play className="size-4" />
            )}
            Запустить игру
          </Button>
        </div>
        {hostGame.isError ? (
          <div className="mx-auto max-w-[960px] px-6 pb-3 text-sm text-danger">
            Не удалось запустить игру.
          </div>
        ) : null}
      </header>

      <main className="mx-auto max-w-[960px] space-y-6 px-6 py-10">
        <section className="card overflow-hidden">
          {quiz.cover_url ? (
            <img
              src={quiz.cover_url}
              alt=""
              className="h-[320px] w-full object-cover"
            />
          ) : (
            <div className="placeholder-img h-[160px]">
              {quiz.title.slice(0, 14)}
            </div>
          )}
          <div className="p-8">
            <h1 className="font-display text-[40px] font-extrabold leading-tight tracking-[-0.02em]">
              {quiz.title}
            </h1>
            {quiz.description ? (
              <p className="mt-3 text-lg text-text-secondary">
                {quiz.description}
              </p>
            ) : null}
            <div className="mt-6 flex items-center gap-6 text-sm text-text-secondary">
              <span>{questions.length} вопросов</span>
              <span>{quiz.plays_count.toLocaleString("ru-RU")} запусков</span>
            </div>
          </div>
        </section>

        {questions.length === 0 ? (
          <p className="py-20 text-center text-text-secondary">
            Вопросов пока нет.
          </p>
        ) : (
          <ol className="space-y-4">
            {questions.map((q, i) => (
              <li key={q.id} className="card p-6">
                <div className="mb-4 flex items-center gap-3">
                  <span className="chip chip-accent">Вопрос {i + 1}</span>
                  <span className="chip">
                    {q.question_type === "single"
                      ? "Один ответ"
                      : "Несколько"}
                  </span>
                  <span className="ml-auto inline-flex items-center gap-1 text-sm text-text-secondary">
                    <Clock className="size-4" />
                    {q.time_limit_seconds}с · {q.points} баллов
                  </span>
                </div>
                <p className="mb-4 font-display text-xl font-bold">
                  {q.text || (
                    <span className="italic text-text-tertiary">
                      (без текста)
                    </span>
                  )}
                </p>
                {q.image_url ? (
                  <img
                    src={q.image_url}
                    alt=""
                    className="mb-4 max-h-[320px] w-full rounded-md object-cover"
                  />
                ) : null}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {q.options.map((o, idx) => (
                    <div
                      key={o.id ?? idx}
                      className={cn(
                        "flex items-center gap-3 rounded-md border p-[14px_16px]",
                        o.is_correct
                          ? "border-2 border-success bg-success-soft"
                          : "border-border bg-bg-surface",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-8 place-items-center rounded-md font-display text-sm font-extrabold",
                          o.is_correct
                            ? "bg-success text-white"
                            : "bg-bg-muted text-text-secondary",
                        )}
                      >
                        {LETTERS[idx] ?? idx + 1}
                      </span>
                      <span className="flex-1 text-[15px] font-medium">
                        {o.text || (
                          <span className="italic text-text-tertiary">
                            (пусто)
                          </span>
                        )}
                      </span>
                      {o.is_correct ? (
                        <span className="grid size-7 place-items-center rounded-full bg-success text-white">
                          <Check className="size-3.5" strokeWidth={3} />
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        )}
      </main>
    </div>
  );
}
