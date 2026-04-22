import { useNavigate } from "react-router-dom";
import { useLiveGame } from "@/features/live-game/store";

/** Placeholder for Sprint 6 — shows basic podium and exit. */
export default function HostResultsPage() {
  const navigate = useNavigate();
  const { finishedPayload, disconnect } = useLiveGame();

  function handleExit() {
    disconnect();
    navigate("/dashboard", { replace: true });
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-8 px-6"
      style={{ background: "#0C0C1F", color: "#E5E3FF" }}
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

      <h1 className="font-display text-4xl font-bold" style={{ color: "#E5E3FF" }}>
        Game Over!
      </h1>

      {finishedPayload && (
        <div className="flex flex-col gap-3 w-full max-w-sm">
          {finishedPayload.podium.map((p) => (
            <div
              key={p.nickname}
              className="flex items-center justify-between rounded-full px-6 py-3"
              style={{ background: "#111128", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <span style={{ color: "#A8A7D5" }}>#{p.rank}</span>
              <span className="font-medium" style={{ color: "#E5E3FF" }}>
                {p.nickname}
              </span>
              <span className="font-display font-bold" style={{ color: "#FFB778" }}>
                {p.score.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleExit}
        className="rounded-full px-8 py-3 text-base font-bold"
        style={{
          backgroundImage: "linear-gradient(180deg, #A68CFF 0%, #7C4DFF 100%)",
          color: "#FFFFFF",
          boxShadow: "0 10px 20px 0 rgba(166,139,255,0.20)",
        }}
      >
        Back to Dashboard
      </button>
    </div>
  );
}
