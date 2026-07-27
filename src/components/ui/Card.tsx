import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "bordered" | "glass";
  hoverable?: boolean;
}

export function Card({
  children,
  variant = "default",
  hoverable = false,
  className = "",
  ...props
}: CardProps) {
  const baseStyles = "rounded-2xl transition-all duration-200";

  const variantStyles = {
    default: "bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-sm",
    elevated: "bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-xl",
    bordered: "bg-[var(--surface-card)] border-2 border-[var(--border-subtle)]",
    glass: "bg-slate-900/80 backdrop-blur-md border border-slate-800 text-white shadow-2xl",
  };

  const hoverStyles = hoverable
    ? "hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
    : "";

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode; className?: string }) {
  return (
    <div className={`p-5 pb-3 border-b border-[var(--border-subtle)] ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & { children?: React.ReactNode; className?: string }) {
  return (
    <h3 className={`text-lg font-black uppercase tracking-tight text-[var(--text-primary)] ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & { children?: React.ReactNode; className?: string }) {
  return (
    <p className={`text-xs text-[var(--text-secondary)] mt-1 ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode; className?: string }) {
  return (
    <div className={`p-5 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode; className?: string }) {
  return (
    <div className={`p-5 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between ${className}`} {...props}>
      {children}
    </div>
  );
}
