import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium select-none touch-manipulation disabled:opacity-50 disabled:pointer-events-none",
        size === "sm" && "px-3 py-1.5 text-sm",
        size === "md" && "px-4 py-2.5 text-sm",
        size === "lg" && "px-5 py-3 text-base",
        variant === "primary" && "btn-primary",
        variant === "secondary" && "btn-secondary",
        variant === "ghost" &&
          "bg-white/50 text-ink shadow-sm transition active:scale-95 hover:bg-white/80",
        variant === "danger" &&
          "bg-red-700 text-white shadow-[0_6px_0_#7f1d1d] transition active:translate-y-1 active:shadow-none hover:bg-red-800",
        className,
      )}
      {...props}
    />
  );
}
