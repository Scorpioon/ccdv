import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useMotionPolicy } from "./reducedMotion";
export type TransitionDirection = "to-studio" | "to-home" | null;
export type TransitionTarget = "/" | "/studio";
// PROVISIONAL lifecycle timings. NOT a design decision and NOT canonical:
// GF05-A and matrix v3.8 both forbid freezing duration/easing before the
// visual pieces are confirmed. EXIT_LEAD_MS is the pre-navigation scene lead;
// EXIT_SETTLE_MS is only a failsafe budget for a missing onExitComplete.
const EXIT_LEAD_MS = 300;
const EXIT_SETTLE_MS = 900;
const REDUCED_SETTLE_MS = 200;
export function useTransitionCoordinator() {
  const navigate = useNavigate();
  const location = useLocation();
  const { reduced } = useMotionPolicy();
  const [leaving, setLeaving] = useState<TransitionDirection>(null);
  const lead = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failsafe = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busy = useRef(false);
  const target = useRef<TransitionTarget | null>(null);
  const queued = useRef<TransitionTarget | null>(null);
  const locationKey = useRef(location.key);
  const pathname = useRef(location.pathname);
  const goRef = useRef<(to: TransitionTarget) => void>(() => {});
  useEffect(() => {
    locationKey.current = location.key;
    pathname.current = location.pathname;
  }, [location.key, location.pathname]);
  const clearTimers = useCallback(() => {
    if (lead.current) clearTimeout(lead.current);
    if (failsafe.current) clearTimeout(failsafe.current);
    lead.current = null;
    failsafe.current = null;
  }, []);
  // Releases the exit phase. Driven by AnimatePresence onExitComplete so the
  // OUTGOING route holds its leaving pose for the whole exit under mode="wait",
  // instead of being reset the moment location.key changes. Idempotent: a
  // navigation the coordinator did not start (back/forward) also lands here and
  // simply resets an already-clean state.
  const endTransition = useCallback(() => {
    clearTimers();
    busy.current = false;
    target.current = null;
    setLeaving(null);
    const next = queued.current;
    queued.current = null;
    if (next && next !== pathname.current) goRef.current(next);
  }, [clearTimers]);
  const go = useCallback((to: TransitionTarget) => {
    if (location.pathname === to) return;
    // Single-flight, but intent is queued rather than dropped: a different
    // destination asked for mid-transition is replayed once this one settles.
    if (busy.current) {
      if (to !== target.current) queued.current = to;
      return;
    }
    busy.current = true;
    target.current = to;
    queued.current = null;
    setLeaving(to === "/studio" ? "to-studio" : "to-home");
    const startKey = locationKey.current;
    const leadMs = reduced ? 0 : EXIT_LEAD_MS;
    lead.current = setTimeout(() => {
      lead.current = null;
      // A real navigation (back/forward) already superseded this request.
      if (locationKey.current !== startKey) return;
      void navigate(to);
    }, leadMs);
    failsafe.current = setTimeout(
      endTransition,
      leadMs + (reduced ? REDUCED_SETTLE_MS : EXIT_SETTLE_MS),
    );
  }, [endTransition, location.pathname, navigate, reduced]);
  useEffect(() => { goRef.current = go; }, [go]);
  useEffect(() => clearTimers, [clearTimers]);
  return { go, endTransition, leaving, reduced, isBusy: leaving !== null };
}
