import { ChevronRight } from "lucide-react";
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
    <div className="flex min-h-screen bg-bg-page">
      <DashboardSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-16 items-center gap-4 border-b border-divider bg-bg-surface px-8">
          <div className="text-[15px] text-text-tertiary">Кабинет</div>
          <ChevronRight className="size-3.5 text-text-tertiary" />
          <div className="text-[15px] font-semibold">Мои квизы</div>
        </div>

        <main className="flex-1 overflow-auto p-8">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h1 className="font-display text-[28px] font-extrabold tracking-[-0.02em]">
                Мои квизы
              </h1>
              <p className="mt-1 text-sm text-text-secondary">
                {data ? `Всего: ${data.total}` : "Загружаем…"}
              </p>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-3">
            <SegmentedControl<StatusFilter>
              value={status}
              onChange={setStatus}
              options={[
                { value: "all", label: "Все" },
                { value: "draft", label: "Черновики" },
                { value: "published", label: "Опубликованные" },
              ]}
            />
            <SegmentedControl<SortBy>
              value={sort}
              onChange={setSort}
              options={[
                { value: "recent", label: "По дате" },
                { value: "plays", label: "По запускам" },
                { value: "title", label: "По названию" },
              ]}
            />
          </div>

          {isLoading ? (
            <p className="text-text-secondary">Загружаем…</p>
          ) : error ? (
            <p className="text-danger">Не удалось загрузить квизы.</p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
              {items.map((q) => (
                <QuizCard key={q.id} quiz={q} />
              ))}
              <DraftQuizCard />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
