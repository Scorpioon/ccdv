import { useEffect, useRef } from "react";
import type { RefObject } from "react";

/* N3 W-A1 (OPERATOR: "navigation like /products/ccos — arrow controlled"):
   the Work workspace pages like the CC.OS deck (components/ccos/CcosDeck.tsx,
   whose input rules and timing this repeats; CC.OS itself is not touched):
   one gesture, one move.
     Featured  -- down -->  Archive  -- in (right) -->  case
     Featured  <-- up ---  Archive  <-- out (left) --  case
   Wheel / trackpad: 50 of travel, then the rest of the gesture is swallowed
   until 180 ms of quiet. Keys: ArrowDown / PageDown / Space down, ArrowUp /
   PageUp / Shift+Space up, ArrowRight into the selected row's case,
   ArrowLeft out of a case. A 48 px swipe pages up or down. An area that can
   still scroll that way (`data-deck-scroll`: a tall archive, a case) scrolls
   first; a case never pages up or down, its own content scrolls. After a move
   input is held for the move (MOVE_MS; 0 under reduced motion). N4 P-L: a
   vertical wheel over the Featured mosaic (`data-deck-hscroll`, a horizontal
   strip) scrolls it sideways first; the deck moves only once the strip is at
   its end (down) or start (up). Desktop (>= 1024) only: phones scroll natively. */

export type WorkView = "featured" | "archive" | "case";
export type WorkMove = "down" | "up" | "in" | "out";

export const MOVE_MS = 800;
const WHEEL_STEP = 50;
const WHEEL_QUIET_MS = 180;
const SWIPE_PX = 48;
const COAST_MS = 120;

/* can the nearest `data-deck-scroll` area still scroll that way? */
function scrollsFurther(target: EventTarget | null, dir: number) {
  const area = target instanceof Element ? target.closest<HTMLElement>("[data-deck-scroll]") : null;
  if (!area || area.scrollHeight <= area.clientHeight + 1) return false;
  if (!/(auto|scroll)/.test(getComputedStyle(area).overflowY)) return false;
  return dir > 0 ? area.scrollTop + area.clientHeight < area.scrollHeight - 1 : area.scrollTop > 0;
}

/* N4 P-L: the nearest `data-deck-hscroll` strip (the Featured mosaic), when it can still scroll that way */
function hScrollArea(target: EventTarget | null, dir: number) {
  const strip = target instanceof Element ? target.closest<HTMLElement>("[data-deck-hscroll]") : null;
  if (!strip || strip.scrollWidth <= strip.clientWidth + 1) return null;
  if (!/(auto|scroll)/.test(getComputedStyle(strip).overflowX)) return null;
  const more = dir > 0 ? strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 1 : strip.scrollLeft > 1;
  return more ? strip : null;
}

export function useWorkDeck({
  rootRef,
  enabled,
  reduced,
  view,
  move,
}: {
  rootRef: RefObject<HTMLElement | null>;
  enabled: boolean;
  reduced: boolean;
  view: WorkView;
  /** perform a move; false when it is not possible from here */
  move: (to: WorkMove) => boolean;
}) {
  const lockedUntil = useRef(0);
  const wheel = useRef({ sum: 0, last: 0, tail: false });
  const scrolledAt = useRef(0);
  const viewRef = useRef(view);
  const moveRef = useRef(move);
  moveRef.current = move;

  /* every view change (input, a link, Back / Forward) holds input for the move */
  useEffect(() => {
    if (viewRef.current !== view) lockedUntil.current = performance.now() + (reduced ? 0 : MOVE_MS);
    viewRef.current = view;
  }, [view, reduced]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !enabled) return;

    const vertical = (dir: number) => {
      const current = viewRef.current;
      if (current === "case") return false;
      if (dir > 0 && current === "featured") return moveRef.current("down");
      if (dir < 0 && current === "archive") return moveRef.current("up");
      return false;
    };

    const onWheel = (event: WheelEvent) => {
      const now = performance.now();
      const state = wheel.current;
      const quiet = now - state.last;
      state.last = now;
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      const dir = event.deltaY > 0 ? 1 : -1;
      if (viewRef.current === "case" || scrollsFurther(event.target, dir)) {
        state.sum = 0;
        return;
      }
      /* N4 P-L: the Featured mosaic takes the vertical wheel sideways first (passive: no preventDefault) */
      const strip = hScrollArea(event.target, dir);
      if (strip) {
        state.sum = 0;
        state.tail = true; // the gesture that reaches the strip's end needs a pause before it moves the deck
        strip.scrollLeft += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? strip.clientWidth : 1);
        return;
      }
      if (now < lockedUntil.current) return;
      if (state.tail && quiet < WHEEL_QUIET_MS) return;
      state.tail = false;
      state.sum += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1);
      if (Math.abs(state.sum) < WHEEL_STEP) return;
      state.sum = 0;
      if (vertical(dir)) state.tail = true;
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      let dir = 0;
      switch (event.key) {
        case "ArrowDown":
        case "PageDown":
          dir = 1;
          break;
        case "ArrowUp":
        case "PageUp":
          dir = -1;
          break;
        case " ":
          if (target?.closest("button, a, summary")) return;
          dir = event.shiftKey ? -1 : 1;
          break;
        case "ArrowRight":
          if (viewRef.current !== "archive" || performance.now() < lockedUntil.current) return;
          if (moveRef.current("in")) event.preventDefault();
          return;
        case "ArrowLeft":
          if (viewRef.current !== "case" || performance.now() < lockedUntil.current) return;
          if (moveRef.current("out")) event.preventDefault();
          return;
        default:
          return;
      }
      if (viewRef.current === "case" || scrollsFurther(target, dir)) return;
      event.preventDefault();
      if (performance.now() < lockedUntil.current) return;
      vertical(dir);
    };

    const onScroll = () => {
      scrolledAt.current = performance.now();
    };

    let touch: { y: number; t: number; up: boolean; down: boolean } | null = null;
    const onTouchStart = (event: TouchEvent) => {
      const t = event.touches[0];
      touch = t
        ? { y: t.clientY, t: performance.now(), up: scrollsFurther(event.target, -1), down: scrollsFurther(event.target, 1) }
        : null;
    };
    const onTouchEnd = (event: TouchEvent) => {
      const start = touch;
      const t = event.changedTouches[0];
      touch = null;
      if (!start || !t) return;
      const dy = start.y - t.clientY;
      if (Math.abs(dy) < SWIPE_PX) return;
      const dir = dy > 0 ? 1 : -1;
      if (dir > 0 ? start.down : start.up) return;
      if (scrolledAt.current >= start.t - COAST_MS) return;
      if (performance.now() < lockedUntil.current) return;
      vertical(dir);
    };

    root.addEventListener("wheel", onWheel, { passive: true });
    root.addEventListener("scroll", onScroll, { passive: true, capture: true });
    root.addEventListener("touchstart", onTouchStart, { passive: true });
    root.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      root.removeEventListener("wheel", onWheel);
      root.removeEventListener("scroll", onScroll, { capture: true });
      root.removeEventListener("touchstart", onTouchStart);
      root.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
    };
  }, [rootRef, enabled]);
}
