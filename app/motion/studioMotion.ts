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
import { useEffect, useLayoutEffect } from "react";
import type { CSSProperties, RefObject } from "react";

/* N4 P-I C-09: only the impulse has a JS reader; the durations and steps live
   in the CSS presets alone, and the idle timer went with A9 (summon-only bar) */
export const STUDIO_MOTION = {
  /** sphere impulse on a slot switch, rad/s about screen x and y */
  impulse: { x: 0.9, y: 1.6 },
} as const;

/** fixed reveal order of the CC.OS graph card (E16): centre first, then clockwise */
export const CCOS_GRAPH_ORDER = ["CCOS", "WRK", "INT", "ARC", "TME", "SEC", "BIZ"] as const;
/** seconds between two graph steps */
export const CCOS_GRAPH_STEP = 0.32;

/** `--i` stagger index used by graph nodes, dots and spawn children */
export const index = (i: number) => ({ "--i": i }) as CSSProperties;

/* N4 H6: One-way reveal observer for a Studio route: marks `[data-spawn]` and
   `[data-scene]` elements with `data-seen` the first time they are on screen
   (N4 P-I: the dead `[data-reveal]` / `[data-words]` selectors are gone; no
   TSX produced either attribute), and arms the hidden start states by
   setting `data-motion="on"` on the root. Without it (reduced motion, no JS, no
   IntersectionObserver) nothing is hidden and everything is plain content.
   NAV-T4: armed in a layout effect, before the incoming page's first paint;
   armed after it, the cover painted whole for a frame, vanished, then spawned
   (the flash on a swap). */
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function useSceneReveal(rootRef: RefObject<HTMLElement | null>, reduced: boolean) {
  useIsomorphicLayoutEffect(() => {
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
      .querySelectorAll("[data-spawn], [data-scene]")
      .forEach((node) => observer.observe(node));
    root.setAttribute("data-motion", "on");
    return () => {
      observer.disconnect();
      root.removeAttribute("data-motion");
      root.querySelectorAll("[data-seen]").forEach((node) => node.removeAttribute("data-seen"));
    };
  }, [rootRef, reduced]);
}

/* N4 P-M: staged cover text on desktop. `data-stage2="true"` is set on the root
   once the page has scrolled past a threshold on the cover (40% of the cover's
   overscroll distance, or 25% of the viewport when the cover is not taller than
   the screen) and removed again on the way back up, so the second and third
   Whois / Whatis paragraphs hide again when the reader returns to the top.
   Only armed when motion is on and the viewport is >= 1024px; otherwise the
   attribute is never set and every paragraph shows. Checked once on mount (a
   restored scroll position), then on scroll and resize, one check per frame. */
export function useCoverStage(rootRef: RefObject<HTMLElement | null>, coverSelector: string, reduced: boolean) {
  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || reduced) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      if (!window.matchMedia("(min-width: 1024px)").matches) {
        root.removeAttribute("data-stage2");
        return;
      }
      const cover = root.querySelector<HTMLElement>(coverSelector);
      const dist = Math.max(0, (cover?.offsetHeight ?? 0) - window.innerHeight);
      const threshold = dist > 0 ? dist * 0.4 : window.innerHeight * 0.25;
      if (window.scrollY > threshold) root.setAttribute("data-stage2", "true");
      else root.removeAttribute("data-stage2");
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
      root.removeAttribute("data-stage2");
    };
  }, [rootRef, coverSelector, reduced]);
}
