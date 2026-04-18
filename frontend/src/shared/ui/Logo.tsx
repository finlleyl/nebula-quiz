import { cn } from "@/shared/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "bg-gradient-logo bg-clip-text font-display text-[24px] font-bold leading-8 text-transparent",
        className,
      )}
    >
      NEBULA QUIZ
    </span>
  );
}
