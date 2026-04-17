import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-primary text-white shadow-glow-primary hover:brightness-110 active:brightness-95",
        outline:
          "border border-primary-500 bg-transparent text-primary-400 hover:bg-primary-500/10",
        secondary:
          "bg-bg-card text-text-primary border border-border hover:bg-bg-elevated",
        ghost:
          "bg-transparent text-text-secondary hover:bg-bg-card hover:text-text-primary",
        link: "bg-transparent text-primary-400 underline-offset-4 hover:underline",
        destructive:
          "bg-accent-error text-white hover:brightness-110",
      },
      size: {
        sm: "h-9 px-4 text-sm rounded-pill",
        md: "h-11 px-6 text-base rounded-pill",
        lg: "h-14 px-8 text-lg rounded-pill",
        icon: "h-11 w-11 rounded-pill",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
