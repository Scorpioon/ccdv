import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, FocusEvent, ReactNode, TouchEvent } from "react";
import { Link } from "react-router";
import { useTransitionLink } from "../GlobalShell";

/* The CC.OS deck (P2; P2 CORR01, OPERATOR: "the same classic start stop
   slideshow"). Every slide is one screen on one vertical strip; paging slides
   the whole strip to the next stop and stops there — no covering, dimming or
   cut. A ground layer behind the strip moves with it at a slower rate
   (parallax); it is plain now and ready for a texture. The footer is the last
   stop, its own height: the strip stops with the footer at the screen's foot.

   One gesture moves exactly one slide:
     wheel / trackpad  an accumulated 50px, then nothing until the gesture's
                       own tail has stopped (a 180 ms pause), so inertia never
                       pages twice
     keys              ArrowDown / PageDown / Space next, ArrowUp / PageUp /
                       Shift+Space back, Home / End; Space is left to a
                       focused button or link
     touch             a 48px swipe
     focus             Tab into another slide brings it up
   An area marked `data-deck-scroll` (a slide on phones, the explainer
   detail) scrolls first and pages only at its ends. The deck clips
   (`overflow: clip`), so focus never scrolls it. Reduced motion: no slide,
   the stop is taken at once.

   Chrome (OPERATOR): no masthead and no M1 bar on this page; one "Back" link
   in the top-left corner over every slide, back to /products (it falls).
   `content` may be a function of whether its slide is the current one (the
   hero replays its entrance on arrival). */

export interface DeckSlide {
  key: string;
  label: string;
  content: ReactNode | ((current: boolean) => ReactNode);
  /** the footer: as tall as its content */
  partial?: boolean;
  /** P2 CORR03: the held lockup steps away on this slide (it carries its own) */
  unmarked?: boolean;
}

const MOVE_MS = 800;
const WHEEL_STEP = 50;
const WHEEL_QUIET_MS = 180;
const SWIPE_PX = 48;
const PARALLAX = 0.35;

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/* can the nearest `data-deck-scroll` area still scroll that way? */
function scrollsFurther(target: EventTarget | null, dir: number) {
  const area = target instanceof Element ? target.closest<HTMLElement>("[data-deck-scroll]") : null;
  if (!area || area.scrollHeight <= area.clientHeight + 1) return false;
  if (!/(auto|scroll)/.test(getComputedStyle(area).overflowY)) return false;
  return dir > 0 ? area.scrollTop + area.clientHeight < area.scrollHeight - 1 : area.scrollTop > 0;
}

/* P2 CORR03 (OPERATOR, phones: "when scrolling very fast you can destabilize
   the scroll and it gets stuck"): the page under the deck no longer scrolls
   (global.css locks the document while the deck is up), a swipe that also
   scrolled a slide's own area — or landed while that area was still coasting
   — never pages, and a slide that is left goes back to its top. */
const COAST_MS = 120;

export function CcosDeck({
  slides,
  reduced,
  label,
  mark,
}: {
  slides: DeckSlide[];
  reduced: boolean;
  label: string;
  /** P2 CORR03: a lockup held top-centre from the second slide on */
  mark?: ReactNode;
}) {
  const link = useTransitionLink();
  const [current, setCurrent] = useState(0);
  const [size, setSize] = useState({ screen: 0, tail: 0 });
  const currentRef = useRef(0);
  const deckRef = useRef<HTMLDivElement>(null);
  const tailRef = useRef<HTMLElement | null>(null);
  const lockedUntil = useRef(0);
  const wheel = useRef({ sum: 0, last: 0, tail: false });
  const touch = useRef<{ y: number; t: number; up: boolean; down: boolean } | null>(null);
  /* when an area inside the deck last scrolled (its own scroll or its coast) */
  const scrolledAt = useRef(0);
  const count = slides.length;

  /* the screen's height and the footer's, for the last stop */
  useIsomorphicLayoutEffect(() => {
    const deck = deckRef.current;
    if (!deck) return;
    const measure = () =>
      setSize({ screen: deck.clientHeight, tail: tailRef.current?.offsetHeight ?? deck.clientHeight });
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(deck);
    if (tailRef.current) observer?.observe(tailRef.current);
    return () => observer?.disconnect();
  }, []);

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

    const onScroll = () => {
      scrolledAt.current = performance.now();
    };

    deck.addEventListener("wheel", onWheel, { passive: true });
    deck.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("keydown", onKey);
    return () => {
      deck.removeEventListener("wheel", onWheel);
      deck.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("keydown", onKey);
    };
  }, [count, go, step]);

  /* a slide that is left goes back to its top once the strip has moved */
  useEffect(() => {
    const deck = deckRef.current;
    if (!deck) return;
    const timer = window.setTimeout(
      () => {
        deck.querySelectorAll<HTMLElement>("[data-slide]").forEach((slide) => {
          if (slide.dataset.current === "true") return;
          slide.querySelectorAll<HTMLElement>("[data-deck-scroll]").forEach((area) => (area.scrollTop = 0));
          slide.scrollTop = 0;
        });
      },
      reduced ? 0 : MOVE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [current, reduced]);

  const onTouchStart = (event: TouchEvent) => {
    const t = event.touches[0];
    touch.current = t
      ? {
          y: t.clientY,
          t: performance.now(),
          up: scrollsFurther(event.target, -1),
          down: scrollsFurther(event.target, 1),
        }
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
    /* the gesture scrolled an area, or an area was still coasting when it began */
    if (scrolledAt.current >= start.t - COAST_MS) return;
    step(dir);
  };

  /* focus following: Tab into another slide brings it up */
  const onFocus = (event: FocusEvent<HTMLDivElement>) => {
    const slide = (event.target as Element).closest<HTMLElement>("[data-slide]");
    const index = slide ? Number(slide.dataset.slide) : -1;
    if (index >= 0 && index !== currentRef.current) go(index);
  };

  /* the strip's offset: one screen per stop; the footer's stop shows the
     footer at the foot of the screen, over the slide before it */
  const last = slides[count - 1]?.partial ? count - 1 : -1;
  const offset =
    current === last && last > 0 ? (last - 1) * size.screen + size.tail : current * size.screen;

  return (
    <div
      className="cc-deck"
      ref={deckRef}
      role="region"
      aria-roledescription="slideshow"
      aria-label={label}
      style={{ "--y": `${-offset}px`, "--ground-y": `${-offset * PARALLAX}px` } as CSSProperties}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onFocus={onFocus}
    >
      <div className="cc-deck__ground" aria-hidden="true" />
      <div className="cc-deck__track">
        {slides.map((slide, i) => (
          <section
            key={slide.key}
            ref={slide.partial ? (node) => void (tailRef.current = node) : undefined}
            className={`cc-slide cc-slide--${slide.key}${slide.partial ? " cc-slide--partial" : ""}`}
            data-slide={i}
            data-current={i === current || (current === last && i === last - 1)}
            data-deck-scroll={slide.partial || undefined}
            aria-roledescription="slide"
            aria-label={`${slide.label} (${i + 1} of ${count})`}
            style={{ "--n": i } as CSSProperties}
          >
            {typeof slide.content === "function" ? slide.content(i === current) : slide.content}
          </section>
        ))}
      </div>

      {mark ? (
        <div
          className="cc-deck__mark"
          aria-hidden="true"
          data-show={current > 0 && !slides[current]?.unmarked && !(current === last && slides[last - 1]?.unmarked)}
        >
          {mark}
        </div>
      ) : null}
      <Link className="cc-back" {...link("/products")}>
        <span className="cc-back__icon" aria-hidden="true">
          ←
        </span>
        <span className="cc-back__label">Back</span>
      </Link>
      <p className="cc-deck__status" aria-live="polite">
        {`${slides[current]?.label ?? ""}, ${current + 1} of ${count}`}
      </p>
      <button
        type="button"
        className="cc-deck__next"
        aria-label="Next slide"
        onClick={() => step(1)}
        hidden={current >= count - 1}
      >
        v
      </button>
    </div>
  );
}
