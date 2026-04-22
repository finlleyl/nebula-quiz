import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { gameApi } from "@/features/live-game/api";
import { useQuizSocket } from "@/features/live-game/hooks/useQuizSocket";
import { useLiveGame } from "@/features/live-game/store";
import { quizSocket } from "@/features/live-game/ws-client";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { cn } from "@/shared/lib/utils";

type Step = "enter-code" | "enter-nickname" | "lobby";

export default function PlayerLobbyPage() {
  const { code: paramCode } = useParams<{ code?: string }>();


  const [step, setStep] = useState<Step>(paramCode ? "enter-nickname" : "enter-code");
  const [code, setCode] = useState(paramCode ?? "");
  const [nickname, setNickname] = useState("");
  const [ticket, setTicket] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const roomState = useLiveGame((s) => s.roomState);
  const reset = useLiveGame((s) => s.reset);

  useEffect(() => {
    reset();
  }, [reset]);

  useQuizSocket(ticket);

  // Navigate to question when game starts (Sprint 5 will handle question.start).

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = code.replace(/[^A-Z0-9-]/gi, "").toUpperCase();
    if (cleaned.length < 6) {
      setError("Please enter a valid room code");
      return;
    }
    setCode(cleaned);
    setError(null);
    setStep("enter-nickname");
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError("Please enter a nickname");
      return;
    }
    setJoining(true);
    setError(null);
    try {
      const res = await gameApi.join(code, nickname.trim());
      setTicket(res.ws_ticket);
      setStep("lobby");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Could not join game. Check the room code.";
      setError(msg);
    } finally {
      setJoining(false);
    }
  };

  const handleReady = () => {
    quizSocket.send({ type: "participant.ready" });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg-primary px-4">
      {/* Ambient blobs */}
      <div
        className="pointer-events-none absolute"
        style={{
          width: 640,
          height: 640,
          background: "rgba(166,140,255,0.1)",
          filter: "blur(50px)",
          borderRadius: "50%",
          top: -200,
          left: -200,
        }}
      />
      <div
        className="pointer-events-none absolute"
        style={{
          width: 512,
          height: 512,
          background: "rgba(141,205,255,0.08)",
          filter: "blur(50px)",
          borderRadius: "50%",
          bottom: -150,
          right: -150,
        }}
      />

      <div className="relative w-full max-w-md">
        {step === "enter-code" && (
          <form
            onSubmit={handleCodeSubmit}
            className="rounded-2xl p-8"
            style={{
              background: "#111128",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="mb-8 text-center">
              <h1 className="font-display text-3xl font-bold text-text-primary">
                Enter The Nebula.
              </h1>
              <p className="mt-2 text-text-muted">
                Join a live game instantly. No account required.
              </p>
            </div>

            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">
              Room Code
            </label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="7X9-2B4"
              className="mb-4 font-mono text-center text-xl tracking-widest"
              maxLength={8}
              autoFocus
            />

            {error && (
              <p className="mb-4 text-sm text-accent-error">{error}</p>
            )}

            <Button type="submit" className="w-full" size="lg">
              Enter Room →
            </Button>
          </form>
        )}

        {step === "enter-nickname" && (
          <form
            onSubmit={handleJoin}
            className="rounded-2xl p-8"
            style={{
              background: "#111128",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <button
              type="button"
              onClick={() => setStep("enter-code")}
              className="mb-6 flex items-center gap-2 text-sm text-text-muted hover:text-text-secondary"
            >
              ← Back
            </button>

            <div className="mb-8 text-center">
              <div
                className="mx-auto mb-4 font-mono text-4xl font-bold"
                style={{
                  backgroundImage:
                    "linear-gradient(180deg, #A68CFF 0%, #7C4DFF 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {code}
              </div>
              <h2 className="font-display text-2xl font-bold text-text-primary">
                Choose your nickname
              </h2>
            </div>

            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">
              Nickname
            </label>
            <Input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="AstroPlayer42"
              className="mb-4"
              maxLength={50}
              autoFocus
            />

            {error && (
              <p className="mb-4 text-sm text-accent-error">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={joining}
            >
              {joining ? "Joining…" : "Join Game →"}
            </Button>
          </form>
        )}

        {step === "lobby" && (
          <div
            className="flex flex-col items-center gap-6 rounded-2xl p-8 text-center"
            style={{
              background: "#111128",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {/* Status pill */}
            <span
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase"
              style={{
                background: "rgba(141,205,255,0.1)",
                color: "#8DCDFF",
              }}
            >
              <span className="h-2 w-2 animate-pulse rounded-full bg-current" />
              LOBBY OPEN
            </span>

            <div>
              <h2 className="font-display text-2xl font-bold text-text-primary">
                You're in!
              </h2>
              <p className="mt-1 text-text-muted">
                Waiting for the host to start the game…
              </p>
            </div>

            {roomState && (
              <div className="w-full text-left">
                <p className="mb-1 text-sm text-text-secondary">
                  <strong className="text-text-primary">
                    {roomState.quiz.title}
                  </strong>
                  {" · "}
                  {roomState.quiz.total_questions} questions
                </p>
                <p className="text-sm text-text-muted">
                  {roomState.participants.length} player
                  {roomState.participants.length !== 1 ? "s" : ""} in lobby
                </p>
              </div>
            )}

            <PlayerRoster participants={roomState?.participants ?? []} myNickname={nickname} />

            <Button
              onClick={handleReady}
              size="lg"
              variant="outline"
              className="w-full"
            >
              ✓ I'm Ready
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function PlayerRoster({
  participants,
  myNickname,
}: {
  participants: Array<{ id: string; nickname: string; status: string }>;
  myNickname: string;
}) {
  if (participants.length === 0) return null;
  return (
    <div className="w-full space-y-2">
      {participants.map((p) => {
        const isMe = p.nickname === myNickname;
        return (
          <div
            key={p.id}
            className={cn(
              "flex items-center gap-3 rounded-[48px] px-4 py-3",
              isMe
                ? "border"
                : "bg-bg-card"
            )}
            style={
              isMe
                ? {
                    background: "#222247",
                    borderColor: "rgba(68,68,108,0.3)",
                    boxShadow: "0 10px 20px 0 rgba(0,0,0,0.30)",
                  }
                : {}
            }
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: isMe ? "#7C4DFF" : "rgba(255,255,255,0.1)" }}
            >
              {isMe ? "YOU" : p.nickname.slice(0, 2).toUpperCase()}
            </div>
            <span
              className={cn(
                "flex-1 text-sm",
                isMe
                  ? "font-bold text-text-primary"
                  : "font-medium text-text-primary"
              )}
            >
              {p.nickname}
            </span>
            {p.status === "ready" && (
              <span className="text-xs font-semibold text-accent-success">
                Ready ✓
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
