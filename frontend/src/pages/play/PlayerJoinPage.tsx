import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { buildWsUrl, joinGame } from "@/features/live-game/api";
import { useLiveGame } from "@/features/live-game/store";
import { Button } from "@/shared/ui/button";
import { Logo } from "@/shared/ui/Logo";

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
      connectAsPlayer(wsUrl, res.participant_id);
      navigate(`/play/${trimCode}/lobby`);
    } catch {
      setError("Не удалось войти — проверьте код и попробуйте снова.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-page px-4">
      <div className="mb-8">
        <Logo size={36} />
      </div>

      <form onSubmit={handleJoin} className="card w-full max-w-md p-8 shadow-elev">
        <h1 className="font-display text-2xl font-extrabold">
          Войти в игру
        </h1>
        <p className="mt-1.5 text-sm text-text-secondary">
          Без регистрации. Достаточно кода от ведущего.
        </p>

        <div className="field mt-6">
          <label className="field-label">Код комнаты</label>
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="XXX-XXXX"
            maxLength={8}
            spellCheck={false}
            autoCapitalize="characters"
            className="input input-lg text-center"
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: "0.1em",
            }}
          />
        </div>

        <div className="field mt-4">
          <label className="field-label">Ник</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Как вас звать"
            maxLength={32}
            className="input"
          />
        </div>

        {error ? (
          <p className="mt-3 rounded-sm bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          size="xl"
          className="mt-6 w-full shadow-accent"
          disabled={loading || !roomCode.trim() || !nickname.trim()}
        >
          {loading ? "Входим…" : "Войти в комнату"}
        </Button>
      </form>
    </div>
  );
}
