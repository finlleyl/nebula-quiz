import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { joinGame, buildWsUrl } from "@/features/live-game/api";
import { useLiveGame } from "@/features/live-game/store";

/**
 * /join/:code?
 *
 * Lets a player enter (or confirm) a room code and pick a nickname,
 * then connects to the WS lobby.
 */
export default function PlayerJoinPage() {
  const { code: paramCode } = useParams<{ code?: string }>();
  const navigate = useNavigate();
  const { connectAsPlayer } = useLiveGame();

  const [roomCode, setRoomCode] = useState(paramCode ?? "");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const trimCode = roomCode.trim().toUpperCase();
    const trimNick = nickname.trim();
    if (!trimCode || !trimNick) return;

    setLoading(true);
    setError(null);
    try {
      const res = await joinGame(trimCode, trimNick);
      const wsUrl = buildWsUrl(res.ws_ticket);
      connectAsPlayer(wsUrl);
      navigate(`/play/${trimCode}/lobby`);
    } catch {
      setError("Could not join — check the room code and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "#0C0C1F" }}
    >
      {/* Ambient background blobs */}
      <div
        style={{
          position: "fixed",
          top: -103,
          left: -128,
          width: 640,
          height: 640,
          borderRadius: "50%",
          background: "rgba(166,140,255,0.1)",
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />

      {/* Logo */}
      <span
        className="mb-10 font-display text-2xl font-bold uppercase tracking-widest"
        style={{
          backgroundImage: "linear-gradient(168deg, #A68CFF 0%, #7C4DFF 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        NEBULA QUIZ
      </span>

      {/* Card */}
      <form
        onSubmit={handleJoin}
        className="w-full max-w-md rounded-2xl p-8 flex flex-col gap-6"
        style={{
          background: "#111128",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
        }}
      >
        <div>
          <h1
            className="font-display text-2xl font-bold mb-1"
            style={{ color: "#E5E3FF" }}
          >
            Join a Game
          </h1>
          <p className="text-sm" style={{ color: "#8B8FB8" }}>
            No account required. Just enter the code.
          </p>
        </div>

        {/* Room code input */}
        <div className="flex flex-col gap-2">
          <label
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "#8B8FB8" }}
          >
            Room Code
          </label>
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="ABC-XYZ"
            maxLength={7}
            spellCheck={false}
            autoCapitalize="characters"
            className="w-full rounded-xl px-4 py-3 font-mono text-xl font-bold tracking-widest text-center outline-none transition-all"
            style={{
              background: "#0F1127",
              color: "#E5E3FF",
              border: "1px solid rgba(68,68,108,0.30)",
            }}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "#7C4DFF")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = "rgba(68,68,108,0.30)")
            }
          />
        </div>

        {/* Nickname input */}
        <div className="flex flex-col gap-2">
          <label
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "#8B8FB8" }}
          >
            Your Nickname
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="e.g. AstroAlex"
            maxLength={32}
            className="w-full rounded-xl px-4 py-3 text-base outline-none transition-all"
            style={{
              background: "#0F1127",
              color: "#E5E3FF",
              border: "1px solid rgba(68,68,108,0.30)",
            }}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "#7C4DFF")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = "rgba(68,68,108,0.30)")
            }
          />
        </div>

        {error && (
          <p className="text-sm rounded-lg px-4 py-3" style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !roomCode.trim() || !nickname.trim()}
          className="w-full rounded-full py-4 text-base font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            backgroundImage: "linear-gradient(180deg, #A68CFF 0%, #7C4DFF 100%)",
            color: "#FFFFFF",
            boxShadow: "0 10px 20px 0 rgba(166,139,255,0.20)",
          }}
        >
          {loading ? "Joining…" : "Enter Room"}
        </button>
      </form>
    </div>
  );
}
