import { useEffect, useRef, useState } from "react";
import { MOTION } from "./tokens";

/* N5 round 2 (OPERATOR): the masthead card is one persistent plane; its title
   is retyped between pages. ":Studio" -> ":Services" erases back to the common
   prefix (":S"), pauses, types the rest. Modes:
     load   first load: the full title, no animation;
     carry  section -> section: the card is already on screen (identical
            geometry), so it continues from the last title shown;
     enter  arriving from Home / Work / elsewhere: starts at ":" and types,
            after the arriving lead.
   `planeTitle` is the module-level handover: only a card that is present
   writes it, so a card that is fading out never overwrites the arriving one. */
export const TITLE_PREFIX = ":";
export type RetypeMode = "load" | "carry" | "enter";

let planeTitle: string | null = null;
/* R3 S9: other persistent titles (Work's own head) keep their own handover, by id; the
   masthead card keeps `planeTitle` above (no id) */
const planeTitles = new Map<string, string>();

function commonPrefix(a: string, b: string): number {
  const n = Math.min(a.length, b.length);
  let i = 0;
  while (i < n && a[i] === b[i]) i++;
  return i;
}

export function useRetype(
  target: string,
  { mode, reduced, active, id, from }: { mode: RetypeMode; reduced: boolean; active: boolean; id?: string; from?: string },
): string {
  /* `id` (optional) gives the title its own handover; `from` is the text an `enter` starts
     at (default ":", the masthead's prefix) */
  const [shown, setShown] = useState<string>(() => {
    if (reduced || mode === "load") return target;
    if (mode === "carry") return (id ? planeTitles.get(id) : planeTitle) ?? target;
    return from ?? TITLE_PREFIX;
  });
  const shownRef = useRef(shown);
  const firstRun = useRef(true);

  useEffect(() => {
    if (!active) return;
    const first = firstRun.current;
    firstRun.current = false;
    const set = (next: string) => {
      if (next === shownRef.current) return;
      shownRef.current = next;
      setShown(next);
    };
    if (reduced) {
      set(target);
      return;
    }
    const prev = shownRef.current;
    const keep = commonPrefix(prev, target);
    const eraseN = prev.length - keep;
    const typeN = target.length - keep;
    const pause = eraseN > 0 && typeN > 0 ? MOTION.retypePause : 0;
    const eraseT = eraseN * MOTION.eraseChar;
    const typeStart = eraseT + pause;
    const total = typeStart + typeN * MOTION.typeChar;
    const delay = first && mode === "enter" ? MOTION.arriveLead2 + MOTION.medium : 0;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const e = now - t0 - delay;
      if (e >= total) {
        set(target);
        return;
      }
      if (e < 0) {
        /* still waiting: nothing changes */
      } else if (e < eraseT) {
        set(prev.slice(0, prev.length - Math.floor(e / MOTION.eraseChar)));
      } else if (e < typeStart) {
        set(prev.slice(0, keep));
      } else {
        set(target.slice(0, keep + Math.floor((e - typeStart) / MOTION.typeChar)));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, mode, reduced, active]);

  useEffect(() => {
    if (!active) return;
    if (id) planeTitles.set(id, shown);
    else planeTitle = shown;
  }, [shown, active, id]);

  return shown;
}
