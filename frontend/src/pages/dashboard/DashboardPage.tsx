import { Bell, ChevronRight, Plus, Search, Star, Upload } from "lucide-react";
import { Link } from "react-router-dom";

import { useAuthStore } from "@/features/auth/store";
import { DraftQuizCard } from "@/features/quizzes/DraftQuizCard";
import { QuizCard } from "@/features/quizzes/QuizCard";
import { useMyQuizzes } from "@/features/quizzes/hooks";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/button";

import { DashboardSidebar } from "./DashboardSidebar";
import { KPICard } from "./KPICard";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const displayName =
    user && "display_name" in user && user.display_name
      ? user.display_name
      : "Организатор";

  const { data, isLoading, error } = useMyQuizzes(12, 0);
  const quizzes = data?.items ?? [];
  const totalPlays = quizzes.reduce((acc, q) => acc + (q.plays_count ?? 0), 0);
  const liveQuizzes = quizzes.filter((q) => q.is_published).slice(0, 2);

  return (
    <div className="flex min-h-screen bg-bg-page">
      <DashboardSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-16 items-center gap-4 border-b border-divider bg-bg-surface px-8">
          <div className="text-[15px] text-text-tertiary">Кабинет ведущего</div>
          <ChevronRight className="size-3.5 text-text-tertiary" />
          <div className="text-[15px] font-semibold text-text-primary">Обзор</div>
          <div className="flex-1" />
          <div className="relative w-[280px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-text-tertiary" />
            <input
              className="input h-10 pl-10"
              placeholder="Поиск по квизам…"
            />
          </div>
          <button type="button" className="btn-icon" aria-label="Уведомления">
            <Bell className="size-5" />
          </button>
        </div>

        <main className="flex-1 overflow-auto p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="font-display text-[30px] font-extrabold tracking-[-0.02em] text-text-primary">
                Добро пожаловать, {displayName} 👋
              </h1>
              <p className="mt-1.5 text-[15px] text-text-secondary">
                Ваши квизы собрали{" "}
                <b className="text-text-primary">
                  {formatBigNumber(totalPlays)} игроков
                </b>
                {" "}— загляните в кабинет ведущего.
              </p>
            </div>
            <div className="flex gap-2.5">
              <Button variant="secondary">
                <Upload className="size-4" /> Импорт
              </Button>
              <Link to="/quizzes">
                <Button>
                  <Plus className="size-[18px]" /> Создать квиз
                </Button>
              </Link>
            </div>
          </div>

          <section className="mb-7 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard
              label="Всего игроков"
              value={formatBigNumber(totalPlays)}
              hint={<span className="chip chip-success">+14% за неделю</span>}
            />
            <KPICard
              label="Активные сессии"
              value={String(liveQuizzes.length)}
              hint={
                liveQuizzes.length ? (
                  <span className="chip chip-danger">
                    <span className="dot" /> Идут сейчас
                  </span>
                ) : (
                  <span className="chip">Нет активных</span>
                )
              }
            />
            <KPICard
              label="Средний % прохождения"
              value="87%"
              hint={<span className="chip chip-success">+3%</span>}
              progress={87}
            />
            <KPICard
              label="Оценка вопросов"
              value="4,8"
              hint={<span className="text-text-secondary">из 5</span>}
              chart={
                <div className="flex gap-0.5 text-gold">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="size-[14px] fill-current" />
                  ))}
                </div>
              }
            />
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
            <section>
              <div className="mb-3.5 flex items-center justify-between">
                <h2 className="font-display text-xl font-bold">Мои квизы</h2>
                <div className="flex items-center gap-2">
                  {["Все", "Опубликованные", "Черновики"].map((t, i) => (
                    <button
                      key={t}
                      className={
                        i === 0
                          ? "rounded-pill bg-accent-soft px-3 py-1.5 text-[13px] font-semibold text-accent"
                          : "rounded-pill px-3 py-1.5 text-[13px] font-semibold text-text-secondary hover:bg-bg-muted"
                      }
                    >
                      {t}
                    </button>
                  ))}
                  <Link
                    to="/quizzes"
                    className="ml-2 text-[13px] font-semibold text-accent hover:underline"
                  >
                    Все →
                  </Link>
                </div>
              </div>

              {isLoading ? (
                <p className="text-text-secondary">Загружаем квизы…</p>
              ) : error ? (
                <p className="text-danger">Не удалось загрузить квизы.</p>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {quizzes.map((q) => (
                    <QuizCard key={q.id} quiz={q} />
                  ))}
                  <DraftQuizCard />
                </div>
              )}
            </section>

            <aside className="flex flex-col gap-4">
              <div className="card p-[18px]">
                <div className="mb-3.5 flex items-center justify-between">
                  <h3 className="text-base font-bold">Сейчас в эфире</h3>
                  <span className="chip chip-danger">
                    <span className="dot" /> LIVE
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {liveQuizzes.length === 0 ? (
                    <p className="text-sm text-text-secondary">
                      Сейчас нет активных игр.
                    </p>
                  ) : (
                    liveQuizzes.map((q) => (
                      <div
                        key={q.id}
                        className="flex items-center gap-3 rounded-md bg-bg-muted p-3"
                      >
                        <div className="grid size-10 place-items-center rounded-sm bg-bg-surface font-mono text-xs font-bold text-accent">
                          QR
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold">
                            {q.title}
                          </div>
                          <div className="mt-0.5 font-mono text-xs text-text-secondary">
                            {q.plays_count} игроков
                          </div>
                        </div>
                        <Link to={`/quizzes/${q.id}`}>
                          <Button variant="secondary" size="sm">
                            Открыть
                          </Button>
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="card p-[18px]">
                <h3 className="mb-3.5 text-base font-bold">Последние события</h3>
                <div className="flex flex-col gap-3.5">
                  {[
                    {
                      n: "Анна К.",
                      t: "прошла «Космическую викторину» с результатом 2 140",
                      tm: "2 мин назад",
                    },
                    {
                      n: "Павел М.",
                      t: "подписался на ваш профиль",
                      tm: "10 мин назад",
                    },
                    {
                      n: "Алёна В.",
                      t: "сохранила квиз «История России» в Мои игры",
                      tm: "34 мин назад",
                    },
                    {
                      n: "Максим С.",
                      t: "оставил отзыв 5 ⭐ к «Поп-культуре»",
                      tm: "1 ч назад",
                    },
                  ].map((e, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <Avatar name={e.n} size={32} />
                      <div className="flex-1 text-[13px] leading-[1.4]">
                        <b>{e.n}</b>{" "}
                        <span className="text-text-secondary">{e.t}</span>
                        <div className="mt-0.5 text-xs text-text-tertiary">
                          {e.tm}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}

function formatBigNumber(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10000) return n.toLocaleString("ru-RU");
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}
