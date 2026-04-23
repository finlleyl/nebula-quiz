import { cn } from "@/shared/lib/utils";

export function Logo({
  className,
  withWordmark = true,
  size = 28,
}: {
  className?: string;
  withWordmark?: boolean;
  size?: number;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-[10px]", className)}
      style={{ lineHeight: 1 }}
    >
      <span
        className="grid place-items-center font-display font-extrabold text-white"
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.28,
          fontSize: size * 0.5,
          background: "linear-gradient(135deg, #0077FF, #1E90FF 60%, #5EB0FF)",
          boxShadow: "0 2px 8px rgba(0,119,255,0.35)",
        }}
      >
        К
      </span>
      {withWordmark && (
        <span className="font-display text-[16px] font-extrabold tracking-[-0.02em] text-text-primary">
          Квиз.Лайв
        </span>
      )}
    </span>
  );
}
