import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

interface Props {
  label: string;
  value: string;
  valueClassName?: string;
  hint?: ReactNode;
  progress?: number; // 0..100, shows amber bar if set
}

export function KPICard({
  label,
  value,
  valueClassName,
  hint,
  progress,
}: Props) {
  return (
    <div className="rounded-3xl border border-border-subtle bg-bg-card/60 p-6 backdrop-blur-sm">
      <p className="text-sm font-medium uppercase tracking-wider text-text-muted">
        {label}
      </p>
      <p
        className={cn(
          "mt-3 font-display text-[48px] font-bold leading-none text-text-primary",
          valueClassName,
        )}
      >
        {value}
      </p>
      {hint ? <div className="mt-3 text-sm text-text-secondary">{hint}</div> : null}
      {progress != null ? (
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-pill bg-bg-input">
          <div
            className="h-full bg-accent-amber"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}
