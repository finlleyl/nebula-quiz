import { ChevronRight, Clock, Play, Radio, Users } from "lucide-react";

import {
  useActiveSessions,
  useResumeSession,
} from "@/features/live-game/hooks";
import type { ActiveSession } from "@/features/live-game/api";
import { DashboardSidebar } from "@/pages/dashboard/DashboardSidebar";
import { Button } from "@/shared/ui/button";

function formatTime(iso: string) {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "только что";
  if (mins < 60) return `${mins} мин назад`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ч назад`;
  return d.toLocaleDateString("ru-RU", { month: "short", day: "numeric" });
}

function StatusBadge({ status }: { status: ActiveSession["status"] }) {
  const isLive = status === "in_progress";
  return (
    <span className={isLive ? "chip chip-danger" : "chip chip-accent"}>
      <span className="dot" /> {isLive ? "В эфире" : "Лобби"}
    </span>
  );
}

export default function LiveSessionsPage() {
  const { data: sessions, isPending, isError } = useActiveSessions();
  const resume = useResumeSession();

  return (
    <div className="flex min-h-screen bg-bg-page">
      <DashboardSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-16 items-center gap-4 border-b border-divider bg-bg-surface px-8">
          <div className="text-[15px] text-text-tertiary">Кабинет</div>
          <ChevronRight className="size-3.5 text-text-tertiary" />
          <div className="text-[15px] font-semibold">Идут сейчас</div>
        </div>

        <main className="flex-1 overflow-auto p-8">
          <h1 className="mb-1.5 font-display text-[28px] font-extrabold tracking-[-0.02em]">
            Активные сессии
          </h1>
          <p className="mb-6 text-sm text-text-secondary">
            Ваши открытые лобби и игры в эфире
          </p>

          {isPending ? (
            <p className="text-text-secondary">Загружаем сессии…</p>
          ) : null}
          {isError ? (
            <p className="text-danger">Не удалось загрузить.</p>
          ) : null}

          {!isPending && !isError && sessions?.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border-strong p-12 text-center text-text-secondary">
              <Radio className="size-10 opacity-40" />
              <p className="text-lg font-semibold">Активных сессий нет</p>
              <p className="text-sm">
                Запустите игру из любого квиза, чтобы открыть лобби.
              </p>
            </div>
          ) : null}

          {sessions && sessions.length > 0 ? (
            <div className="flex flex-col gap-3">
              {sessions.map((s) => {
                const isResuming =
                  resume.isPending && resume.variables === s.session_id;
                return (
                  <div
                    key={s.session_id}
                    className="card flex items-center gap-4 p-5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex items-center gap-3">
                        <p className="truncate font-display text-base font-bold">
                          {s.quiz_title}
                        </p>
                        <StatusBadge status={s.status} />
                      </div>
                      <div className="flex items-center gap-4 text-[13px] text-text-secondary">
                        <span className="font-mono text-sm tracking-wider text-accent">
                          {s.room_code}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="size-3" />
                          {s.participant_count} игроков
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3" />
                          {formatTime(s.started_at ?? s.created_at)}
                        </span>
                        {s.match_number != null ? (
                          <span className="text-text-tertiary">
                            №{s.match_number}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <Button
                      onClick={() => resume.mutate(s.session_id)}
                      disabled={isResuming}
                      className="shadow-accent"
                    >
                      <Play className="size-3.5" fill="currentColor" />
                      {isResuming ? "Подключаемся…" : "Продолжить"}
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : null}

          {resume.isError ? (
            <p className="mt-4 text-danger">
              Не удалось подключиться: {resume.error?.message}
            </p>
          ) : null}
        </main>
      </div>
    </div>
  );
}
