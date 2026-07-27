import React, { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost" | "link";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      className = "",
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-bold tracking-wide transition-all rounded-xl cursor-pointer select-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed";

    const variantStyles = {
      primary:
        "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30",
      secondary:
        "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 shadow-sm",
      outline:
        "border border-[var(--border-subtle)] bg-transparent hover:bg-[var(--surface-muted)] text-[var(--text-primary)]",
      danger:
        "bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20",
      ghost:
        "bg-transparent hover:bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
      link:
        "bg-transparent text-emerald-500 hover:underline p-0 h-auto font-normal",
    };

    const sizeStyles = {
      sm: "px-3 py-1.5 text-xs gap-1.5 min-h-[32px]",
      md: "px-4 py-2 text-xs md:text-sm gap-2 min-h-[40px]",
      lg: "px-6 py-3 text-sm md:text-base gap-2.5 min-h-[48px]",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
