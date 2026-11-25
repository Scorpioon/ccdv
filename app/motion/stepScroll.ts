/* A3 (OPERATOR): one gesture, one rise. On a desktop scene page the window
   never rests between two modules: a wheel gesture, Space / Page / arrow key
   plays one eased scroll (STEP_S) to the next stop, and the rest of that
   gesture (trackpad momentum) is swallowed. Replaces the CSS snap (PIN-T1
   proximity, then A2 mandatory), which either left the page half-way or
   jumped at once.

   Stops: the page top, the page end (footer) and every element matching
   `stopSelector` (the in-flow markers, `.pin-snap`, and second scenes).
   Between stop i and stop i + 1 the last screen is the rise; anything before
   it is a free range (a module taller than the screen), paged one screen per
   move until the module's end shows. Rest points are therefore a stop, the end
   of its free range and the screens between. A3.1: the wheel never scrolls
   the page natively — native scrolling (Chrome eases it over ~150 ms) raced
   the step and the settle, and positions jumped.

   Left native: phones and tablets (< 1024px), touch, Ctrl + wheel (zoom),
   sideways wheels, a wheel over an inner area that can still scroll, keys in
   a form field, and a page that is fading out. A scroll that ends between two
   rest points by other means (scrollbar, focus, restored offset) glides to
   the nearer one. Reduced motion: the same steps, instant.

   N4 P-K C: a step takes STEP_S for up to one screen and scales with the
   distance beyond that, capped at STEP_MAX_S (the Products cover rise, about
   1.67 screens, takes about 1.17 s). */
import { useEffect, useRef } from "react";
import type { RefObject } from "react";

const DESKTOP = "(min-width: 1024px)";
const STEP_S = 0.7;
const STEP_MAX_S = 1.2; // N4 P-K C: a long rise (Products cover, ≈1.67 screens → ≈1.17 s) is scaled up to this
const QUIET_MS = 180; // wheel silence that ends a gesture
const SETTLE_MS = 150; // scroll silence before a stray offset is settled
const EDGE = 2; // px tolerance on a rest point

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

type Segment = { start: number; end: number; next: number | null };

function scrollsInside(target: EventTarget | null, deltaY: number, root: HTMLElement) {
  let el = target instanceof Element ? target : null;
  while (el && el !== root && el !== document.body) {
    if (el instanceof HTMLElement && el.scrollHeight > el.clientHeight + 1) {
      const { overflowY } = getComputedStyle(el);
      if (overflowY === "auto" || overflowY === "scroll") {
        if (deltaY > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1) return true;
        if (deltaY < 0 && el.scrollTop > 0) return true;
      }
    }
    el = el.parentElement;
  }
  return false;
}

/* A4: `coverPages: false` plays the first segment (the cover) as one rise
   straight into the next stop, without paging its overflow (Products: the
   cover's lower half carries nothing to read). A10 (OPERATOR; was A6.1's
   `onArrive`, told on landing): `onStep` is told when a step BEGINS, with its
   direction and duration (0 under reduced motion), so Products can move its
   cube during the scroll. */
export function useStepScroll(
  rootRef: RefObject<HTMLElement | null>,
  stopSelector: string | null,
  reduced: boolean,
  {
    coverPages = true,
    onStep,
  }: { coverPages?: boolean; onStep?: (direction: 1 | -1, durationMs: number) => void } = {},
) {
  const stepRef = useRef(onStep);
  stepRef.current = onStep;
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const desktop = window.matchMedia(DESKTOP);
    let frame = 0;
    let animating = false;
    let swallow = false;
    let lastWheel = 0;
    let pointerDown = false;
    let settleTimer = 0;

    const active = () =>
      desktop.matches && !document.querySelector(".site-stage > [data-motion-pop-id]") && root.isConnected;

    const segments = (): Segment[] => {
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const points = [0, max];
      if (stopSelector) {
        root.querySelectorAll<HTMLElement>(stopSelector).forEach((el) => {
          points.push(el.getBoundingClientRect().top + window.scrollY);
        });
      }
      const stops = [...new Set(points.map((p) => Math.round(Math.min(max, Math.max(0, p)))))].sort((a, b) => a - b);
      return stops.map((start, i) => {
        const next = i + 1 < stops.length ? stops[i + 1] : null;
        if (next === null || (i === 0 && !coverPages)) return { start, end: start, next };
        return { start, end: Math.max(start, next - window.innerHeight), next };
      });
    };

    const segmentAt = (list: Segment[], y: number) => {
      let found = list[0];
      for (const seg of list) if (seg.start <= y + EDGE) found = seg;
      return found;
    };

    /* the next rest point from `y` in direction `dir` (null: nowhere to go).
       A3.1: a free range is paged one screen per move, never left to the
       browser, so no native wheel scroll can race the step. */
    const target = (y: number, dir: number): number | null => {
      const list = segments();
      const seg = segmentAt(list, y);
      if (!seg) return null;
      const screen = window.innerHeight;
      if (dir > 0) {
        if (y < seg.end - EDGE) return Math.min(y + screen, seg.end);
        return seg.next;
      }
      if (y > seg.end + EDGE) return seg.end; // inside a rise: back to the module's end
      if (y > seg.start + EDGE) return Math.max(y - screen, seg.start);
      const index = list.indexOf(seg);
      return index > 0 ? list[index - 1].end : null;
    };

    const cancel = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      animating = false;
    };

    const go = (to: number) => {
      cancel();
      const from = window.scrollY;
      const distance = to - from;
      if (Math.abs(distance) < 1) return;
      const direction = distance > 0 ? 1 : -1;
      if (reduced) {
        window.scrollTo({ top: to, behavior: "instant" });
        stepRef.current?.(direction, 0);
        return;
      }
      /* N4 P-K C: the duration follows the distance (a rise of more than one
         screen takes longer, so its speed stays near a one-screen step's) */
      const seconds = Math.min(STEP_MAX_S, STEP_S * Math.max(1, Math.abs(distance) / window.innerHeight));
      stepRef.current?.(direction, seconds * 1000);
      animating = true;
      const begin = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - begin) / (seconds * 1000));
        window.scrollTo({ top: from + distance * ease(t), behavior: "instant" });
        if (t < 1) {
          frame = requestAnimationFrame(tick);
        } else {
          frame = 0;
          animating = false;
        }
      };
      frame = requestAnimationFrame(tick);
    };

    const onWheel = (event: WheelEvent) => {
      if (!active() || event.ctrlKey) return;
      if (event.deltaY === 0 || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      const now = performance.now();
      const quiet = now - lastWheel > QUIET_MS;
      lastWheel = now;
      if (scrollsInside(event.target, event.deltaY, root)) return;
      /* A3.1: from here on the page never scrolls natively under the wheel */
      event.preventDefault();
      if (animating || (swallow && !quiet)) return;
      swallow = true;
      const to = target(window.scrollY, Math.sign(event.deltaY));
      if (to !== null) go(to);
    };

    const onKey = (event: KeyboardEvent) => {
      if (!active() || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      const el = event.target instanceof Element ? event.target : null;
      if (el?.closest("input, textarea, select, [contenteditable]")) return;
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
          if (el?.closest("button, a, summary, [role='button']")) return;
          dir = event.shiftKey ? -1 : 1;
          break;
        case "Home":
          event.preventDefault();
          go(0);
          return;
        case "End":
          event.preventDefault();
          go(Math.max(0, document.documentElement.scrollHeight - window.innerHeight));
          return;
        default:
          return;
      }
      if (scrollsInside(el, dir, root)) return;
      event.preventDefault();
      if (animating) return;
      const to = target(window.scrollY, dir);
      if (to !== null) go(to);
    };

    /* a stray offset (scrollbar, focus, restored scroll) settles on the nearer rest point */
    const settle = () => {
      settleTimer = 0;
      if (animating || pointerDown) return;
      if (!active()) {
        if (desktop.matches) settleTimer = window.setTimeout(settle, SETTLE_MS);
        return;
      }
      const y = window.scrollY;
      const seg = segmentAt(segments(), y);
      if (!seg || seg.next === null || y <= seg.end + EDGE || y >= seg.next - EDGE) return;
      go(y - seg.end < seg.next - y ? seg.end : seg.next);
    };
    const onScroll = () => {
      if (animating) return;
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(settle, SETTLE_MS);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      pointerDown = true;
      cancel();
    };
    const onPointerUp = () => {
      if (!pointerDown) return;
      pointerDown = false;
      onScroll();
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    return () => {
      cancel();
      window.clearTimeout(settleTimer);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [rootRef, stopSelector, reduced, coverPages]);
}
