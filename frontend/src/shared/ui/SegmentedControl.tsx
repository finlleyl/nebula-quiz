import { cn } from "@/shared/lib/utils";

interface SegmentedOption<T extends string | number> {
  value: T;
  label: string;
}

interface Props<T extends string | number> {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
}

export function SegmentedControl<T extends string | number>({
  value,
  options,
  onChange,
  disabled,
  className,
}: Props<T>) {
  return (
    <div
      role="radiogroup"
      className={cn(
        "inline-flex rounded-2xl border border-border bg-bg-input p-1",
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-pill px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-gradient-primary text-white shadow-glow-primary"
                : "text-text-secondary hover:text-text-primary",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
