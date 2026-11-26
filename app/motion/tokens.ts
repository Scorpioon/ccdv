/* N5 round 2: one motion vocabulary for script-driven motion (ms). The CSS
   twins live in styles/tokens.css (--dur-*, --ease-*, --stagger); keep them
   in step. Engines with their own physics (cube, gear, stepScroll easing)
   are not in here. */
export const MOTION = {
  micro: 160,
  short: 240,
  medium: 400,
  long: 700,
  stepMax: 1200,
  deck: 800,
  stagger: 50,
  /* route: the outgoing page fades over routeOut; the arriving pieces wait
     arriveLead (= routeOut), then spawn over `medium`; `arrive` is how long
     the shell keeps data-arriving */
  routeOut: 240,
  arriveLead: 240,
  arrive: 900,
  /* masthead title retype */
  typeChar: 48,
  eraseChar: 28,
  retypePause: 60,
} as const;

type Bezier = [number, number, number, number];
export const EASE: { out: Bezier; in: Bezier; inOut: Bezier } = {
  out: [0.22, 0.61, 0.36, 1],
  in: [0.4, 0, 1, 1],
  inOut: [0.65, 0, 0.35, 1],
};
