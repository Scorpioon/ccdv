/* N4 H6: Thin-masthead behaviour for the scene routes that use the shared bar:
   Studio, Services, Products and Contact (Work has no bar, so these hooks do
   not run there). Studio uses these hooks too (useBoundaryNav, useNavIdle,
   usePinTop). The mechanisms of R3 addenda A1/A3/A4, written once as hooks.

   N1 (OPERATOR): the bar is no longer part of a page. GlobalShell renders it
   once, as `.site-chrome`, so it does not fade or move when one section page
   gives way to another. The hooks therefore write to that element, not to the
   page root.

   useBoundaryNav  --nav-in = clamp((navH - edgeTop) / navH) on the chrome: the
                   bar's lower edge rides the top edge of the given section, so
                   the bar is hidden over everything above it.
   useNavIdle      A9 (OPERATOR), summon-only: `data-nav-idle` on the chrome
                   while the reader steps or scrolls down, cleared by a step or
                   scroll up and at the page's end; the CSS slides the bar away
                   (0.30 s) and back (0.22 s). A12: the direction is read
                   from the reader's input (wheel, keys, touch), not the
                   scroll offset. N2: the end shows it only after a scroll
                   with no input (scrollbar), never after a step down.

   Ownership: the page that has just arrived claims the bar. The page leaving
   is still mounted for its exit and still receives scrolls, so only the owner
   may write. The bar is then HELD, hidden (A1: a clean view on every arrival),
   until the reader's first scroll input; from then on the page's own rule
   drives it. The cursor near the top edge, a tap there, or keyboard focus
   shows it meanwhile (useNavIdle, `data-nav-peek`). */
import { useEffect, useLayoutEffect } from "react";
import type { RefObject } from "react";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
const NAV_IDLE_MIN_SCROLL = 50; // px: the M1 bar's height; nearer the top the bar stays
const PEEK_EDGE = 70; // px from the top edge that reveals the bar (A1)
const PEEK_SLACK = 24; // px below the bar before it is let go
const PEEK_HIDE_MS = 250;
const TOUCH_FLIP_PX = 24; // N6 R2: a finger must travel this far one way before the bar changes (micro reversals twitched it)
const INPUT_RECENT_MS = 1400; // A12: a scroll this soon after wheel / key / touch is that input's (a step of up to 1.2 s included)
const SCROLL_ONLY_MIN = 40; // px: A12, a scroll with no input behind it (scrollbar) must travel this far
const SCROLL_KEYS = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);

const getChrome = () => document.querySelector<HTMLElement>(".site-chrome");

let barOwner: HTMLElement | null = null;
let barHeld = false;
let stopWatching: (() => void) | null = null;
const releaseListeners = new Set<() => void>();

function claimBar(root: HTMLElement) {
  if (barOwner === root) return;
  stopWatching?.();
  barOwner = root;
  barHeld = true;
  const chrome = getChrome();
  /* A1: every arrival is the clean view. The thin bar is out (--nav-in 0) and
     the M1 bar is idle-hidden; the cursor or a scroll brings it back. */
  chrome?.style.setProperty("--nav-in", "0");
  chrome?.removeAttribute("data-nav-peek");
  /* N4 P-I A-19: while the bar is held, the phone rule follows the width (a
     rotation or resize across 767px), not only the width at the claim */
  const phone = window.matchMedia("(width < 768px)"); // N6 R2 FU-G1-01: was (max-width: 767px), which missed 767.x
  const applyHeld = () => {
    if (barHeld) chrome?.toggleAttribute("data-nav-idle", phone.matches);
  };
  applyHeld();
  const release = () => {
    stopWatching?.();
    stopWatching = null;
    barHeld = false;
    releaseListeners.forEach((listener) => listener());
  };
  const onKey = (event: KeyboardEvent) => {
    /* N4 P-I C-16: a key a control used (a sphere, a tab list) is not a scroll */
    if (event.defaultPrevented) return;
    if (SCROLL_KEYS.has(event.key)) release();
  };
  window.addEventListener("wheel", release, { passive: true });
  window.addEventListener("touchmove", release, { passive: true });
  window.addEventListener("keydown", onKey);
  phone.addEventListener("change", applyHeld);
  stopWatching = () => {
    window.removeEventListener("wheel", release);
    window.removeEventListener("touchmove", release);
    window.removeEventListener("keydown", onKey);
    phone.removeEventListener("change", applyHeld);
  };
}

function dropBar(root: HTMLElement) {
  if (barOwner !== root) return;
  stopWatching?.();
  stopWatching = null;
  barOwner = null;
  barHeld = false;
}

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
    const chrome = getChrome();
    const nav = chrome?.querySelector<HTMLElement>(navSelector);
    if (!root || !edge || !chrome || !nav) return;
    const lead = leadSelector ? root.querySelector<HTMLElement>(leadSelector) : null;
    const phoneBar = chrome.querySelector<HTMLElement>(".smm__bar");
    claimBar(root);
    let frame = 0;
    let last = "";
    const update = () => {
      frame = 0;
      if (barOwner !== root || barHeld) return;
      /* A8 (OPERATOR): phones follow the same rule with the M1 bar (the thin
         masthead is not rendered there, height 0); a lead that is not
         displayed (no box) does not count */
      const navH = nav.offsetHeight || phoneBar?.offsetHeight || 0;
      const edgeTop = edge.getBoundingClientRect().top;
      const top =
        lead && lead.getClientRects().length > 0 ? Math.min(edgeTop, lead.getBoundingClientRect().bottom) : edgeTop;
      const p = navH > 0 ? clamp01((navH - top) / navH).toFixed(4) : "1";
      if (p !== last) {
        last = p;
        chrome.style.setProperty("--nav-in", p);
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    releaseListeners.add(schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      releaseListeners.delete(schedule);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
      dropBar(root);
    };
  }, [rootRef, edgeRef, navSelector, leadSelector]);
}

/* PIN-T1 (OPERATOR): a pinned scene module sticks with its top at
   min(0, screen height - its own height), written as --pin-top. One screen
   tall or less, it pins at the top; taller (a long Service Index category), it
   is read to its end first and pins by its bottom, so nothing is cut. Only
   the CSS at >= 1024px reads the property. Re-measured on resize and when
   the module changes size.
   N4 P-M: with `next`, also --rise (0..1) on the module: how far the next
   section has risen over it. The Products rail is the same ink + grid as the
   module, so its rising edge is invisible; the module reads --rise to dim and
   lift as the rail covers it. */
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
    let lastRise = "";
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
      const nextTop = next ? next.getBoundingClientRect().top : Infinity;
      const moduleCovered = !!next && nextTop <= 0;
      if (next) {
        const rise = clamp01(1 - nextTop / window.innerHeight).toFixed(3);
        if (rise !== lastRise) {
          lastRise = rise;
          node.style.setProperty("--rise", rise);
        }
      }
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
      node.style.removeProperty("--rise");
      const changed = [mark(node, false), mark(cover, false)].some(Boolean);
      if (changed) coverListeners.forEach((listener) => listener());
    };
  }, [ref, nextRef]);
}

export function useNavIdle(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    const chrome = getChrome();
    if (!root || !chrome) return;
    claimBar(root);
    /* A9 (OPERATOR): summon-only. Stepping or scrolling down hides the bar,
       up (or the page's end) shows it; no idle timer, so a step down never
       flashes it in. A12 (OPERATOR: it still popped up): the direction is the
       reader's INPUT — wheel, keys, a finger — not the scroll offset, which
       also moves by itself (the stepper's settle glide, scroll anchoring,
       curtains covering) and read as "up". Only without recent input (a
       scrollbar drag) does the offset count, past SCROLL_ONLY_MIN. */
    let lastY = window.scrollY;
    let lastInput = -Infinity;
    let touchY: number | null = null;
    const setHidden = (hidden: boolean) => {
      if (barOwner !== root || barHeld) return;
      if (peeking) idleBeforePeek = hidden;
      else chrome.toggleAttribute("data-nav-idle", hidden);
    };
    const intent = (down: boolean) => {
      lastInput = performance.now();
      setHidden(down);
    };

    /* A1: `data-nav-peek` shows the bar on demand. Mouse: the cursor within
       PEEK_EDGE of the top, armed only once it has been below the bar since
       arrival (the click that navigated left it up there, and the bar must
       stay closed). Touch: a tap in the top 50px. Keyboard: the CSS already
       shows the bar on :focus-within. */
    let peeking = false;
    let touchPeek = false;
    let armed = false;
    let idleBeforePeek = false;
    let peekTimer = 0;
    const setPeek = (on: boolean) => {
      if (on === peeking) return;
      peeking = on;
      if (on) {
        idleBeforePeek = chrome.hasAttribute("data-nav-idle");
        chrome.removeAttribute("data-nav-idle");
        chrome.setAttribute("data-nav-peek", "");
      } else {
        touchPeek = false;
        chrome.removeAttribute("data-nav-peek");
        if (idleBeforePeek) chrome.setAttribute("data-nav-idle", "");
      }
    };
    const onMove = (event: PointerEvent) => {
      if (barOwner !== root || event.pointerType === "touch") return;
      const bar = chrome.querySelector<HTMLElement>(".masthead--collapsing");
      const hideBelow = (bar?.offsetHeight || NAV_IDLE_MIN_SCROLL) + PEEK_SLACK;
      if (event.clientY <= PEEK_EDGE) {
        window.clearTimeout(peekTimer);
        peekTimer = 0;
        if (armed) setPeek(true);
      } else if (event.clientY > hideBelow) {
        armed = true;
        if (peeking && !peekTimer) peekTimer = window.setTimeout(() => {
          peekTimer = 0;
          setPeek(false);
        }, PEEK_HIDE_MS);
      }
    };
    const onDown = (event: PointerEvent) => {
      if (barOwner !== root || event.pointerType !== "touch") return;
      /* R3 S4: a tap on a link, button or card is not a bar gesture */
      if ((event.target as Element | null)?.closest?.("a,button,[role=button],input,label,.cmh")) return;
      if (event.clientY <= NAV_IDLE_MIN_SCROLL) {
        touchPeek = true;
        setPeek(true);
      }
    };
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX) || event.deltaY === 0) return;
      intent(event.deltaY > 0);
    };
    const onKey = (event: KeyboardEvent) => {
      /* N4 P-I C-16: arrows a sphere or a tab list consumed do not hide or show the bar */
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      const el = event.target instanceof Element ? event.target : null;
      if (el?.closest("input, textarea, select, [contenteditable]")) return;
      if (event.key === "ArrowDown" || event.key === "PageDown" || event.key === "End") intent(true);
      else if (event.key === "ArrowUp" || event.key === "PageUp" || event.key === "Home") intent(false);
      else if (event.key === " " && !el?.closest("button, a, summary, [role='button']")) intent(!event.shiftKey);
    };
    let touchAcc = 0;
    const onTouchStart = (event: TouchEvent) => {
      touchY = event.touches[0]?.clientY ?? null;
      touchAcc = 0;
    };
    const onTouchMove = (event: TouchEvent) => {
      const y = event.touches[0]?.clientY;
      if (touchY === null || y === undefined) return;
      lastInput = performance.now(); // a drag is input throughout, so the scroll path never second-guesses it
      const d = touchY - y; // finger up (positive) = the page scrolls down
      touchY = y;
      if (d === 0) return;
      if (Math.sign(d) !== Math.sign(touchAcc)) touchAcc = 0;
      touchAcc += d;
      if (Math.abs(touchAcc) >= TOUCH_FLIP_PX) setHidden(touchAcc > 0);
    };
    const onScroll = () => {
      if (barOwner !== root) return;
      if (touchPeek) setPeek(false);
      const y = window.scrollY;
      const atEnd = y + window.innerHeight >= document.documentElement.scrollHeight - 2;
      /* N2 (OPERATOR: up showed the bar, but down did not hide it again): a
         step down that lands on the page's end is still a step down, so the
         end shows the bar only for a scroll with no input behind it */
      if (atEnd) {
        lastY = y;
        if (performance.now() - lastInput >= INPUT_RECENT_MS) setHidden(false);
        return;
      }
      const dy = y - lastY;
      if (performance.now() - lastInput < INPUT_RECENT_MS) {
        lastY = y;
        return;
      }
      if (Math.abs(dy) <= SCROLL_ONLY_MIN) return;
      lastY = y;
      setHidden(dy > 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.clearTimeout(peekTimer);
      if (barOwner === root) {
        chrome.removeAttribute("data-nav-idle");
        chrome.removeAttribute("data-nav-peek");
      }
      dropBar(root);
    };
  }, [rootRef]);
}
