import { type ComponentPropsWithoutRef, type ElementType, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aether-primary focus-visible:ring-offset-2 focus-visible:ring-offset-aether-bg disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-aether-primary text-aether-primary-fg hover:bg-aether-primary-hover",
        secondary:
          "bg-surface-2 text-aether-text border border-aether-border hover:bg-surface-3",
        ghost: "hover:bg-surface-2 text-aether-text-muted hover:text-aether-text",
        destructive:
          "bg-aether-error text-white hover:bg-aether-error/90",
      },
      size: {
        default: "h-9 px-4 py-2 text-sm",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

type ButtonProps = ComponentPropsWithoutRef<"button"> &
  VariantProps<typeof buttonVariants> & {
    as?: ElementType;
  };

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, as = "button", ...props }, ref) => {
    const Comp = as;
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

const inputVariants = cva(
  "flex h-9 w-full rounded-md border border-aether-border bg-aether-surface px-3 py-1 text-sm text-aether-text placeholder:text-aether-text-muted transition-colors duration-150 file:border-0 file:bg-transparent file:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aether-primary focus-visible:ring-offset-2 focus-visible:ring-offset-aether-bg disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "",
        error: "border-aether-error focus-visible:ring-aether-error",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

type InputProps = ComponentPropsWithoutRef<"input"> &
  VariantProps<typeof inputVariants>;

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

const cardVariants = cva(
  "rounded-lg border border-aether-border bg-aether-surface text-aether-text shadow-sm",
  {
    variants: {
      variant: {
        default: "",
        elevated: "bg-surface-2 shadow-md",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

type CardProps = ComponentPropsWithoutRef<"div"> &
  VariantProps<typeof cardVariants>;

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, className }))}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border border-transparent px-2 py-0.5 text-xs font-medium transition-colors duration-150",
  {
    variants: {
      variant: {
        default: "bg-aether-primary/10 text-aether-primary border-aether-primary/20",
        secondary:
          "bg-surface-2 text-aether-text-muted border-aether-border",
        success: "bg-aether-success/10 text-aether-success border-aether-success/20",
        warning: "bg-aether-warning/10 text-aether-warning border-aether-warning/20",
        danger: "bg-aether-error/10 text-aether-error border-aether-error/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

type BadgeProps = ComponentPropsWithoutRef<"span"> &
  VariantProps<typeof badgeVariants>;

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, className }))}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Button, Input, Card, Badge, buttonVariants, inputVariants, cardVariants, badgeVariants };
