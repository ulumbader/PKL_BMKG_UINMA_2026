import type { ButtonHTMLAttributes, HTMLAttributes } from "react";

const buttonVariants = {
  primary: "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "border-border bg-surface text-foreground hover:bg-background",
  danger: "border-transparent bg-danger text-white hover:bg-danger/90",
  ghost: "border-transparent bg-transparent text-foreground hover:bg-surface",
};

const buttonSizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
};

export function Button({
  className = "",
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center rounded-control border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:pointer-events-none disabled:opacity-50",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={[
        "rounded-card border border-border bg-surface p-5 text-foreground",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

const alertVariants = {
  info: "border-border bg-surface text-foreground",
  success: "border-primary/30 bg-success-subtle text-primary",
  warning: "border-wait/30 bg-warning-subtle text-wait",
  error: "border-danger/30 bg-danger-subtle text-danger",
};

type AlertProps = HTMLAttributes<HTMLDivElement> & {
  variant?: keyof typeof alertVariants;
};

export function Alert({ className = "", role, variant = "info", ...props }: AlertProps) {
  return (
    <div
      role={role ?? (variant === "error" ? "alert" : "status")}
      className={[
        "rounded-control border px-4 py-3 text-sm leading-6",
        alertVariants[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

type SpinnerProps = HTMLAttributes<HTMLSpanElement> & {
  label?: string;
};

export function Spinner({ className = "", label = "Memuat", ...props }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={[
        "inline-block size-5 animate-spin rounded-full border-2 border-border border-t-primary",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

export function Skeleton({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={["animate-pulse rounded-control bg-muted/15", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
