import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLiveGame } from "@/features/live-game/store";

/**
 * /play/:code/lobby
 *
 * Shown to the player while waiting for the host to start the game.
 * The WS connection has already been established by PlayerJoinPage.
 */
export default function PlayerLobbyPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { roomState, sendReady, myParticipantId } = useLiveGame();

  // When game starts, navigate to the question view.
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
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-8 px-4"
      style={{ background: "#0C0C1F", color: "#E5E3FF" }}
    >
      {/* Ambient blob */}
      <div
        style={{
          position: "fixed",
          bottom: -103,
          right: -128,
          width: 512,
          height: 512,
          borderRadius: "50%",
          background: "rgba(141,205,255,0.1)",
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />

      {/* Status pill */}
      <span
        className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase"
        style={{ background: "rgba(141,205,255,0.10)", color: "#8DCDFF" }}
      >
        <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
        LOBBY OPEN
      </span>

      {/* Quiz title */}
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold" style={{ color: "#E5E3FF" }}>
          {quizTitle}
        </h1>
        <p className="mt-2 text-sm" style={{ color: "#8B8FB8" }}>
          {code && (
            <>
              Room{" "}
              <span className="font-mono font-bold" style={{ color: "#A68CFF" }}>
                {code}
              </span>
            </>
          )}
        </p>
      </div>

      {/* Participants count */}
      <div
        className="rounded-2xl px-8 py-6 text-center"
        style={{ background: "#111128", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className="font-display text-5xl font-bold"
          style={{ color: "#8DCDFF" }}
        >
          {participantCount}
        </div>
        <div className="mt-1 text-sm" style={{ color: "#8B8FB8" }}>
          player{participantCount !== 1 ? "s" : ""} joined
        </div>
      </div>

      {/* Ready button */}
      <button
        onClick={sendReady}
        disabled={isReady}
        className="rounded-full px-8 py-3 text-base font-semibold transition-all disabled:cursor-not-allowed"
        style={
          isReady
            ? {
                border: "1px solid rgba(52,211,153,0.40)",
                color: "#34D399",
                background: "rgba(52,211,153,0.12)",
              }
            : {
                border: "1px solid rgba(68,68,108,0.30)",
                color: "#A68CFF",
                background: "transparent",
              }
        }
        onMouseEnter={(e) => {
          if (!isReady)
            e.currentTarget.style.background = "rgba(124,77,255,0.10)";
        }}
        onMouseLeave={(e) => {
          if (!isReady) e.currentTarget.style.background = "transparent";
        }}
      >
        {isReady ? "✓ You're Ready" : "✓ I'm Ready"}
      </button>

      <p className="text-xs" style={{ color: "#5C5E85" }}>
        Waiting for the host to start the game…
      </p>
    </div>
  );
}
