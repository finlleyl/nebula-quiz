import type { ParticipantSummary } from "@/shared/lib/ws/protocol";

interface PlayerCardProps {
  participant: ParticipantSummary;
}

export function PlayerCard({ participant }: PlayerCardProps) {
  const isReady = participant.status === "ready";
  const isVip = participant.status === "vip";

  return (
    <div
      className="flex flex-col items-center gap-2 rounded-2xl p-4"
      style={{ background: "#111128", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* Avatar */}
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold"
        style={{ background: "#7C4DFF", color: "#E5E3FF" }}
      >
        {participant.nickname.charAt(0).toUpperCase()}
      </div>

      {/* Nickname */}
      <span
        className="max-w-full truncate text-sm font-semibold"
        style={{ color: "#E5E3FF" }}
        title={participant.nickname}
      >
        {participant.nickname}
      </span>

      {/* Status badge */}
      {(isReady || isVip) && (
        <span
          className="rounded-full px-2 py-0.5 text-xs font-semibold"
          style={
            isVip
              ? { background: "rgba(251,146,60,0.15)", color: "#FB923C" }
              : { background: "rgba(52,211,153,0.15)", color: "#34D399" }
          }
        >
          {isVip ? "VIP" : "Ready"}
        </span>
      )}
    </div>
  );
}

/** Dashed empty slot shown in the lobby grid. */
export function EmptyPlayerSlot() {
  return (
    <div
      className="flex h-full min-h-[100px] flex-col items-center justify-center rounded-2xl"
      style={{
        border: "2px dashed rgba(255,255,255,0.08)",
        color: "#5C5E85",
      }}
    >
      <span className="text-2xl">+</span>
    </div>
  );
}
