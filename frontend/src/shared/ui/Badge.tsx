import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/utils";

const badgeVariants = cva("chip", {
  variants: {
    tone: {
      neutral: "",
      primary: "chip-accent",
      accent:  "chip-accent",
      cyan:    "chip-accent",
      amber:   "chip-warn",
      success: "chip-success",
      danger:  "chip-danger",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
