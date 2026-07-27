import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "warning" | "danger" | "info" | "neutral";
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
}

export function Badge({
  children,
  variant = "success",
  size = "md",
  dot = false,
  className = "",
}: BadgeProps) {
  const variantStyles = {
    success:
      "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 border",
    warning:
      "bg-amber-500/10 border-amber-500/20 text-amber-400 border",
    danger:
      "bg-rose-500/10 border-rose-500/20 text-rose-400 border",
    info:
      "bg-blue-500/10 border-blue-500/20 text-blue-400 border",
    neutral:
      "bg-slate-800 border-slate-700 text-slate-300 border",
  };

  const dotColors = {
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
    info: "bg-blue-500",
    neutral: "bg-slate-400",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[9px]",
    md: "px-2.5 py-1 text-[10px]",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-mono font-bold tracking-wider uppercase ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} shrink-0`}
        />
      )}
      <span>{children}</span>
    </span>
  );
}

export default Badge;
