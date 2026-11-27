import { useEffect, useRef } from "react";
import type { CSSProperties, RefObject } from "react";
import { MOTION } from "./tokens";

/* R3 S7: one swipe for the phone card rails (Studio Build, Services Work with).
   The rail is a controlled carousel, not a scroller: `index` lives in state, the
   track is moved by CSS (`translate`, global.css) from two custom properties on
   the viewport, and this hook is the finger.

     ref    the viewport element (the element that clips the track)
     style  `--i` (the current card); spread it on the same element

   The hook writes `--drag` (px) imperatively while a finger is down, so a drag
   never re-renders the rail and its figures, and sets `data-dragging` on the
   viewport so the css can drop the transition while the track follows the
   finger.

   Gesture: after 8px the axis locks. Horizontal when |dx| > 1.2 |dy|: the page
   is held (non-passive touchmove, preventDefault) and the track follows with a
   0.35 resistance past either end. Anything else is released to the page's own
   vertical scroll and this gesture is ignored. On release, a horizontal drag
   longer than MOTION.swipe moves one card. Under reduced motion the track does
   not follow the finger; the card changes on release. Mouse drag uses pointer
   events; touch uses touch events. Inert from 1024px up, where the rail is a
   plain row of cards. */

const LOCK_PX = 8;
const AXIS_BIAS = 1.2;
const END_RESISTANCE = 0.35;

interface RailSwipeOptions {
  count: number;
  index: number;
  setIndex: (next: number) => void;
  reduced: boolean;
}

export function useRailSwipe({ count, index, setIndex, reduced }: RailSwipeOptions): {
  ref: RefObject<HTMLDivElement | null>;
  style: CSSProperties;
} {
  const ref = useRef<HTMLDivElement>(null);
  const latest = useRef({ count, index, setIndex, reduced });
  latest.current = { count, index, setIndex, reduced };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let x0 = 0;
    let y0 = 0;
    let dx = 0;
    let axis: "x" | "y" | null = null;
    let active = false;

    const narrow = () => !window.matchMedia("(min-width: 1024px)").matches;
    const setDrag = (value: number) => el.style.setProperty("--drag", `${value}px`);
    const begin = (x: number, y: number) => {
      if (!narrow()) return;
      active = true;
      axis = null;
      x0 = x;
      y0 = y;
      dx = 0;
    };
    const move = (x: number, y: number, event: Event) => {
      if (!active) return;
      const mx = x - x0;
      const my = y - y0;
      if (axis === null) {
        if (Math.max(Math.abs(mx), Math.abs(my)) < LOCK_PX) return;
        axis = Math.abs(mx) > Math.abs(my) * AXIS_BIAS ? "x" : "y";
        if (axis === "y") {
          active = false;
          return;
        }
        el.setAttribute("data-dragging", "");
      }
      if (event.cancelable) event.preventDefault();
      dx = mx;
      const { count: n, index: i, reduced: still } = latest.current;
      const atEnd = (i <= 0 && mx > 0) || (i >= n - 1 && mx < 0);
      if (!still) setDrag(atEnd ? mx * END_RESISTANCE : mx);
    };
    const end = () => {
      if (!active && axis !== "x") return;
      const wasX = axis === "x";
      active = false;
      axis = null;
      el.removeAttribute("data-dragging");
      setDrag(0);
      if (!wasX) return;
      if (Math.abs(dx) > MOTION.swipe) {
        const { count: n, index: i, setIndex: set } = latest.current;
        set(Math.min(n - 1, Math.max(0, i + (dx < 0 ? 1 : -1))));
      }
    };

    const onTouchStart = (event: TouchEvent) => {
      const t = event.touches[0];
      if (t && event.touches.length === 1) begin(t.clientX, t.clientY);
    };
    const onTouchMove = (event: TouchEvent) => {
      const t = event.touches[0];
      if (t) move(t.clientX, t.clientY, event);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      begin(event.clientX, event.clientY);
      if (active) el.setPointerCapture?.(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "mouse") move(event.clientX, event.clientY, event);
    };
    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType === "mouse") end();
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", end);
    el.addEventListener("touchcancel", end);
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", end);
      el.removeEventListener("touchcancel", end);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
      el.removeAttribute("data-dragging");
      el.style.removeProperty("--drag");
    };
  }, []);

  return { ref, style: { "--i": index } as CSSProperties };
}
