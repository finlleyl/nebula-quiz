import { Loader2, Pencil, Play } from "lucide-react";
import { Link } from "react-router-dom";

import { useHostGame } from "@/features/live-game/hooks";
import { Badge } from "@/shared/ui/Badge";

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
    <article className="group relative flex w-[280px] shrink-0 flex-col overflow-hidden rounded-3xl border border-border-subtle bg-bg-card">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-primary-500/30 to-accent-cyan/10">
        {quiz.cover_url ? (
          <img
            src={quiz.cover_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full place-items-center font-display text-4xl text-primary-400/40">
            {quiz.title.slice(0, 1).toUpperCase()}
          </div>
        )}
        <Badge
          tone={quiz.is_published ? "success" : "amber"}
          className="absolute right-3 top-3"
        >
          {quiz.is_published ? "Published" : "Draft"}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="line-clamp-2 font-display text-[18px] font-semibold leading-tight text-text-primary">
          {quiz.title}
        </h3>
        {quiz.description ? (
          <p className="line-clamp-2 text-sm text-text-secondary">
            {quiz.description}
          </p>
        ) : (
          <p className="text-sm italic text-text-muted">No description yet</p>
        )}

        <div className="mt-auto flex items-center justify-between pt-3 text-xs text-text-muted">
          <span>? {questionsCount ?? "—"} Qs</span>
          <span className="flex items-center gap-1">
            <Play className="size-3" />
            {formatPlays(quiz.plays_count)}
          </span>
          <div className="flex items-center gap-1">
            {canHost ? (
              <button
                type="button"
                disabled={hostGame.isPending}
                aria-label={`Host ${quiz.title}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  hostGame.mutate(quiz.id);
                }}
                className="rounded-pill bg-primary-500/15 p-2 text-primary-400 transition-colors hover:bg-primary-500/25 disabled:opacity-50"
              >
                {hostGame.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Play className="size-4" />
                )}
              </button>
            ) : null}
            <Link
              to={`/quizzes/${quiz.id}/edit`}
              aria-label={`Edit ${quiz.title}`}
              className="rounded-pill bg-bg-elevated p-2 text-text-secondary transition-colors hover:bg-primary-500/20 hover:text-primary-400"
            >
              <Pencil className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function formatPlays(n: number): string {
  if (n < 1000) return `${n} Plays`;
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}k Plays`;
  return `${(n / 1_000_000).toFixed(1)}M Plays`;
}
