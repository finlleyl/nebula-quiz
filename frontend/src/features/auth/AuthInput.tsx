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
          "input",
          error && "!border-danger focus:!border-danger focus:!ring-danger/20",
          className,
        )}
        {...props}
      />
      {error ? (
        <p role="alert" className="mt-1 pl-1 text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  ),
);
AuthInput.displayName = "AuthInput";
