import type { ParticipantSummary } from "@/shared/lib/ws/protocol";
import { EmptyPlayerSlot, PlayerCard } from "./PlayerCard";

interface PlayerSlotsProps {
  participants: ParticipantSummary[];
  /** How many grid slots to display (defaults to 8 = 4×2). */
  slots?: number;
}

export function PlayerSlots({ participants, slots = 8 }: PlayerSlotsProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {Array.from({ length: slots }, (_, i) => {
        const p = participants[i];
        return p ? (
          <PlayerCard key={p.id} participant={p} />
        ) : (
          <EmptyPlayerSlot key={`slot-${i}`} />
        );
      })}
    </div>
  );
}
