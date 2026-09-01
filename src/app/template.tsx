"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";

gsap.registerPlugin(useGSAP);

/** Transição suave entre páginas (fade + up). */
export default function Template({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const el = root.current;
      if (!el) return;

      if (reduce) {
        gsap.set(el, { clearProps: "all", opacity: 1 });
        return;
      }

      gsap.fromTo(
        el,
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: "power3.out",
          onComplete: () => {
            gsap.set(el, { clearProps: "transform" });
          },
        },
      );
    },
    { scope: root },
  );

  return (
    <div ref={root} className="page-transition-root">
      {children}
    </div>
  );
}
