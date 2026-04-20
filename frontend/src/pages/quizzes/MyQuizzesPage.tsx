import { useMemo, useState } from "react";

import { DraftQuizCard } from "@/features/quizzes/DraftQuizCard";
import { QuizCard } from "@/features/quizzes/QuizCard";
import { useMyQuizzes } from "@/features/quizzes/hooks";
import { DashboardSidebar } from "@/pages/dashboard/DashboardSidebar";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";

type StatusFilter = "all" | "draft" | "published";
type SortBy = "recent" | "plays" | "title";

export default function MyQuizzesPage() {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortBy>("recent");
  const { data, isLoading, error } = useMyQuizzes(100, 0);

  const items = useMemo(() => {
    const src = data?.items ?? [];
    const filtered =
      status === "all"
        ? src
        : src.filter((q) =>
            status === "published" ? q.is_published : !q.is_published,
          );
    return [...filtered].sort((a, b) => {
      if (sort === "plays") return b.plays_count - a.plays_count;
      if (sort === "title") return a.title.localeCompare(b.title);
      return (
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    });
  }, [data?.items, status, sort]);

  return (
    <div className="flex min-h-screen bg-bg-primary">
      <DashboardSidebar />

      <main className="flex-1 px-10 py-10">
        <header className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="font-display text-[40px] font-bold leading-tight text-text-primary">
              My Quizzes
            </h1>
            <p className="mt-2 text-text-secondary">
              {data ? `${data.total} total` : "Loading…"}
            </p>
          </div>
        </header>

        <div className="mb-8 flex flex-wrap items-center gap-4">
          <SegmentedControl<StatusFilter>
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: "All" },
              { value: "draft", label: "Drafts" },
              { value: "published", label: "Published" },
            ]}
          />
          <SegmentedControl<SortBy>
            value={sort}
            onChange={setSort}
            options={[
              { value: "recent", label: "Recent" },
              { value: "plays", label: "Most played" },
              { value: "title", label: "Title A–Z" },
            ]}
          />
        </div>

        {isLoading ? (
          <p className="text-text-secondary">Loading quizzes…</p>
        ) : error ? (
          <p className="text-accent-error">Failed to load quizzes.</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
            {items.map((q) => (
              <QuizCard key={q.id} quiz={q} />
            ))}
            <DraftQuizCard />
          </div>
        )}
      </main>
    </div>
  );
}
