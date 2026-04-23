import { cn } from "@/shared/lib/utils";

interface AvatarProps {
  name?: string;
  size?: 24 | 32 | 40 | 48 | 64 | 96;
  color?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  ring?: boolean;
  className?: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((p) => p[0]).join("").toUpperCase() || "?";
}

function colorForName(name: string): 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return ((hash % 8) + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
}

export function Avatar({
  name = "?",
  size = 40,
  color,
  ring = false,
  className,
}: AvatarProps) {
  const c = color ?? colorForName(name);
  return (
    <div
      className={cn(`avatar sz-${size} av-${c}`, className)}
      style={
        ring
          ? { boxShadow: "0 0 0 3px #fff, 0 0 0 5px var(--accent)" }
          : undefined
      }
    >
      {initials(name)}
    </div>
  );
}
