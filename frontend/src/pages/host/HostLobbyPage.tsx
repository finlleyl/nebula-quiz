import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import { gameApi } from "@/features/live-game/api";
import { useQuizSocket } from "@/features/live-game/hooks/useQuizSocket";
import { useLiveGame } from "@/features/live-game/store";
import { quizSocket } from "@/features/live-game/ws-client";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

export default function HostLobbyPage() {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();


  const quizId = searchParams.get("quiz_id");
  const [gameId, setGameId] = useState<string | null>(null);
  const [ticket, setTicket] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(code ?? null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const roomState = useLiveGame((s) => s.roomState);
  const reset = useLiveGame((s) => s.reset);

  useEffect(() => {
    reset();
  }, [reset]);

  // Create game session if no code (new game from quiz ID).
  useEffect(() => {
    if (code || !quizId) return;

    gameApi
      .create(quizId)
      .then((res) => {
        setGameId(res.game_id);
        setRoomCode(res.room_code);
        return gameApi.hostTicket(res.game_id);
      })
      .then((res) => setTicket(res.ws_ticket))
      .catch((err) => setError(String(err)));
  }, [quizId, code]);

  // If code provided (returning host), just get a host ticket for that game.
  useEffect(() => {
    if (!code || !gameId) return;
    gameApi
      .hostTicket(gameId)
      .then((res) => setTicket(res.ws_ticket))
      .catch((err) => setError(String(err)));
  }, [code, gameId]);

  useQuizSocket(ticket);

  const participants = roomState?.participants ?? [];

  const handleStartGame = () => {
    setStarting(true);
    quizSocket.send({ type: "host.start_game" });
    // Sprint 5 will navigate to question view on question.start event.
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary">
        <p className="text-accent-error">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg-primary">
      {/* Ambient blobs */}
      <div
        className="pointer-events-none absolute"
        style={{
          width: 640,
          height: 640,
          background: "rgba(166,140,255,0.1)",
          filter: "blur(50px)",
          borderRadius: "50%",
          top: -128,
          left: -128,
        }}
      />
      <div
        className="pointer-events-none absolute"
        style={{
          width: 512,
          height: 512,
          background: "rgba(141,205,255,0.1)",
          filter: "blur(50px)",
          borderRadius: "50%",
          bottom: -128,
          right: -128,
        }}
      />

      <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-8 px-6 py-16">
        {/* Status pill */}
        <span
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase"
          style={{ background: "rgba(141,205,255,0.1)", color: "#8DCDFF" }}
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-current" />
          LOBBY OPEN
        </span>

        <p className="text-text-muted">Join at nebula.live with code:</p>

        {/* Room code — giant */}
        <div
          className="font-mono font-bold leading-none tracking-tight select-all"
          style={{
            fontSize: "clamp(56px, 12vw, 120px)",
            backgroundImage:
              "linear-gradient(180deg, #A68CFF 0%, #7C4DFF 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            color: "transparent",
          }}
        >
          {roomCode ?? "---"}
        </div>

        <p className="text-text-muted">
          {participants.length === 0
            ? "Waiting for players to connect..."
            : `${participants.length} player${participants.length !== 1 ? "s" : ""} connected`}
        </p>

        {/* Players grid */}
        <div className="w-full">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-lg font-semibold text-text-primary">
              👥 Players
            </span>
            <span
              className="rounded-full px-3 py-0.5 text-xs font-semibold"
              style={{
                background: "rgba(124,77,255,0.15)",
                color: "#A68CFF",
              }}
            >
              {participants.length} Joined
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {participants.map((p) => (
              <PlayerCard key={p.id} nickname={p.nickname} status={p.status} />
            ))}
            {/* Empty slots up to 8 */}
            {Array.from({
              length: Math.max(0, 8 - participants.length),
            }).map((_, i) => (
              <EmptySlot key={`empty-${i}`} />
            ))}
          </div>
        </div>

        {/* Start Game button */}
        <Button
          size="lg"
          variant="primary"
          disabled={participants.length === 0 || starting || !ticket}
          onClick={handleStartGame}
          className="mt-4 min-w-[200px] text-base font-bold uppercase tracking-wide"
        >
          {starting ? "Starting…" : "START GAME ▶"}
        </Button>
      </div>
    </div>
  );
}

function PlayerCard({
  nickname,
  status,
}: {
  nickname: string;
  status: string;
}) {
  const isReady = status === "ready";
  return (
    <div
      className="flex flex-col items-center gap-2 rounded-2xl p-4"
      style={{
        background: "#111128",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
        style={{ background: "#7C4DFF" }}
      >
        {nickname.slice(0, 2).toUpperCase()}
      </div>
      <span className="max-w-full truncate text-sm font-medium text-text-primary">
        {nickname}
      </span>
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-xs font-semibold",
          isReady
            ? "bg-accent-success/10 text-accent-success"
            : "bg-white/5 text-text-muted"
        )}
      >
        {isReady ? "Ready" : "Joined"}
      </span>
    </div>
  );
}

function EmptySlot() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 rounded-2xl p-4"
      style={{
        border: "1px dashed rgba(255,255,255,0.12)",
        minHeight: 100,
        color: "#5C5E85",
      }}
    >
      <span className="text-2xl opacity-50">+</span>
    </div>
  );
}
