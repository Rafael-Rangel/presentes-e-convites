"use client";

import { cn } from "@/lib/utils";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, useState } from "react";

gsap.registerPlugin(useGSAP);

type Props = {
  photos: string[];
  direction?: "left" | "right";
  className?: string;
  imageClassName?: string;
  staggerDelay?: number;
};

export function InfinitePhotoCarousel({
  photos,
  direction = "left",
  className,
  imageClassName,
  staggerDelay = 0,
}: Props) {
  const root = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const images = root.current?.querySelectorAll<HTMLElement>(".carousel-photo");
      if (!images?.length) {
        setReady(true);
        return;
      }

      if (reduce) {
        gsap.set(images, { clearProps: "all", opacity: 1 });
        setReady(true);
        return;
      }

      // Anima só a primeira volta das fotos (evita duplicar o stagger no loop)
      const firstPass = Array.from(images).slice(0, photos.length);

      gsap.set(images, { opacity: 0, y: 56, scale: 0.82, rotate: 4 });

      const tl = gsap.timeline({
        delay: staggerDelay,
        defaults: { ease: "power3.out" },
        onComplete: () => setReady(true),
      });

      tl.to(firstPass, {
        opacity: 1,
        y: 0,
        scale: 1,
        rotate: 0,
        duration: 1.15,
        stagger: {
          each: 0.22,
          from: "start",
        },
      }).to(
        Array.from(images).slice(photos.length),
        { opacity: 1, y: 0, scale: 1, rotate: 0, duration: 0.01 },
        "-=0.2",
      );
    },
    { scope: root, dependencies: [photos.length, staggerDelay] },
  );

  if (!photos.length) return null;
  const loop = [...photos, ...photos];

  return (
    <div
      ref={root}
      className={cn("carousel-edge-fade relative overflow-hidden", className)}
    >
      <div
        className={cn(
          "flex w-max gap-2.5 will-change-transform",
          ready &&
            (direction === "left" ? "animate-marquee-left" : "animate-marquee-right"),
        )}
      >
        {loop.map((src, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${src}-${index}`}
            src={src}
            alt=""
            loading={index < photos.length ? "eager" : "lazy"}
            decoding="async"
            className={cn(
              "carousel-photo h-28 w-20 shrink-0 rounded-2xl object-cover shadow-[0_10px_24px_rgba(42,36,32,0.28)] sm:h-32 sm:w-24",
              imageClassName,
            )}
          />
        ))}
      </div>
    </div>
  );
}
