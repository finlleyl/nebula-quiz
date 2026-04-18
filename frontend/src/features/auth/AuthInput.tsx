import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/shared/lib/utils";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const AuthInput = forwardRef<HTMLInputElement, Props>(
  ({ error, className, ...props }, ref) => (
    <div>
      <input
        ref={ref}
        aria-invalid={error ? true : undefined}
        className={cn(
          "w-full rounded-[32px] bg-[#161632] px-4 py-[13px] text-[16px] text-text-primary placeholder:text-text-secondary outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-primary-500/40",
          error && "ring-2 ring-accent-error/60",
          className,
        )}
        {...props}
      />
      {error ? (
        <p role="alert" className="mt-1 pl-4 text-xs text-accent-error">
          {error}
        </p>
      ) : null}
    </div>
  ),
);
AuthInput.displayName = "AuthInput";
