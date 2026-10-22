import { useReducedMotion } from "motion/react";
export function useMotionPolicy() {
  return { reduced: useReducedMotion() === true };
}
