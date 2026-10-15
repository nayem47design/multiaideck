"use client";

import { useFormatter } from "next-intl";
import { useEffect, useState } from "react";

/** Whole seconds left until `until` (epoch ms), ticking every second; 0 when past or unset. */
export function useCountdown(until: number | null) {
  // Read the clock only on the client, after the first render (prerendering must not see it).
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!until) return;
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(() => {
      tick();
      if (Date.now() >= until) clearInterval(id);
    }, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [until]);
  return until && now ? Math.max(0, Math.ceil((until - now) / 1000)) : 0;
}

/** 75 → "1:15", 4000 → "1:06:40", in the page's digits. */
export function useClock() {
  const format = useFormatter();
  return (seconds: number) => {
    const two = (v: number) => format.number(v, { minimumIntegerDigits: 2 });
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h
      ? `${format.number(h)}:${two(m)}:${two(s)}`
      : `${format.number(m)}:${two(s)}`;
  };
}
