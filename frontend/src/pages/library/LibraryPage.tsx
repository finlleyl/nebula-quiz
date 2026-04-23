import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookMarked, Play, Trash2 } from "lucide-react";

import { libraryApi } from "@/features/quizzes/api";
import { useHostGame } from "@/features/live-game/hooks";
import { Badge } from "@/shared/ui/Badge";
import { DashboardSidebar } from "@/pages/dashboard/DashboardSidebar";
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
    <article
      className="flex flex-col overflow-hidden rounded-2xl border"
      style={{ background: "#111128", borderColor: "rgba(255,255,255,0.06)" }}
    >
      {/* Cover */}
      <div
        className="relative aspect-[16/9] w-full overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, rgba(124,77,255,0.25) 0%, rgba(141,205,255,0.10) 100%)",
        }}
      >
        {quiz.cover_url ? (
          <img
            src={quiz.cover_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="grid h-full place-items-center font-display text-5xl font-bold"
            style={{ color: "rgba(124,77,255,0.4)" }}
          >
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

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3
          className="line-clamp-2 font-display text-[16px] font-semibold leading-tight"
          style={{ color: "#E5E3FF" }}
        >
          {quiz.title}
        </h3>
        {quiz.description && (
          <p
            className="line-clamp-2 text-sm"
            style={{ color: "#A8A7D5" }}
          >
            {quiz.description}
          </p>
        )}

        {/* Footer actions */}
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-xs" style={{ color: "#8B8FB8" }}>
            {quiz.plays_count.toLocaleString()} plays
          </span>

          <div className="flex items-center gap-2">
            {quiz.is_published && (
              <button
                type="button"
                aria-label={`Host ${quiz.title}`}
                disabled={hostGame.isPending}
                onClick={() => hostGame.mutate(quiz.id)}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
                style={{
                  background: "rgba(124,77,255,0.15)",
                  color: "#A68CFF",
                }}
              >
                <Play className="size-3" />
                Host
              </button>
            )}
            <button
              type="button"
              aria-label={`Remove ${quiz.title} from library`}
              disabled={remove.isPending}
              onClick={() => remove.mutate(quiz.id)}
              className="rounded-full p-1.5 transition-colors disabled:opacity-50"
              style={{
                color: "#EF4444",
                background: "rgba(239,68,68,0.10)",
              }}
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
    <div
      className="flex min-h-screen"
      style={{ background: "#0C0C1F", color: "#E5E3FF" }}
    >
      <DashboardSidebar />

      <main className="flex-1 overflow-auto p-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ background: "rgba(124,77,255,0.15)" }}
          >
            <BookMarked className="size-5" style={{ color: "#A68CFF" }} />
          </div>
          <div>
            <h1
              className="font-display font-bold"
              style={{ fontSize: 32, color: "#E5E3FF", letterSpacing: "-0.5px" }}
            >
              My Library
            </h1>
            <p style={{ color: "#A8A7D5", fontSize: 14, marginTop: 2 }}>
              Quizzes you&apos;ve saved for quick access
            </p>
          </div>
        </div>

        {/* States */}
        {isPending && (
          <div className="flex justify-center py-20">
            <div
              className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent"
              style={{ color: "#7C4DFF" }}
            />
          </div>
        )}

        {isError && (
          <div
            className="rounded-xl border px-6 py-4 text-sm"
            style={{
              background: "rgba(239,68,68,0.08)",
              borderColor: "rgba(239,68,68,0.20)",
              color: "#EF4444",
            }}
          >
            Failed to load library. Please try again.
          </div>
        )}

        {!isPending && !isError && quizzes && quizzes.length === 0 && (
          <div
            className="flex flex-col items-center gap-4 rounded-2xl border border-dashed py-20 text-center"
            style={{
              borderColor: "rgba(255,255,255,0.10)",
              color: "#8B8FB8",
            }}
          >
            <BookMarked className="size-10 opacity-40" />
            <p className="text-lg font-semibold" style={{ color: "#A8A7D5" }}>
              Your library is empty
            </p>
            <p className="max-w-xs text-sm">
              Browse the{" "}
              <a href="/explore" style={{ color: "#A68CFF" }}>
                Explore
              </a>{" "}
              page and save quizzes to find them here later.
            </p>
          </div>
        )}

        {!isPending && quizzes && quizzes.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {quizzes.map((quiz) => (
              <LibraryQuizCard key={quiz.id} quiz={quiz} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
