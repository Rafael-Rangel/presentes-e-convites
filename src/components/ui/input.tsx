import { cn } from "@/lib/utils";
import { InputHTMLAttributes } from "react";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-black/10 bg-white/80 px-3 py-2.5 text-sm outline-none ring-serene/30 focus:ring-2",
        className,
      )}
      {...props}
    />
  );
}
