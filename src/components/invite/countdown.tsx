"use client";

import { useEffect, useState } from "react";

export function Countdown({ date }: { date: string | null }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!date) return null;

  const target = new Date(`${date}T00:00:00`).getTime();
  const diff = now === null ? 0 : Math.max(0, target - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  const items = [
    { label: "dias", value: days },
    { label: "hrs", value: hours },
    { label: "min", value: minutes },
    { label: "seg", value: seconds },
  ];

  return (
    <div className="grid grid-cols-4 gap-2" suppressHydrationWarning>
      {items.map((item) => (
        <div
          key={item.label}
          className="a-count rounded-2xl bg-white/15 px-1.5 py-3 text-center backdrop-blur-md"
        >
          <p className="font-display text-2xl text-white sm:text-3xl">
            {now === null ? "..." : item.value}
          </p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/80">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}
