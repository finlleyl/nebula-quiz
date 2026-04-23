import { Check } from "lucide-react";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useLiveGame } from "@/features/live-game/store";
import { Button } from "@/shared/ui/button";
import { Logo } from "@/shared/ui/Logo";

export default function PlayerLobbyPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { roomState, sendReady, myParticipantId } = useLiveGame();

  useEffect(() => {
    if (roomState?.status === "in_progress") {
      navigate(`/play/${code}/question`, { replace: true });
    }
  }, [roomState?.status, code, navigate]);

  const participantCount = roomState?.participants.length ?? 0;
  const quizTitle = roomState?.quiz.title ?? "…";
  const me = roomState?.participants.find((p) => p.id === myParticipantId);
  const isReady = me?.status === "ready";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-bg-page px-4">
      <Logo size={32} />

      <span className="chip chip-danger px-3.5 py-1.5 text-[13px] uppercase tracking-[0.08em]">
        <span className="dot" /> Лобби открыто
      </span>

      <div className="text-center">
        <h1 className="font-display text-[32px] font-extrabold tracking-[-0.02em]">
          {quizTitle}
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Комната{" "}
          <span className="font-mono font-bold text-accent">{code}</span>
        </p>
      </div>

      <div className="card px-10 py-6 text-center">
        <div className="font-display text-5xl font-extrabold text-accent">
          {participantCount}
        </div>
        <div className="mt-1 text-sm text-text-secondary">
          {participantCount === 1 ? "участник" : "участников"} в лобби
        </div>
      </div>

      <Button
        size="xl"
        onClick={sendReady}
        disabled={isReady}
        variant={isReady ? "secondary" : "primary"}
        className={isReady ? "!bg-success-soft !text-success" : "shadow-accent"}
      >
        <Check className="size-[18px]" strokeWidth={3} />
        {isReady ? "Вы готовы" : "Я готов"}
      </Button>

      <p className="text-xs text-text-tertiary">
        Ожидаем, пока ведущий запустит игру…
      </p>
    </div>
  );
}
