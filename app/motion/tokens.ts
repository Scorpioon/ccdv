/* N5 round 2: one motion vocabulary for script-driven motion (ms). The CSS
   twins live in styles/tokens.css (--dur-*, --ease-*, --stagger); keep them
   in step. Engines with their own physics (cube, gear, stepScroll easing)
   are not in here. */
export const MOTION = {
  micro: 160,
  short: 240,
  medium: 400,
  long: 700,
  /* N6 R2 paced reading: the desktop stepper's own pace (one screen), and its cap
     for a long rise; `long` stays for the many CSS twins that share it */
  step: 1000,
  stepMax: 1500,
  deck: 1000,
  stagger: 50,
  /* route: the outgoing page fades over routeOut; the arriving pieces wait
     arriveLead (= routeOut), then spawn over `medium`; `arrive` is how long
     the shell keeps data-arriving */
  routeOut: 320,
  arriveLead: 320,
  /* R3 S1/S4: the plane change (exit and grid ground) and the shorter arrival lead */
  routePlane: 420,
  arriveLead2: 140,
  arrive: 1000,
  /* N6 R2: one gesture threshold for the Work and CC.OS decks (wheel px
     accumulated, touch swipe px) and for the stepper's wheel */
  wheelStep: 80,
  swipe: 64,
  /* masthead title retype */
  typeChar: 72,
  eraseChar: 28,
  retypePause: 60,
} as const;

type Bezier = [number, number, number, number];
export const EASE: { out: Bezier; in: Bezier; inOut: Bezier } = {
  out: [0.22, 0.61, 0.36, 1],
  in: [0.4, 0, 1, 1],
  inOut: [0.65, 0, 0.35, 1],
};
