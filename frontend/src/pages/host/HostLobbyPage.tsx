import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { RoomCodeDisplay } from "@/features/live-game/components/RoomCodeDisplay";
import { PlayerSlots } from "@/features/live-game/components/PlayerSlots";
import { useLiveGame } from "@/features/live-game/store";

/**
 * /host/:code
 *
 * Requires that the parent flow (Dashboard → Create Game) already:
 *  1. Called POST /api/v1/games → got ws_ticket + room_code
 *  2. Stored ws_ticket + room_code in sessionStorage under "host_ticket" / "host_room_code"
 *  3. Navigated here via react-router
 */
export default function HostLobbyPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { roomState, connectAsHost, startGame, disconnect } = useLiveGame();

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

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const participants = roomState?.participants ?? [];
  const isInProgress = roomState?.status === "in_progress";

  function handleStart() {
    startGame();
    navigate(`/host/${code}/question`);
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#0C0C1F", color: "#E5E3FF" }}
    >
      {/* Top Nav */}
      <header
        className="flex items-center justify-between px-8 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span
          className="font-display text-lg font-bold uppercase tracking-widest"
          style={{
            backgroundImage: "linear-gradient(168deg, #A68CFF 0%, #7C4DFF 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          NEBULA QUIZ
        </span>
        <span className="text-sm" style={{ color: "#8B8FB8" }}>
          Host mode
        </span>
      </header>

      {/* Main content */}
      <main className="flex flex-1 flex-col items-center justify-between gap-12 px-8 py-12 max-w-4xl mx-auto w-full">
        {/* Room code */}
        {code && <RoomCodeDisplay code={code} />}

        {/* Players section */}
        <section className="w-full">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-semibold" style={{ color: "#E5E3FF" }}>
              👥 Players
            </span>
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: "rgba(124,77,255,0.15)", color: "#A68CFF" }}
            >
              {participants.length} Joined
            </span>
          </div>

          <PlayerSlots participants={participants} slots={8} />
        </section>

        {/* Start Game button */}
        <button
          onClick={handleStart}
          disabled={participants.length === 0 || isInProgress}
          className="w-full max-w-xs rounded-full py-4 text-lg font-bold transition-all
                     disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            backgroundImage:
              participants.length > 0 && !isInProgress
                ? "linear-gradient(180deg, #A68CFF 0%, #7C4DFF 100%)"
                : undefined,
            background:
              participants.length === 0 || isInProgress ? "#222247" : undefined,
            color: "#FFFFFF",
            boxShadow:
              participants.length > 0 && !isInProgress
                ? "0 10px 20px 0 rgba(166,139,255,0.20)"
                : undefined,
          }}
        >
          {isInProgress ? "GAME IN PROGRESS" : "START GAME ▶"}
        </button>
      </main>
    </div>
  );
}
