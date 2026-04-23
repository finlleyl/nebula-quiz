import { ChevronDown, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

import { useAnalyticsReport } from "@/features/analytics/hooks";
import type { RecentSession } from "@/features/analytics/api";
import { DashboardSidebar } from "@/pages/dashboard/DashboardSidebar";
import { Button } from "@/shared/ui/button";

function formatBigNumber(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10_000) return n.toLocaleString("ru-RU");
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

function statusLabel(s: RecentSession["status"]) {
  if (s === "finished") return { label: "Завершена", tone: "chip" };
  if (s === "in_progress")
    return { label: "В эфире", tone: "chip chip-danger" };
  return { label: "Лобби", tone: "chip chip-accent" };
}

const MONTHS = [
  "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
  "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек",
];

export default function AnalyticsPage() {
  const { data, isPending, isError } = useAnalyticsReport();

  const bars = [40, 56, 48, 72, 65, 80, 70, 88, 92, 78, 96, 85];

  return (
    <div className="flex min-h-screen bg-bg-page">
      <DashboardSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-16 items-center gap-4 border-b border-divider bg-bg-surface px-8">
          <div className="text-[15px] text-text-tertiary">Кабинет</div>
          <ChevronRight className="size-3.5 text-text-tertiary" />
          <div className="text-[15px] font-semibold">Аналитика</div>
          <div className="flex-1" />
          <Button variant="secondary">
            За 30 дней <ChevronDown className="size-3.5" />
          </Button>
        </div>

        <main className="flex-1 overflow-auto p-8">
          <h1 className="mb-1.5 font-display text-[28px] font-extrabold tracking-[-0.02em]">
            Аналитика
          </h1>
          <p className="mb-6 text-sm text-text-secondary">
            Как играют в ваши квизы — за последние 30 дней
          </p>

          {isPending ? (
            <p className="text-text-secondary">Загружаем аналитику…</p>
          ) : isError ? (
            <p className="text-danger">Не удалось загрузить аналитику.</p>
          ) : data ? (
            <>
              <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <KpiMini
                  label="Прохождений"
                  value={formatBigNumber(data.overview.total_sessions)}
                  delta="+18%"
                />
                <KpiMini
                  label="Уникальных игроков"
                  value={formatBigNumber(data.overview.total_players)}
                  delta="+12%"
                />
                <KpiMini
                  label="Средний балл"
                  value={formatBigNumber(Math.round(data.overview.avg_score))}
                  delta="+3%"
                />
                <KpiMini
                  label="Точность"
                  value={`${data.overview.avg_completion_rate}%`}
                  delta="+3%"
                />
              </section>

              <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
                <div className="card p-6">
                  <div className="mb-4 flex justify-between">
                    <h3 className="text-base font-bold">
                      Прохождения по месяцам
                    </h3>
                    <div className="flex gap-1.5">
                      <span className="chip chip-accent">Прохождения</span>
                      <span className="chip">Игроки</span>
                    </div>
                  </div>
                  <div className="flex h-[220px] items-end gap-2.5">
                    {bars.map((b, i) => (
                      <div
                        key={i}
                        className="flex flex-1 flex-col items-center gap-1.5"
                      >
                        <div
                          className="relative w-full rounded-t-[8px]"
                          style={{
                            height: `${b}%`,
                            background:
                              i === 10
                                ? "var(--accent)"
                                : "var(--accent-soft)",
                          }}
                        >
                          {i === 10 ? (
                            <div
                              className="absolute left-1/2 top-[-28px] -translate-x-1/2 whitespace-nowrap rounded-[6px] bg-text-primary px-2 py-[3px] font-mono text-[11px] font-bold text-white"
                            >
                              1 240
                            </div>
                          ) : null}
                        </div>
                        <div className="text-[11px] text-text-tertiary">
                          {MONTHS[i]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card p-6">
                  <h3 className="mb-3.5 text-base font-bold">Топ квизов</h3>
                  {data.top_quizzes.length === 0 ? (
                    <p className="text-sm text-text-secondary">
                      Проведите игру, чтобы собрать статистику.
                    </p>
                  ) : (
                    data.top_quizzes.map((q, i) => (
                      <Link
                        key={q.quiz_id}
                        to={`/quizzes/${q.quiz_id}`}
                        className={`flex items-center gap-2.5 py-2.5 ${i < data.top_quizzes.length - 1 ? "border-b border-divider" : ""}`}
                      >
                        <div className="w-[22px] font-display text-sm font-extrabold text-text-tertiary">
                          {i + 1}
                        </div>
                        <div className="flex-1 truncate text-sm font-semibold">
                          {q.title}
                        </div>
                        <div className="font-mono text-[13px] font-bold text-accent">
                          {formatBigNumber(q.players_count)}
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              <div className="card p-6">
                <h3 className="mb-3.5 text-base font-bold">
                  Последние сессии
                </h3>
                {data.recent_sessions.length === 0 ? (
                  <p className="text-sm text-text-secondary">
                    Сессий пока нет.
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {data.recent_sessions.map((s) => {
                      const status = statusLabel(s.status);
                      return (
                        <div
                          key={s.session_id}
                          className="flex items-center gap-4 rounded-md bg-bg-muted px-3.5 py-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">
                              {s.quiz_title}
                            </p>
                            <div className="mt-1 flex items-center gap-2 text-xs text-text-secondary">
                              <span className={status.tone}>{status.label}</span>
                              <span className="font-mono text-accent">
                                {s.room_code}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-display text-sm font-bold">
                              {s.players_count} игроков
                            </p>
                            {s.status === "finished" ? (
                              <p className="text-xs text-text-secondary">
                                ср. {Math.round(s.avg_score).toLocaleString("ru-RU")}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}

function KpiMini({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta?: string;
}) {
  return (
    <div className="card p-5">
      <div className="text-[13px] text-text-secondary">{label}</div>
      <div className="mt-1.5 font-display text-[32px] font-extrabold">
        {value}
      </div>
      {delta ? (
        <span className="chip chip-success mt-1.5">{delta}</span>
      ) : null}
    </div>
  );
}
