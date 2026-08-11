import { cn } from "@/lib/utils";
import { TextareaHTMLAttributes } from "react";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border border-black/10 bg-white/80 px-3 py-2.5 text-sm outline-none ring-serene/30 focus:ring-2",
        className,
      )}
      {...props}
    />
  );
}
