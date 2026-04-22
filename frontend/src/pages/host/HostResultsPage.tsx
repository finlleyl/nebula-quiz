import { useNavigate } from "react-router-dom";
import { useLiveGame } from "@/features/live-game/store";

export default function HostResultsPage() {
  const navigate = useNavigate();
  const { finishedPayload, disconnect } = useLiveGame();

  function handleExit() {
    disconnect();
    navigate("/dashboard", { replace: true });
  }

  const payload = finishedPayload;
  const allEntries = payload ? [...payload.podium, ...payload.runner_ups] : [];
  const first  = payload?.podium.find((p) => p.rank === 1);
  const second = payload?.podium.find((p) => p.rank === 2);
  const third  = payload?.podium.find((p) => p.rank === 3);
  const runnerUps = allEntries.filter((p) => p.rank > 3);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0C0C1F",
        color: "#E5E3FF",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      {/* Ambient blobs */}
      <div style={{ position: "fixed", top: -103, left: -128, width: 640, height: 640, borderRadius: "50%", background: "rgba(166,140,255,0.10)", filter: "blur(50px)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: -103, right: -128, width: 512, height: 512, borderRadius: "50%", background: "rgba(141,205,255,0.10)", filter: "blur(50px)", pointerEvents: "none", zIndex: 0 }} />

      {/* Top nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(12px)", background: "rgba(12,12,31,0.80)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "0.1em", backgroundImage: "linear-gradient(168deg, #A68CFF 0%, #7C4DFF 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
          NEBULA QUIZ
        </span>
        <button onClick={handleExit} style={{ borderRadius: 9999, padding: "8px 20px", background: "linear-gradient(180deg, #A68CFF 0%, #7C4DFF 100%)", border: "none", color: "#FFF", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Back to Dashboard
        </button>
      </nav>

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 24px", position: "relative", zIndex: 1 }}>
        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 60, fontWeight: 700, letterSpacing: "-1.5px", color: "#E5E3FF", margin: 0, lineHeight: 1.1 }}>
            Game Over
          </h1>
          {payload && (
            <p style={{ marginTop: 12, fontSize: 18, color: "#A8A7D5" }}>
              Match #{payload.match_number} · {allEntries.length} player{allEntries.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Podium 2-1-3 */}
        {payload && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 8, marginBottom: 56 }}>
            {[second, first, third].map((p) => {
              if (!p) return null;
              const cfg = {
                1: { w: 220, h: 224, bg: "linear-gradient(180deg, #A68CFF 0%, #7C4DFF 100%)", shadow: "0 20px 40px 0 rgba(166,139,255,0.20)", rankSz: 48, rankColor: "#FFF", scoreColor: "#FFB778" },
                2: { w: 200, h: 160, bg: "#1C1C3D", shadow: "0 20px 40px 0 rgba(0,0,0,0.50)", rankSz: 36, rankColor: "#A8A7D5", scoreColor: "#8DCDFF" },
                3: { w: 200, h: 128, bg: "#1C1C3D", shadow: "0 20px 40px 0 rgba(0,0,0,0.50)", rankSz: 30, rankColor: "#A8A7D5", scoreColor: "#8DCDFF" },
              } as const;
              const c = cfg[p.rank as 1 | 2 | 3];
              const initials = p.nickname.slice(0, 2).toUpperCase();
              const avatarSize = p.rank === 1 ? 96 : 80;
              return (
                <div key={p.rank} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end" }}>
                  {p.rank === 1 && <div style={{ marginBottom: 4, fontSize: 24 }}>👑</div>}
                  <div style={{ width: avatarSize, height: avatarSize, borderRadius: "50%", background: "#222247", border: p.rank === 1 ? "4px solid #FFB778" : "4px solid #111128", display: "flex", alignItems: "center", justifyContent: "center", fontSize: p.rank === 1 ? 20 : 16, fontWeight: 700, color: "#E5E3FF", marginBottom: 8 }}>
                    {initials}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#E5E3FF", marginBottom: 6, maxWidth: c.w - 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center" }}>
                    {p.nickname}
                  </div>
                  <div style={{ width: c.w, height: c.h, background: c.bg, boxShadow: c.shadow, borderRadius: "24px 24px 0 0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: c.rankSz, fontWeight: 700, color: c.rankColor }}>{p.rank}</span>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: c.scoreColor }}>{p.score.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Runner Ups */}
        {runnerUps.length > 0 && (
          <div style={{ maxWidth: 672, margin: "0 auto 40px" }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: "#A8A7D5", marginBottom: 16 }}>Runner Ups</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {runnerUps.map((p) => (
                <div key={`${p.rank}-${p.nickname}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: 48, background: "#111128", border: "1px solid rgba(255,255,255,0.06)", padding: "16px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ width: 32, fontSize: 16, fontWeight: 500, color: "#A8A7D5" }}>#{p.rank}</span>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#222247", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "#A8A7D5" }}>
                      {p.nickname.slice(0, 2).toUpperCase()}
                    </div>
                    <span style={{ fontSize: 16, fontWeight: 500, color: "#E5E3FF" }}>{p.nickname}</span>
                  </div>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: "#8DCDFF" }}>{p.score.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div style={{ maxWidth: 300, margin: "0 auto", display: "flex", justifyContent: "center" }}>
          <button
            onClick={handleExit}
            style={{ borderRadius: 48, background: "linear-gradient(180deg, #A68CFF 0%, #7C4DFF 100%)", boxShadow: "0 10px 20px 0 rgba(166,139,255,0.20)", color: "#FFF", fontSize: 16, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", padding: "16px 48px", border: "none", cursor: "pointer" }}
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}
