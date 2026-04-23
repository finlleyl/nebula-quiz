import { Bookmark, Filter, Search, Star, Users } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { TopNav } from "@/shared/layout/TopNav";
import { Button } from "@/shared/ui/button";
import { api } from "@/shared/lib/http";
import { cn } from "@/shared/lib/utils";
import type { QuizDTO } from "@/features/quizzes/types";

interface ExploreResponse {
  quizzes: QuizDTO[];
  page: number;
}

function fetchExplore(q: string, page: number): Promise<ExploreResponse> {
  const params = new URLSearchParams({ page: String(page) });
  if (q) params.set("q", q);
  return api.get(`explore?${params}`).json<ExploreResponse>();
}

const CATS = [
  "Все",
  "Наука",
  "История",
  "Поп-культура",
  "Спорт",
  "География",
  "Кино",
  "Музыка",
  "Для школы",
];

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [cat, setCat] = useState(0);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["explore", query, page],
    queryFn: () => fetchExplore(query, page),
  });

  return (
    <div className="min-h-screen bg-bg-page">
      <TopNav />

      <main className="mx-auto max-w-[1360px] px-10 py-8">
        <section
          className="mb-6 flex items-center gap-6 overflow-hidden rounded-lg bg-gradient-hero p-8 text-white"
          style={{ borderRadius: 20 }}
        >
          <div className="flex-1">
            <span className="chip mb-2.5 bg-white/20 text-white">
              Подборка недели
            </span>
            <h1 className="font-display text-[32px] font-extrabold tracking-[-0.02em]">
              Играйте с друзьями онлайн
            </h1>
            <p className="mt-2 max-w-[520px] text-[15px] opacity-90">
              Более 12 000 квизов по любой теме. Присоединяйтесь по коду или
              создавайте свои за 5 минут.
            </p>
            <div className="mt-4 flex gap-2.5">
              <Button className="!bg-white !text-accent">Начать играть</Button>
              <Button className="!bg-white/15 !text-white hover:!bg-white/25">
                Смотреть трейлер
              </Button>
            </div>
          </div>
          <div className="grid h-[180px] w-[280px] place-items-center rounded-lg bg-white/20 font-mono text-sm font-bold backdrop-blur-sm">
            [ ключевой визуал ]
          </div>
        </section>

        <div className="mb-6 flex items-center gap-3">
          <div className="relative w-[360px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-text-tertiary" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Поиск квизов…"
              className="input h-10 pl-10"
            />
          </div>
          <div className="flex flex-1 gap-2 overflow-auto">
            {CATS.map((c, i) => (
              <button
                key={c}
                onClick={() => setCat(i)}
                className={cn(
                  "whitespace-nowrap rounded-pill px-4 py-2.5 text-sm font-semibold",
                  i === cat
                    ? "bg-accent text-white shadow-accent"
                    : "bg-bg-surface text-text-primary shadow-card",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3.5 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Популярные квизы</h2>
          <Button variant="secondary" size="sm">
            <Filter className="size-3.5" /> Фильтры
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="size-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : isError ? (
          <p className="py-20 text-center text-danger">
            Не удалось загрузить квизы.
          </p>
        ) : data && data.quizzes.length === 0 ? (
          <p className="py-20 text-center text-text-secondary">
            Квизов не найдено{query ? ` по «${query}»` : ""}.
          </p>
        ) : data ? (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {data.quizzes.map((q) => (
                <ExploreCard key={q.id} quiz={q} />
              ))}
            </div>
            <div className="mt-10 flex items-center justify-center gap-3">
              <Button
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Назад
              </Button>
              <span className="text-sm text-text-secondary">
                Страница {page}
              </span>
              <Button
                variant="secondary"
                disabled={data.quizzes.length < 20}
                onClick={() => setPage((p) => p + 1)}
              >
                Дальше →
              </Button>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}

function ExploreCard({ quiz }: { quiz: QuizDTO }) {
  return (
    <Link to={`/join?quiz=${quiz.id}`} className="card overflow-hidden">
      <div className="placeholder-img relative h-[140px]">
        {quiz.cover_url ? (
          <img src={quiz.cover_url} alt="" className="size-full object-cover" />
        ) : (
          <span>{quiz.title.slice(0, 14)}</span>
        )}
        <span className="chip absolute left-[10px] top-[10px] bg-bg-surface text-text-primary">
          Наука
        </span>
        <button
          type="button"
          className="btn-icon absolute right-[10px] top-[10px] size-8 !bg-white/90"
          aria-label="В избранное"
          onClick={(e) => e.preventDefault()}
        >
          <Bookmark className="size-4" />
        </button>
      </div>
      <div className="p-[14px]">
        <div className="mb-1.5 line-clamp-2 text-[15px] font-bold leading-[1.3]">
          {quiz.title}
        </div>
        <div className="mb-2.5 text-xs text-text-secondary">
          {quiz.description ?? "Без описания"}
        </div>
        <div className="flex items-center gap-2.5 text-xs text-text-secondary">
          <span className="flex items-center gap-1">
            <Star
              className="size-3"
              style={{ stroke: "var(--gold)", fill: "var(--gold)" }}
            />
            4.8
          </span>
          <span className="flex items-center gap-1">
            <Users className="size-3" />
            {quiz.plays_count.toLocaleString("ru-RU")}
          </span>
          <div className="flex-1" />
          <span className="font-bold text-accent">—</span>
        </div>
      </div>
    </Link>
  );
}
