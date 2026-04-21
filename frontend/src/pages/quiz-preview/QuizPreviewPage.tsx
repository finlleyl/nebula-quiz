import { ArrowLeft, Check, Clock, Pencil } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useQuiz } from "@/features/quizzes/hooks";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

export default function QuizPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuiz(id);

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg-primary text-text-secondary">
        Loading quiz…
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg-primary text-accent-error">
        Failed to load quiz.
      </div>
    );
  }

  const { quiz, questions } = data;

  return (
    <div className="min-h-screen bg-bg-primary">
      <header className="sticky top-0 z-20 border-b border-border-subtle bg-bg-primary/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[960px] items-center gap-4 px-6 py-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-pill px-3 py-2 text-sm text-text-secondary hover:bg-bg-card hover:text-text-primary"
          >
            <ArrowLeft className="size-4" />
            Back
          </button>
          <div className="flex-1" />
          <Badge tone={quiz.is_published ? "success" : "amber"}>
            {quiz.is_published ? "Published" : "Draft"}
          </Badge>
          <Button variant="outline" size="md" className="gap-2" asChild>
            <Link to={`/quizzes/${quiz.id}/edit`}>
              <Pencil className="size-4" />
              Edit
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-[960px] px-6 py-10 space-y-8">
        <section className="overflow-hidden rounded-3xl border border-border-subtle bg-bg-card">
          {quiz.cover_url ? (
            <img
              src={quiz.cover_url}
              alt=""
              className="h-[320px] w-full object-cover"
            />
          ) : (
            <div className="h-[160px] w-full bg-gradient-to-br from-primary-500/30 to-accent-cyan/10" />
          )}
          <div className="p-8">
            <h1 className="font-display text-[40px] font-bold leading-tight text-text-primary">
              {quiz.title}
            </h1>
            {quiz.description ? (
              <p className="mt-3 text-lg text-text-secondary">
                {quiz.description}
              </p>
            ) : null}
            <div className="mt-6 flex items-center gap-6 text-sm text-text-muted">
              <span>{questions.length} Questions</span>
              <span>{quiz.plays_count} Plays</span>
            </div>
          </div>
        </section>

        {questions.length === 0 ? (
          <p className="py-20 text-center text-text-muted">No questions yet.</p>
        ) : (
          <ol className="space-y-4">
            {questions.map((q, i) => (
              <li
                key={q.id}
                className="rounded-3xl border border-border-subtle bg-bg-card p-6"
              >
                <div className="mb-4 flex items-center gap-3">
                  <Badge tone="primary">{i + 1}</Badge>
                  <Badge tone="neutral">
                    {q.question_type === "single" ? "Single" : "Multiple"}
                  </Badge>
                  <span className="ml-auto inline-flex items-center gap-1 text-sm text-text-muted">
                    <Clock className="size-4" />
                    {q.time_limit_seconds}s · {q.points} pts
                  </span>
                </div>
                <p className="mb-4 font-display text-xl font-semibold text-text-primary">
                  {q.text || (
                    <span className="italic text-text-muted">
                      (untitled question)
                    </span>
                  )}
                </p>
                {q.image_url ? (
                  <img
                    src={q.image_url}
                    alt=""
                    className="mb-4 max-h-[320px] w-full rounded-2xl object-cover"
                  />
                ) : null}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {q.options.map((o, idx) => (
                    <div
                      key={o.id ?? idx}
                      className={cn(
                        "flex items-center gap-3 rounded-pill border px-4 py-3",
                        o.is_correct
                          ? "border-primary-500 bg-primary-500/10"
                          : "border-border bg-bg-input",
                      )}
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-bg-elevated font-display text-sm font-bold text-text-primary">
                        {String.fromCharCode("A".charCodeAt(0) + idx)}
                      </span>
                      <span className="flex-1 text-text-primary">
                        {o.text || (
                          <span className="italic text-text-muted">
                            (empty)
                          </span>
                        )}
                      </span>
                      {o.is_correct ? (
                        <span className="grid size-7 place-items-center rounded-full bg-accent-amber text-bg-primary">
                          <Check className="size-4" />
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
