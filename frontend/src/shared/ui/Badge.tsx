import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-pill px-3 py-1 text-xs font-medium",
  {
    variants: {
      tone: {
        neutral: "bg-bg-elevated text-text-secondary",
        primary: "bg-primary-500/15 text-primary-400",
        cyan: "bg-accent-cyan/15 text-accent-cyan",
        amber: "bg-accent-amber/15 text-accent-amber",
        success: "bg-accent-success/15 text-accent-success",
        danger: "bg-accent-error/15 text-accent-error",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, className }))} {...props} />;
}
