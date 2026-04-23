import { Copy, Filter, MessageSquare, QrCode, Settings, Users, X } from "lucide-react";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { PlayerSlots } from "@/features/live-game/components/PlayerSlots";
import { RoomCodeDisplay } from "@/features/live-game/components/RoomCodeDisplay";
import { useLiveGame } from "@/features/live-game/store";
import { Button } from "@/shared/ui/button";
import { Logo } from "@/shared/ui/Logo";

export default function HostLobbyPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { roomState, connectAsHost, startGame } = useLiveGame();

  useEffect(() => {
    const ticket = sessionStorage.getItem("host_ticket");
    if (!ticket || !code) {
      navigate("/dashboard", { replace: true });
      return;
    }
    const wsBase =
      import.meta.env.VITE_WS_BASE ??
      (window.location.protocol === "https:" ? "wss://" : "ws://") +
        window.location.host;
    const url = `${wsBase}/ws?ticket=${encodeURIComponent(ticket)}`;
    connectAsHost(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const participants = roomState?.participants ?? [];
  const isInProgress = roomState?.status === "in_progress";

  function handleStart() {
    startGame();
    navigate(`/host/${code}/question`);
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg-page">
      <header className="flex h-16 items-center gap-4 border-b border-divider bg-bg-surface px-8">
        <Logo />
        <div className="ml-5 flex items-center gap-2.5">
          <span className="chip chip-danger">
            <span className="dot" /> ЛОББИ ОТКРЫТО
          </span>
          <span className="text-[13px] text-text-secondary">
            {roomState?.quiz?.title ?? "Живая игра"}
            {roomState?.quiz?.total_questions
              ? ` · ${roomState.quiz.total_questions} вопросов`
              : ""}
          </span>
        </div>
        <div className="flex-1" />
        <Button variant="secondary">
          <Settings className="size-4" /> Настройки
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate("/dashboard")}
        >
          <X className="size-4" /> Завершить
        </Button>
      </header>

      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-2">
        <section className="relative flex flex-col justify-center overflow-hidden border-r border-divider bg-gradient-lobby p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-16 size-[320px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(0,119,255,0.15), transparent 70%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-10 -left-10 size-[260px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(75,179,75,0.12), transparent 70%)",
            }}
          />

          <div className="relative">
            {code ? <RoomCodeDisplay code={code} /> : null}

            <div className="mt-6 flex items-center gap-2.5">
              <Button
                variant="secondary"
                onClick={() => code && navigator.clipboard.writeText(code)}
              >
                <Copy className="size-4" /> Копировать
              </Button>
              <Button variant="secondary">
                <QrCode className="size-4" /> QR-код
              </Button>
              <Button variant="secondary">
                <MessageSquare className="size-4" /> Отправить
              </Button>
            </div>

            <div className="mt-8 flex w-fit items-center gap-5 rounded-lg bg-bg-surface p-4 shadow-card">
              <div
                className="grid size-[120px] grid-cols-10 gap-0.5 rounded-xs border border-border bg-white p-2"
              >
                {Array.from({ length: 100 }).map((_, i) => {
                  const on = [
                    0, 1, 2, 3, 7, 8, 9, 10, 12, 14, 16, 20, 22, 24, 26, 28,
                    30, 33, 35, 38, 40, 42, 45, 48, 50, 52, 55, 57, 60, 62,
                    65, 70, 72, 74, 78, 80, 82, 85, 90, 91, 92, 93, 97, 98,
                    99,
                  ].includes(i);
                  return (
                    <div
                      key={i}
                      style={{
                        aspectRatio: 1,
                        background: on ? "#0D1A2B" : "transparent",
                      }}
                    />
                  );
                })}
              </div>
              <div>
                <div className="mb-1 text-sm font-bold">Наведите камеру</div>
                <div className="max-w-[180px] text-xs leading-snug text-text-secondary">
                  Откроется прямая ссылка в игру — ник можно будет выбрать в
                  один клик.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-5 overflow-hidden p-10">
          <div className="flex items-center gap-3">
            <Users className="size-[22px] text-text-primary" />
            <h2 className="font-display text-[22px] font-extrabold tracking-[-0.01em]">
              Игроки
            </h2>
            <span className="chip chip-accent px-2.5 py-1">
              {participants.length} в лобби
            </span>
            <div className="flex-1" />
            <Button variant="secondary" size="sm">
              <Filter className="size-3.5" /> Сортировка
            </Button>
          </div>

          <div className="flex-1 overflow-auto">
            <PlayerSlots participants={participants} slots={12} />
          </div>

          <Button
            size="xl"
            onClick={handleStart}
            disabled={participants.length === 0 || isInProgress}
            className="shadow-accent"
          >
            {isInProgress ? "Игра уже идёт" : "▶ Начать игру"}
          </Button>
        </section>
      </div>
    </div>
  );
}
