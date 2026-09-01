"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, CSSProperties, useId, useMemo } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};

function streakVars(id: string): CSSProperties {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) % 1000;
  }
  const delay = ((h % 280) / 100).toFixed(2); // 0–2.79s
  const duration = (6.9 + (h % 140) / 100).toFixed(2); // 6.9–8.29s
  return {
    ["--btn-streak-delay" as string]: `${delay}s`,
    ["--btn-streak-duration" as string]: `${duration}s`,
  };
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  style,
  ...props
}: Props) {
  const id = useId();
  const streakStyle = useMemo(() => streakVars(id), [id]);
  const hasPresetStreak = Boolean(className?.includes("btn-streak-"));

  return (
    <button
      className={cn(
        "relative z-0 inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl font-medium select-none touch-manipulation disabled:opacity-50 disabled:pointer-events-none",
        size === "sm" && "px-3 py-1.5 text-sm",
        size === "md" && "px-4 py-2.5 text-sm",
        size === "lg" && "px-5 py-3 text-base",
        variant === "primary" && "btn-primary",
        variant === "secondary" && "btn-secondary",
        variant === "ghost" &&
          "bg-white/50 text-ink shadow-sm transition active:scale-95 hover:bg-white/80",
        variant === "danger" && "btn-danger",
        className,
      )}
      style={{ ...(hasPresetStreak ? null : streakStyle), ...style }}
      {...props}
    />
  );
}
