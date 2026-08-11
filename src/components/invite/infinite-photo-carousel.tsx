"use client";

import { cn } from "@/lib/utils";

type Props = {
  photos: string[];
  direction?: "left" | "right";
  className?: string;
  imageClassName?: string;
};

export function InfinitePhotoCarousel({
  photos,
  direction = "left",
  className,
  imageClassName,
}: Props) {
  if (!photos.length) return null;
  const loop = [...photos, ...photos];

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div
        className={cn(
          "flex w-max gap-2",
          direction === "left" ? "animate-marquee-left" : "animate-marquee-right",
        )}
      >
        {loop.map((src, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${src}-${index}`}
            src={src}
            alt=""
            loading="lazy"
            decoding="async"
            className={cn(
              "h-28 w-20 shrink-0 rounded-2xl object-cover sm:h-32 sm:w-24",
              imageClassName,
            )}
          />
        ))}
      </div>
    </div>
  );
}
