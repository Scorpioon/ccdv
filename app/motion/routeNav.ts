/* Thin-masthead behaviour for a scene route other than Studio (Services R1).
   The same two mechanisms studio.tsx runs inline (R3 addenda A1/A3/A4),
   written once as hooks so Services does not copy Studio's route code; Studio
   itself still uses its own inline effects (unchanged).

   useBoundaryNav  --nav-in = clamp((navH - edgeTop) / navH) on the root: the
                   bar's lower edge rides the top edge of the given section, so
                   the bar is hidden over everything above it.
   useNavIdle      `data-nav-idle` on the root after STUDIO_MOTION.navIdle
                   (1.0 s) without a scroll, cleared by the next scroll; the CSS
                   slides the bar away (0.30 s) and back (0.22 s). */
import { useEffect, useLayoutEffect } from "react";
import type { RefObject } from "react";
import { STUDIO_MOTION } from "./studioMotion";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
const NAV_IDLE_MIN_SCROLL = 50; // px: the M1 bar's height; nearer the top the bar stays

export function useBoundaryNav(
  rootRef: RefObject<HTMLElement | null>,
  edgeRef: RefObject<HTMLElement | null>,
  navSelector: string,
) {
  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    const edge = edgeRef.current;
    const nav = root?.querySelector<HTMLElement>(navSelector);
    if (!root || !edge || !nav) return;
    let frame = 0;
    let last = "";
    const update = () => {
      frame = 0;
      const navH = nav.offsetHeight;
      const top = edge.getBoundingClientRect().top;
      /* navH is 0 on phones, where the bar is not rendered */
      const p = navH > 0 ? clamp01((navH - top) / navH).toFixed(4) : "1";
      if (p !== last) {
        last = p;
        root.style.setProperty("--nav-in", p);
      }
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
      root.style.removeProperty("--nav-in");
    };
  }, [rootRef, edgeRef, navSelector]);
}

export function useNavIdle(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let timer = 0;
    const settle = () => {
      timer = 0;
      if (window.scrollY > NAV_IDLE_MIN_SCROLL) root.setAttribute("data-nav-idle", "");
    };
    const onScroll = () => {
      if (root.hasAttribute("data-nav-idle")) root.removeAttribute("data-nav-idle");
      window.clearTimeout(timer);
      timer = window.setTimeout(settle, STUDIO_MOTION.navIdle * 1000);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(timer);
      root.removeAttribute("data-nav-idle");
    };
  }, [rootRef]);
}
