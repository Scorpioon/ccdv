/* Studio motion grammar (R3, kept by OPUS CORR01). One place for the timing
   presets that JS needs and for the one reveal observer every Studio scene
   shares. The matching CSS presets are the `--sm-*` custom properties on
   `.r11--studio` (global.css, "STUDIO R3 OPUS CORR01"); the numbers here and
   there must agree.

   Grammar, the info-panel animation's order generalised: frame (hairlines and
   connectors draw, pathLength 1) -> block (panels rise, staggered by --i) ->
   text (the keyed Approach copy replays) -> detail (toollets, graph nodes in
   CCOS_GRAPH_ORDER) -> impulse (feedback on interaction). Nothing locks the
   viewport; scenes are reached by native scrolling. Reduced motion: nothing is
   hidden or moved, loops stop, drag still works one step per event. */
import { useEffect } from "react";
import type { CSSProperties, RefObject } from "react";

export const STUDIO_MOTION = {
  /** seconds; mirrors --sm-dur-* */
  dur: { frame: 1.1, block: 0.7, text: 0.6, art: 0.9 },
  /** extra delay (s) between grammar steps inside one scene */
  step: { block: 0.12, text: 0.24, art: 0.4 },
  /** sphere impulse on a slot switch, rad/s about screen x and y */
  impulse: { x: 0.9, y: 1.6 },
  /** seconds without a scroll before the nav bar steps aside (addendum A1) */
  navIdle: 1.5,
} as const;

/** fixed reveal order of the CC.OS graph card (E16): centre first, then clockwise */
export const CCOS_GRAPH_ORDER = ["CCOS", "WRK", "INT", "ARC", "TME", "SEC", "BIZ"] as const;
/** seconds between two graph steps */
export const CCOS_GRAPH_STEP = 0.32;

/** `--rd` reveal delay used by `[data-reveal]` and `[data-spawn]` */
export const delay = (seconds: number) => ({ "--rd": `${seconds}s` }) as CSSProperties;
/** `--i` stagger index used by graph nodes, dots and spawn children */
export const index = (i: number) => ({ "--i": i }) as CSSProperties;

/* One-way reveal observer for a Studio route: marks `[data-reveal]`,
   `[data-words]`, `[data-spawn]` and `[data-scene]` elements with `data-seen`
   the first time they are on screen, and arms the hidden start states by
   setting `data-motion="on"` on the root. Without it (reduced motion, no JS, no
   IntersectionObserver) nothing is hidden and everything is plain content. */
export function useSceneReveal(rootRef: RefObject<HTMLElement | null>, reduced: boolean) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-seen", "true");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    root
      .querySelectorAll("[data-reveal], [data-words], [data-spawn], [data-scene]")
      .forEach((node) => observer.observe(node));
    root.setAttribute("data-motion", "on");
    return () => {
      observer.disconnect();
      root.removeAttribute("data-motion");
      root.querySelectorAll("[data-seen]").forEach((node) => node.removeAttribute("data-seen"));
    };
  }, [rootRef, reduced]);
}
