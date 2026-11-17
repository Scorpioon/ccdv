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

/* NAV-T3 (OPERATOR): `leadSelector` names an element whose LOWER edge reveals
   the bar first (the cover lockup): the bar appears once the lockup has
   scrolled past, or when the section edge arrives, whichever comes first. */
export function useBoundaryNav(
  rootRef: RefObject<HTMLElement | null>,
  edgeRef: RefObject<HTMLElement | null>,
  navSelector: string,
  leadSelector?: string,
) {
  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    const edge = edgeRef.current;
    const nav = root?.querySelector<HTMLElement>(navSelector);
    if (!root || !edge || !nav) return;
    const lead = leadSelector ? root.querySelector<HTMLElement>(leadSelector) : null;
    let frame = 0;
    let last = "";
    const update = () => {
      frame = 0;
      const navH = nav.offsetHeight;
      const edgeTop = edge.getBoundingClientRect().top;
      const top = lead ? Math.min(edgeTop, lead.getBoundingClientRect().bottom) : edgeTop;
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
  }, [rootRef, edgeRef, navSelector, leadSelector]);
}

/* PIN-T1 (OPERATOR): a pinned scene module sticks with its top at
   min(0, screen height - its own height), written as --pin-top. One screen
   tall or less, it pins at the top; taller (a long Service Index category), it
   is read to its end first and pins by its bottom, so nothing is cut. Only
   the CSS at >= 1024px reads the property. Re-measured on resize and when
   the module changes size. */
/* FLOW-T1 (OPERATOR): what a curtain fully covers is marked `data-covered` —
   the pinned module once the next section's top has reached the top of the
   screen, and the cover (the curtain's first child) once the module has. The
   CSS stops painting it (visibility) and useVisibleLoop (studio/artworks)
   pauses any animation inside it; both resume when it is uncovered. */
const coverListeners = new Set<() => void>();
export function onCoverChange(listener: () => void) {
  coverListeners.add(listener);
  return () => {
    coverListeners.delete(listener);
  };
}

export function usePinTop(ref: RefObject<HTMLElement | null>, nextRef?: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const next = nextRef?.current ?? null;
    const first = node.parentElement?.firstElementChild;
    const cover = first instanceof HTMLElement && first !== node ? first : null;
    let last = "";
    let frame = 0;
    const measure = () => {
      const top = `${Math.min(0, window.innerHeight - node.offsetHeight)}px`;
      if (top !== last) {
        last = top;
        node.style.setProperty("--pin-top", top);
      }
    };
    const mark = (el: HTMLElement | null, covered: boolean) => {
      if (!el || el.hasAttribute("data-covered") === covered) return false;
      el.toggleAttribute("data-covered", covered);
      return true;
    };
    const check = () => {
      frame = 0;
      const moduleCovered = !!next && next.getBoundingClientRect().top <= 0;
      const coverCovered = node.getBoundingClientRect().top <= 0;
      const changed = [mark(node, moduleCovered), mark(cover, coverCovered)].some(Boolean);
      if (changed) coverListeners.forEach((listener) => listener());
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            measure();
            schedule();
          })
        : null;
    observer?.observe(node);
    measure();
    check();
    const onResize = () => {
      measure();
      schedule();
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", schedule);
      if (frame) cancelAnimationFrame(frame);
      node.style.removeProperty("--pin-top");
      const changed = [mark(node, false), mark(cover, false)].some(Boolean);
      if (changed) coverListeners.forEach((listener) => listener());
    };
  }, [ref, nextRef]);
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
