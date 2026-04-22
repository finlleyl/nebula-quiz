import { useNavigate } from "react-router-dom";
import { useLiveGame } from "@/features/live-game/store";

/** Placeholder for Sprint 6 — shows basic podium / runner-ups to player. */
export default function PlayerResultsPage() {
  const navigate = useNavigate();
  const { finishedPayload, leaderboard, myRank, myScore, disconnect } = useLiveGame();

  function handleExit() {
    disconnect();
    navigate("/", { replace: true });
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-8 px-6"
      style={{ background: "#0C0C1F", color: "#E5E3FF" }}
    >
      {/* Ambient background */}
      <div
        style={{
          position: "fixed",
          top: -103,
          left: -128,
          width: 640,
          height: 640,
          borderRadius: "50%",
          background: "rgba(166,140,255,0.10)",
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: -103,
          right: -128,
          width: 512,
          height: 512,
          borderRadius: "50%",
          background: "rgba(141,205,255,0.10)",
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />

      <h1 className="font-display text-4xl font-bold" style={{ color: "#E5E3FF" }}>
        Match Complete
      </h1>
      {finishedPayload && (
        <p className="text-lg" style={{ color: "#A8A7D5" }}>
          You finished #{myRank} with{" "}
          <span style={{ color: "#8DCDFF" }}>{myScore.toLocaleString()} pts</span>
        </p>
      )}

      {/* Top 3 podium pill list */}
      {finishedPayload && (
        <div className="flex flex-col gap-3 w-full max-w-sm">
          {[...finishedPayload.podium, ...finishedPayload.runner_ups]
            .slice(0, 8)
            .map((p) => (
              <div
                key={`${p.rank}-${p.nickname}`}
                className="flex items-center justify-between px-6 py-3"
                style={{
                  borderRadius: 48,
                  background: p.rank <= 3 ? "rgba(124,77,255,0.15)" : "#111128",
                  border:
                    p.rank === 1
                      ? "1px solid rgba(255,183,120,0.30)"
                      : "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <span
                  className="w-8 font-display font-bold"
                  style={{ color: p.rank === 1 ? "#FFB778" : "#A8A7D5" }}
                >
                  #{p.rank}
                </span>
                <span className="flex-1 font-medium" style={{ color: "#E5E3FF" }}>
                  {p.nickname}
                </span>
                <span
                  className="font-display font-bold"
                  style={{ color: p.rank <= 3 ? "#8DCDFF" : "#A8A7D5" }}
                >
                  {p.score.toLocaleString()}
                </span>
              </div>
            ))}
        </div>
      )}

      {leaderboard.length > 0 && !finishedPayload && (
        <p className="text-sm" style={{ color: "#8B8FB8" }}>
          Final scores being tallied…
        </p>
      )}

      <div className="flex gap-4">
        <button
          onClick={handleExit}
          className="rounded-full px-8 py-3 text-base font-bold"
          style={{
            backgroundImage: "linear-gradient(180deg, #A68CFF 0%, #7C4DFF 100%)",
            color: "#FFFFFF",
            boxShadow: "0 10px 20px 0 rgba(166,139,255,0.20)",
          }}
        >
          Play Again
        </button>
        <button
          onClick={handleExit}
          className="rounded-full px-8 py-3 text-base font-bold"
          style={{
            border: "1px solid rgba(68,68,108,0.15)",
            color: "#8DCDFF",
          }}
        >
          Exit Match
        </button>
      </div>
    </div>
  );
}
