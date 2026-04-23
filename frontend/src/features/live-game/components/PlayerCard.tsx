import { Plus } from "lucide-react";

import { Avatar } from "@/shared/ui/Avatar";
import type { ParticipantSummary } from "@/shared/lib/ws/protocol";

interface PlayerCardProps {
  participant: ParticipantSummary;
}

export function PlayerCard({ participant }: PlayerCardProps) {
  const isReady = participant.status === "ready";
  const isVip = participant.status === "vip";

  return (
    <div className="card relative flex flex-col items-center gap-2 p-[14px]">
      {isVip ? (
        <span className="absolute -right-[6px] -top-[6px] rounded-pill bg-gold px-[7px] py-[2px] text-[10px] font-extrabold text-white">
          VIP
        </span>
      ) : null}
      <Avatar name={participant.nickname} size={48} />
      <span
        className="max-w-full truncate text-[13px] font-semibold"
        title={participant.nickname}
      >
        {participant.nickname}
      </span>
      <span
        className={
          isReady
            ? "chip chip-success px-2 py-[2px] text-[11px]"
            : "chip px-2 py-[2px] text-[11px]"
        }
      >
        {isReady ? "Готов" : "Входит…"}
      </span>
    </div>
  );
}

export function EmptyPlayerSlot() {
  return (
    <div className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-md border-[1.5px] border-dashed border-border-strong p-[14px] text-text-tertiary">
      <div className="grid size-12 place-items-center rounded-full bg-bg-muted">
        <Plus className="size-5" />
      </div>
      <div className="text-[13px]">Ждём…</div>
      <div className="text-[11px]">—</div>
    </div>
  );
}
