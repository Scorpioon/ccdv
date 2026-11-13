/* The column spread of a fitted scene frame (Services R1 CORR01 round 3).

   On desktop a scene frame is 1440u wide and centred (the fit); its left
   column is moved left and its right column right by --gx, the ground beside
   the frame (global.css, "spread"), so the columns reach the screen margins.
   A drawing that joins both columns (Studio's Build / CC.OS connectors, the
   Formation tether) needs that same spread in its own units:

     useFrameSpread(ref, units)  g = max(0, (shell - frame) / 2) * units / frame,
                                 where `ref` is an element exactly as wide as
                                 the frame and `units` its width in viewBox
                                 units; 0 below 1024px and before the first
                                 measure (SSR renders the unspread drawing). */
import { useEffect, useState } from "react";
import type { RefObject } from "react";

export function useFrameSpread(ref: RefObject<Element | null>, units: number) {
  const [spread, setSpread] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const shell = el.closest(".site-shell") ?? document.documentElement;
    const wide = window.matchMedia("(min-width: 1024px)");
    const measure = () => {
      const frame = el.getBoundingClientRect().width;
      const ground = shell.getBoundingClientRect().width - frame;
      const g = wide.matches && frame > 0 ? (Math.max(0, ground / 2) * units) / frame : 0;
      setSpread(Math.round(g * 100) / 100);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    observer.observe(shell);
    wide.addEventListener("change", measure);
    return () => {
      observer.disconnect();
      wide.removeEventListener("change", measure);
    };
  }, [ref, units]);
  return spread;
}
