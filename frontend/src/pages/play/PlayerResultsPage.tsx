import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useLiveGame } from "@/features/live-game/store";
import type { GameFinishedPayload } from "@/shared/lib/ws/protocol";

// ── Podium entry component ────────────────────────────────────────────────────

function PodiumEntry({
  rank,
  nickname,
  score,
  isSelf,
}: {
  rank: 1 | 2 | 3;
  nickname: string;
  score: number;
  isSelf: boolean;
}) {
  const configs = {
    1: {
      width: 220,
      height: 224,
      bg: "linear-gradient(180deg, #A68CFF 0%, #7C4DFF 100%)",
      shadow: "0 20px 40px 0 rgba(166,139,255,0.20)",
      avatarSize: 96,
      avatarBorder: "4px solid #FFB778",
      rankSize: 48,
      rankColor: "#FFFFFF",
      scoreColor: "#FFB778",
      scoreFontSize: 18,
      zIndex: 2,
    },
    2: {
      width: 200,
      height: 160,
      bg: "#1C1C3D",
      shadow: "0 20px 40px 0 rgba(0,0,0,0.50)",
      avatarSize: 80,
      avatarBorder: "4px solid #111128",
      rankSize: 36,
      rankColor: "#A8A7D5",
      scoreColor: "#8DCDFF",
      scoreFontSize: 16,
      zIndex: 1,
    },
    3: {
      width: 200,
      height: 128,
      bg: "#1C1C3D",
      shadow: "0 20px 40px 0 rgba(0,0,0,0.50)",
      avatarSize: 80,
      avatarBorder: "4px solid #111128",
      rankSize: 30,
      rankColor: "#A8A7D5",
      scoreColor: "#8DCDFF",
      scoreFontSize: 16,
      zIndex: 1,
    },
  } as const;

  const c = configs[rank];
  const initials = nickname.slice(0, 2).toUpperCase();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        position: "relative",
        zIndex: c.zIndex,
      }}
    >
      {/* Crown for 1st place */}
      {rank === 1 && (
        <div style={{ marginBottom: 4, fontSize: 24 }}>👑</div>
      )}

      {/* Avatar */}
      <div
        style={{
          width: c.avatarSize,
          height: c.avatarSize,
          borderRadius: "50%",
          background: isSelf ? "#7C4DFF" : "#222247",
          border: c.avatarBorder,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: rank === 1 ? 20 : 16,
          fontWeight: 700,
          color: "#E5E3FF",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          marginBottom: 8,
          flexShrink: 0,
        }}
      >
        {initials}
      </div>

      {/* Name */}
      <div
        style={{
          color: "#E5E3FF",
          fontSize: 14,
          fontWeight: 600,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          marginBottom: 4,
          textAlign: "center",
          maxWidth: c.width - 16,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {nickname}
      </div>

      {/* Podium block */}
      <div
        style={{
          width: c.width,
          height: c.height,
          background: c.bg,
          boxShadow: c.shadow,
          borderRadius: "24px 24px 0 0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
        }}
      >
        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: c.rankSize,
            fontWeight: 700,
            color: c.rankColor,
          }}
        >
          {rank}
        </div>
        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: c.scoreFontSize,
            fontWeight: 700,
            color: c.scoreColor,
          }}
        >
          {score.toLocaleString()}
        </div>
      </div>
    </div>
  );
}

// ── Runner-up row ─────────────────────────────────────────────────────────────

function RunnerUpRow({
  rank,
  nickname,
  score,
  isSelf,
}: {
  rank: number;
  nickname: string;
  score: number;
  isSelf: boolean;
}) {
  const initials = nickname.slice(0, 2).toUpperCase();

  if (isSelf) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: 48,
          background: "#222247",
          border: "1px solid rgba(68,68,108,0.30)",
          boxShadow: "0 10px 20px 0 rgba(0,0,0,0.30)",
          padding: "17px 20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              width: 32,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 16,
              fontWeight: 600,
              color: "#A68CFF",
            }}
          >
            #{rank}
          </span>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "#7C4DFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 700,
              color: "#FFFFFF",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            YOU
          </div>
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#E5E3FF",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {nickname}
          </span>
        </div>
        <span
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 16,
            fontWeight: 700,
            color: "#A68CFF",
          }}
        >
          {score.toLocaleString()}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderRadius: 48,
        background: "#111128",
        border: "1px solid rgba(255,255,255,0.06)",
        padding: "16px 20px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            width: 32,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 16,
            fontWeight: 500,
            color: "#A8A7D5",
          }}
        >
          #{rank}
        </span>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "#222247",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 600,
            color: "#A8A7D5",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          {initials}
        </div>
        <span
          style={{
            fontSize: 16,
            fontWeight: 500,
            color: "#E5E3FF",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          {nickname}
        </span>
      </div>
      <span
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 16,
          fontWeight: 700,
          color: "#8DCDFF",
        }}
      >
        {score.toLocaleString()}
      </span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PlayerResultsPage() {
  const navigate = useNavigate();
  const { finishedPayload, myRank, myScore, disconnect } = useLiveGame();

  function handlePlayAgain() {
    disconnect();
    navigate("/", { replace: true });
  }

  function handleExit() {
    disconnect();
    navigate("/", { replace: true });
  }

  const payload: GameFinishedPayload | null = finishedPayload;

  // Build ordered list: podium (1,2,3) + runner_ups
  const allEntries = payload
    ? [...payload.podium, ...payload.runner_ups]
    : [];

  // Podium slots in visual order: 2nd, 1st, 3rd
  const first  = payload?.podium.find((p) => p.rank === 1);
  const second = payload?.podium.find((p) => p.rank === 2);
  const third  = payload?.podium.find((p) => p.rank === 3);

  // Runner Ups = rank 4+
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
      {/* ── Ambient blobs ── */}
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
          zIndex: 0,
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
          zIndex: 0,
        }}
      />

      {/* ── Top nav ── */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(12px)",
          background: "rgba(12,12,31,0.80)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "0 24px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: "100%",
        }}
      >
        <span
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: 18,
            letterSpacing: "0.1em",
            backgroundImage: "linear-gradient(168deg, #A68CFF 0%, #7C4DFF 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          NEBULA QUIZ
        </span>

        <div
          style={{
            display: "flex",
            gap: 0,
            background: "#111128",
            borderRadius: 9999,
            padding: "6px 4px",
          }}
        >
          {["Explore", "Library", "Reports"].map((link) => (
            <span
              key={link}
              style={{
                padding: "6px 16px",
                fontSize: 14,
                fontWeight: 500,
                color: "#A8A7D5",
                cursor: "pointer",
                borderRadius: 9999,
              }}
            >
              {link}
            </span>
          ))}
        </div>
      </nav>

      {/* ── Content ── */}
      <main
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "48px 24px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ textAlign: "center", marginBottom: 48 }}
        >
          <h1
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 60,
              fontWeight: 700,
              letterSpacing: "-1.5px",
              color: "#E5E3FF",
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            Match Complete
          </h1>
          {payload && (
            <p
              style={{
                marginTop: 12,
                fontSize: 18,
                fontWeight: 400,
                color: "#A8A7D5",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              Match #{payload.match_number}
            </p>
          )}
        </motion.div>

        {/* Podium — 2-1-3 visual order, with staggered pop-in */}
        {payload && (first || second || third) && (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.15, delayChildren: 0.3 } },
            }}
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-end",
              gap: 8,
              marginBottom: 56,
            }}
          >
            {second && (
              <motion.div
                variants={{ hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 20 } } }}
              >
                <PodiumEntry rank={2} nickname={second.nickname} score={second.score} isSelf={myRank === 2} />
              </motion.div>
            )}
            {first && (
              <motion.div
                variants={{ hidden: { opacity: 0, y: 60, scale: 0.9 }, show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 220, damping: 18 } } }}
              >
                <PodiumEntry rank={1} nickname={first.nickname} score={first.score} isSelf={myRank === 1} />
              </motion.div>
            )}
            {third && (
              <motion.div
                variants={{ hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 20 } } }}
              >
                <PodiumEntry rank={3} nickname={third.nickname} score={third.score} isSelf={myRank === 3} />
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Runner Ups — staggered slide-in */}
        {runnerUps.length > 0 && (
          <div style={{ maxWidth: 672, margin: "0 auto 40px" }}>
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 20,
                fontWeight: 700,
                color: "#A8A7D5",
                marginBottom: 16,
              }}
            >
              Runner Ups
            </motion.h2>
            <motion.div
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.07, delayChildren: 0.75 } },
              }}
              style={{ display: "flex", flexDirection: "column", gap: 8 }}
            >
              {runnerUps.map((p) => (
                <motion.div
                  key={`${p.rank}-${p.nickname}`}
                  variants={{
                    hidden: { opacity: 0, x: -20 },
                    show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
                  }}
                >
                  <RunnerUpRow
                    rank={p.rank}
                    nickname={p.nickname}
                    score={p.score}
                    isSelf={myRank === p.rank}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}

        {/* Current player info if not in top 3 / runner-ups visible */}
        {payload && myRank > 0 && !allEntries.some((p) => p.rank === myRank) && (
          <div style={{ maxWidth: 672, margin: "0 auto 40px" }}>
            <RunnerUpRow
              rank={myRank}
              nickname="You"
              score={myScore}
              isSelf={true}
            />
          </div>
        )}

        {/* Action buttons */}
        <div
          style={{
            maxWidth: 448,
            margin: "0 auto",
            display: "flex",
            gap: 16,
          }}
        >
          <button
            onClick={handlePlayAgain}
            style={{
              flex: 1,
              borderRadius: 48,
              background: "linear-gradient(180deg, #A68CFF 0%, #7C4DFF 100%)",
              boxShadow: "0 10px 20px 0 rgba(166,139,255,0.20)",
              color: "#FFFFFF",
              fontSize: 16,
              fontWeight: 700,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              padding: "16px 24px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Play Again
          </button>
          <button
            onClick={handleExit}
            style={{
              flex: 1,
              borderRadius: 48,
              background: "transparent",
              border: "1px solid rgba(68,68,108,0.15)",
              color: "#8DCDFF",
              fontSize: 16,
              fontWeight: 700,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              padding: "16px 24px",
              cursor: "pointer",
            }}
          >
            Exit Match
          </button>
        </div>
      </main>
    </div>
  );
}
