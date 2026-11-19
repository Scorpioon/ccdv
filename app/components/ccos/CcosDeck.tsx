import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, FocusEvent, ReactNode, RefObject, TouchEvent } from "react";
import { STUDIO_MOTION } from "../../motion/studioMotion";

/* The CC.OS deck (P2, OPERATOR: "a fully slideshow product page" with deck
   control). One slide per screen, at every width; one gesture moves exactly
   one slide:
     wheel / trackpad  an accumulated 50px, then nothing until the gesture's
                       own tail has stopped (a 180 ms pause), so inertia never
                       pages twice
     keys              ArrowDown / PageDown / Space next, ArrowUp / PageUp /
                       Shift+Space back, Home / End; Space is left to a
                       focused button or link
     touch             a 48px swipe
     focus             Tab into the neighbouring slide brings it up
   An area marked `data-deck-scroll` (a slide's body on phones, when its copy
   is taller than the screen) scrolls first and pages only at its ends.

   The slides are stacked layers (global.css): the next one rises over the
   current one, which stays and dims; paging back reverses it. Slides further
   away are not painted (visibility, after the move), so only the two in play
   can take focus. The deck clips (`overflow: clip`), so focus never scrolls
   it. Reduced motion: the same states, no movement.

   Chrome: the thin masthead floats over the slides. It shows on the first
   and the last slide and on every change, and idles away after
   STUDIO_MOTION.navIdle elsewhere; the pointer near the top edge brings it
   back (`data-nav-idle` on the route root, the shared A1 rule). Phones keep
   the M1 bar in place. */

export interface DeckSlide {
  key: string;
  label: string;
  content: ReactNode;
  /** the footer: as tall as its content, rising over the slide's lower part */
  partial?: boolean;
}

const MOVE_MS = 700;
const WHEEL_STEP = 50;
const WHEEL_QUIET_MS = 180;
const SWIPE_PX = 48;
const NAV_EDGE_PX = 64;

type SlideState = "behind" | "past" | "current" | "next" | "after";

function stateOf(i: number, current: number): SlideState {
  if (i === current) return "current";
  if (i === current - 1) return "past";
  if (i === current + 1) return "next";
  return i < current ? "behind" : "after";
}

/* can the nearest `data-deck-scroll` area still scroll that way? */
function scrollsFurther(target: EventTarget | null, dir: number) {
  const area = target instanceof Element ? target.closest<HTMLElement>("[data-deck-scroll]") : null;
  if (!area || area.scrollHeight <= area.clientHeight + 1) return false;
  if (!/(auto|scroll)/.test(getComputedStyle(area).overflowY)) return false;
  return dir > 0 ? area.scrollTop + area.clientHeight < area.scrollHeight - 1 : area.scrollTop > 0;
}

export function CcosDeck({
  slides,
  rootRef,
  reduced,
  label,
}: {
  slides: DeckSlide[];
  rootRef: RefObject<HTMLElement | null>;
  reduced: boolean;
  label: string;
}) {
  const [current, setCurrent] = useState(0);
  const currentRef = useRef(0);
  const deckRef = useRef<HTMLDivElement>(null);
  const lockedUntil = useRef(0);
  const wheel = useRef({ sum: 0, last: 0, tail: false });
  const touch = useRef<{ y: number; up: boolean; down: boolean } | null>(null);
  const count = slides.length;

  const go = useCallback(
    (to: number) => {
      const next = Math.max(0, Math.min(count - 1, to));
      if (next === currentRef.current) return false;
      currentRef.current = next;
      setCurrent(next);
      lockedUntil.current = performance.now() + (reduced ? 0 : MOVE_MS);
      return true;
    },
    [count, reduced],
  );

  const step = useCallback(
    (dir: number) => {
      if (performance.now() < lockedUntil.current) return false;
      return go(currentRef.current + dir);
    },
    [go],
  );

  /* wheel + keys: native listeners (the wheel one on the deck itself) */
  useEffect(() => {
    const deck = deckRef.current;
    if (!deck) return;

    const onWheel = (event: WheelEvent) => {
      const now = performance.now();
      const state = wheel.current;
      const quiet = now - state.last;
      state.last = now;
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      const dir = event.deltaY > 0 ? 1 : -1;
      if (scrollsFurther(event.target, dir)) {
        state.sum = 0;
        return;
      }
      if (now < lockedUntil.current) return;
      if (state.tail && quiet < WHEEL_QUIET_MS) return;
      state.tail = false;
      state.sum += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1);
      if (Math.abs(state.sum) < WHEEL_STEP) return;
      state.sum = 0;
      if (step(dir)) state.tail = true;
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (target?.closest("input, textarea, select, [contenteditable='true'], .smm__panel[data-open='true']")) return;
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
        case "Home":
          event.preventDefault();
          go(0);
          return;
        case "End":
          event.preventDefault();
          go(count - 1);
          return;
        default:
          return;
      }
      if (scrollsFurther(target, dir)) return;
      event.preventDefault();
      step(dir);
    };

    deck.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      deck.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
    };
  }, [count, go, step]);

  const onTouchStart = (event: TouchEvent) => {
    const t = event.touches[0];
    touch.current = t
      ? { y: t.clientY, up: scrollsFurther(event.target, -1), down: scrollsFurther(event.target, 1) }
      : null;
  };
  const onTouchEnd = (event: TouchEvent) => {
    const start = touch.current;
    const t = event.changedTouches[0];
    touch.current = null;
    if (!start || !t) return;
    const dy = start.y - t.clientY;
    if (Math.abs(dy) < SWIPE_PX) return;
    const dir = dy > 0 ? 1 : -1;
    if (dir > 0 ? start.down : start.up) return;
    step(dir);
  };

  /* focus following: Tab into a neighbouring slide brings it up */
  const onFocus = (event: FocusEvent<HTMLDivElement>) => {
    const slide = (event.target as Element).closest<HTMLElement>("[data-slide]");
    const index = slide ? Number(slide.dataset.slide) : -1;
    if (index >= 0 && index !== currentRef.current) go(index);
  };

  /* the masthead: shown on the first and last slide and on every change,
     idle elsewhere after navIdle; the pointer at the top edge wakes it */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const wide = window.matchMedia("(min-width: 768px)");
    const rest = current === 0 || current === count - 1;
    let timer = 0;
    const show = () => {
      root.removeAttribute("data-nav-idle");
      window.clearTimeout(timer);
      if (!rest && wide.matches) {
        timer = window.setTimeout(() => root.setAttribute("data-nav-idle", ""), STUDIO_MOTION.navIdle * 1000);
      }
    };
    const onMove = (event: PointerEvent) => {
      if (event.clientY < NAV_EDGE_PX) show();
    };
    show();
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointermove", onMove);
      root.removeAttribute("data-nav-idle");
    };
  }, [current, count, rootRef]);

  return (
    <div
      className="cc-deck"
      ref={deckRef}
      role="region"
      aria-roledescription="slideshow"
      aria-label={label}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onFocus={onFocus}
    >
      {slides.map((slide, i) => (
        <section
          key={slide.key}
          className={`cc-slide cc-slide--${slide.key}${slide.partial ? " cc-slide--partial" : ""}`}
          data-slide={i}
          data-state={stateOf(i, current)}
          data-deck-scroll={slide.partial || undefined}
          aria-roledescription="slide"
          aria-label={`${slide.label} (${i + 1} of ${count})`}
          style={{ "--z": i + 1 } as CSSProperties}
        >
          {slide.content}
        </section>
      ))}
      <p className="cc-deck__status" aria-live="polite">
        {`${slides[current]?.label ?? ""}, ${current + 1} of ${count}`}
      </p>
      <DeckNext onNext={() => step(1)} hidden={current >= count - 1} />
    </div>
  );
}

/* a quiet "next" chevron at the foot of the screen (not on the last slide) */
function DeckNext({ onNext, hidden }: { onNext: () => void; hidden: boolean }) {
  return (
    <button type="button" className="cc-deck__next" aria-label="Next slide" onClick={onNext} hidden={hidden}>
      v
    </button>
  );
}
