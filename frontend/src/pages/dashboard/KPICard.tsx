import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

interface Props {
  label: string;
  value: string;
  valueClassName?: string;
  hint?: ReactNode;
  chart?: ReactNode;
  progress?: number;
}

export function KPICard({
  label,
  value,
  valueClassName,
  hint,
  chart,
  progress,
}: Props) {
  return (
    <div className="card min-h-[140px] p-5">
      <div className="flex items-start justify-between">
        <div className="text-[13px] font-medium text-text-secondary">
          {label}
        </div>
        {chart}
      </div>
      <div className="mt-2.5 flex items-baseline gap-2.5">
        <div
          className={cn(
            "font-display text-[34px] font-extrabold leading-none tracking-[-0.02em] text-text-primary",
            valueClassName,
          )}
        >
          {value}
        </div>
        {hint ? <div className="text-[13px] text-text-secondary">{hint}</div> : null}
      </div>
      {progress != null ? (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-pill bg-bg-muted">
          <div
            className="h-full bg-accent"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}
