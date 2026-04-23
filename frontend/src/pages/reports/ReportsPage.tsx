import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Clock, Trophy, Users } from "lucide-react";

import { api } from "@/shared/lib/http";
import { DashboardSidebar } from "@/pages/dashboard/DashboardSidebar";

interface HistoryEntry {
  session_id: string;
  room_code: string;
  match_number: number | null;
  status: string;
  finished_at: string | null;
  quiz_title: string;
  total_score: number;
  rank: number;
  total_participants: number;
}

function useHistory() {
  return useQuery<HistoryEntry[]>({
    queryKey: ["me", "history"],
    queryFn: () => api.get("me/history").json<HistoryEntry[]>(),
  });
}

function rankLabel(rank: number, total: number) {
  if (rank === 1) return "🥇 1 место";
  if (rank === 2) return "🥈 2 место";
  if (rank === 3) return "🥉 3 место";
  return `${rank} из ${total}`;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ReportsPage() {
  const { data: entries, isPending, isError } = useHistory();

  return (
    <div className="flex min-h-screen bg-bg-page">
      <DashboardSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-16 items-center gap-4 border-b border-divider bg-bg-surface px-8">
          <div className="text-[15px] text-text-tertiary">Игрок</div>
          <ChevronRight className="size-3.5 text-text-tertiary" />
          <div className="text-[15px] font-semibold">История</div>
        </div>

        <main className="flex-1 overflow-auto p-8">
          <h1 className="mb-1.5 font-display text-[28px] font-extrabold tracking-[-0.02em]">
            История матчей
          </h1>
          <p className="mb-6 text-sm text-text-secondary">
            Последние сыгранные сессии
          </p>

          {isPending ? (
            <p className="text-text-secondary">Загружаем историю…</p>
          ) : null}

          {isError ? (
            <p className="text-danger">Не удалось загрузить историю.</p>
          ) : null}

          {!isPending && !isError && entries?.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border-strong p-12 text-center text-text-secondary">
              <Trophy className="size-10 opacity-40" />
              <p className="text-lg font-semibold">Матчей пока нет</p>
              <p className="text-sm">
                Сыграйте в квиз, и он появится здесь.
              </p>
            </div>
          ) : null}

          {entries && entries.length > 0 ? (
            <div className="flex flex-col gap-3">
              {entries.map((e) => (
                <div
                  key={e.session_id}
                  className="card flex items-center gap-4 p-5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-base font-bold">
                      {e.quiz_title}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-[13px] text-text-secondary">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3" />
                        {formatDate(e.finished_at)}
                      </span>
                      <span className="font-mono text-xs text-text-tertiary tracking-wider">
                        {e.room_code}
                      </span>
                      {e.match_number != null ? (
                        <span className="text-xs text-text-tertiary">
                          №{e.match_number}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="min-w-[110px] text-center">
                    <p
                      className={`font-display text-lg font-bold ${e.rank === 1 ? "text-gold" : e.rank <= 3 ? "text-accent" : ""}`}
                    >
                      {rankLabel(e.rank, e.total_participants)}
                    </p>
                    <p className="mt-0.5 inline-flex items-center justify-center gap-1 text-xs text-text-secondary">
                      <Users className="size-3" />
                      {e.total_participants} игроков
                    </p>
                  </div>

                  <div className="min-w-[110px] text-right">
                    <p className="font-mono text-[22px] font-extrabold text-accent">
                      {e.total_score.toLocaleString("ru-RU")}
                    </p>
                    <p className="text-xs text-text-secondary">очков</p>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
