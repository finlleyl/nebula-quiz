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
      className={cn("inline-flex rounded-md bg-bg-muted p-1", className)}
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
              "rounded-[8px] px-4 py-2 text-sm font-semibold transition-colors",
              active
                ? "bg-bg-surface text-text-primary shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
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
