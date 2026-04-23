import { FolderKanban, Loader2, Pencil, Play, Users } from "lucide-react";
import { Link } from "react-router-dom";

import { useHostGame } from "@/features/live-game/hooks";

import type { QuizDTO } from "./types";

interface Props {
  quiz: QuizDTO;
  questionsCount?: number;
}

export function QuizCard({ quiz, questionsCount }: Props) {
  const hostGame = useHostGame();
  const canHost =
    quiz.is_published && (questionsCount === undefined || questionsCount > 0);

  return (
    <article className="card flex w-[280px] shrink-0 cursor-pointer flex-col overflow-hidden">
      <div className="placeholder-img relative aspect-[16/9] w-full">
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
          className={`chip absolute right-[10px] top-[10px] bg-bg-surface ${
            quiz.is_published ? "text-text-secondary" : "chip-warn"
          }`}
        >
          {quiz.is_published ? "Опубликован" : "Черновик"}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-[10px] p-[14px]">
        <div className="line-clamp-2 text-[15px] font-bold leading-[1.3] text-text-primary">
          {quiz.title}
        </div>
        <div className="flex items-center gap-3 text-xs text-text-secondary">
          <span className="flex items-center gap-1">
            <FolderKanban className="size-3.5" />
            {questionsCount ?? "—"} вопр.
          </span>
          <span className="flex items-center gap-1">
            <Users className="size-3.5" />
            {formatPlays(quiz.plays_count)}
          </span>
          <div className="flex-1" />
          {canHost ? (
            <button
              type="button"
              disabled={hostGame.isPending}
              aria-label={`Запустить «${quiz.title}»`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                hostGame.mutate(quiz.id);
              }}
              className="btn-icon size-7"
            >
              {hostGame.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Play className="size-3.5" />
              )}
            </button>
          ) : null}
          <Link
            to={`/quizzes/${quiz.id}/edit`}
            aria-label={`Редактировать «${quiz.title}»`}
            className="btn-icon size-7"
          >
            <Pencil className="size-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function formatPlays(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}
