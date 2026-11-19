/* Products V2 P1b (t_20261117_products20): the lit cube — the Products
   counterpart of Studio's sphere and the Services voxel face. OPERATOR brief:
   three nested layers (outer / center / inner), each offering three faces
   (top / left / right, split by the cube's Y); a pattern lights exactly one
   face per layer, each in its own green tone, and every \\Our Software Code
   selection rolls a new random pattern (never the same faces twice running).
   `Products demo cube (not use, recreate)` shows one such state; nothing is
   taken from that file — the geometry is computed here.

   A layer's face is its hexagon's rhombus minus the next layer's rhombus (the
   band between the two outlines); the inner layer's face is the whole rhombus.
   The hexagons are concentric and pointy-top, so the bands meet exactly on the
   Y. The fills cross-fade in CSS (global.css `.pv-lit`, staggered outer to
   inner; reduced motion switches at once). Decorative: the tabs are the
   control. */

import { index } from "../../motion/studioMotion";

export type LitFace = 0 | 1 | 2; // top, left, right

export interface LitPattern {
  /** the lit face of the outer, center and inner layer */
  faces: [LitFace, LitFace, LitFace];
  /** one LIT_TONES entry per layer, all three distinct */
  tones: [number, number, number];
}

/* green shades on ink, plus one light grey (as the demo state draws) */
export const LIT_TONES = [
  { fill: "#5AE36F", alpha: 0.55 },
  { fill: "#5AE36F", alpha: 0.16 },
  { fill: "#5AE36F", alpha: 0.85 },
  { fill: "#5AE36F", alpha: 0.32 },
  { fill: "#F2F2F2", alpha: 0.35 },
  { fill: "#F2F2F2", alpha: 0.12 },
] as const;

/* the server / first paint state: outer left in grey, center top dark green,
   inner right mid green (the brief's reference state) */
export const DEFAULT_LIT: LitPattern = { faces: [1, 0, 2], tones: [4, 1, 0] };

const pick = <T,>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)];

export function randomLit(previous?: LitPattern): LitPattern {
  for (;;) {
    const faces = [pick([0, 1, 2] as const), pick([0, 1, 2] as const), pick([0, 1, 2] as const)] as LitPattern["faces"];
    if (previous && faces.every((face, i) => face === previous.faces[i])) continue;
    const pool = LIT_TONES.map((_, i) => i);
    const tones = [0, 0, 0].map(() => pool.splice(Math.floor(Math.random() * pool.length), 1)[0]) as LitPattern["tones"];
    return { faces, tones };
  }
}

const S = Math.sqrt(3) / 2;
const fmt = (n: number) => Math.round(n * 100) / 100;

/** pointy-top hexagon outline about (cx, cy), vertex radius r */
export function hexPath(cx: number, cy: number, r: number) {
  return `M${fmt(cx)} ${fmt(cy - r)}L${fmt(cx + r * S)} ${fmt(cy - r / 2)}V${fmt(cy + r / 2)}L${fmt(cx)} ${fmt(cy + r)}L${fmt(cx - r * S)} ${fmt(cy + r / 2)}V${fmt(cy - r / 2)}Z`;
}

function rhombus(cx: number, cy: number, r: number, face: LitFace) {
  const top: [number, number] = [cx, cy - r];
  const ur: [number, number] = [cx + r * S, cy - r / 2];
  const lr: [number, number] = [cx + r * S, cy + r / 2];
  const bottom: [number, number] = [cx, cy + r];
  const ll: [number, number] = [cx - r * S, cy + r / 2];
  const ul: [number, number] = [cx - r * S, cy - r / 2];
  const c: [number, number] = [cx, cy];
  const points = face === 0 ? [top, ur, c, ul] : face === 1 ? [ul, c, bottom, ll] : [ur, lr, bottom, c];
  return `M${points.map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join("L")}Z`;
}

/* the nine face fills; drawn under the cube's outlines */
export function LitFaces({ cx, cy, radii, pattern }: { cx: number; cy: number; radii: [number, number, number]; pattern: LitPattern }) {
  return (
    <g className="pv-lit">
      {radii.map((r, layer) =>
        ([0, 1, 2] as const).map((face) => {
          const next = radii[layer + 1];
          const tone = LIT_TONES[pattern.tones[layer]];
          const d = rhombus(cx, cy, r, face) + (next ? rhombus(cx, cy, next, face) : "");
          return (
            <path
              key={`${layer}-${face}`}
              d={d}
              fillRule="evenodd"
              style={{
                fill: tone.fill,
                fillOpacity: pattern.faces[layer] === face ? tone.alpha : 0,
                ...index(layer),
              }}
            />
          );
        }),
      )}
    </g>
  );
}

/* the phone cube behind the \\Our Software Code rows (P1b CORR): the hero's
   drawing at r100 — light outer outline, green middle, green-to-light inner,
   the green Y over the middle hexagon and the light vertical below its centre */
const RADII: [number, number, number] = [100, 80, 52];

export function LitCube({ pattern, className }: { pattern: LitPattern; className?: string }) {
  const [r0, r1, r2] = RADII;
  return (
    <svg className={className} viewBox="-88 -102 176 204" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="pv-lit-inner" x1="0" y1={-r2} x2="0" y2={r0} gradientUnits="userSpaceOnUse">
          <stop stopColor="#5AE36F" />
          <stop offset="1" stopColor="#F2F2F2" />
        </linearGradient>
      </defs>
      <LitFaces cx={0} cy={0} radii={RADII} pattern={pattern} />
      <g strokeWidth="1">
        <path d={hexPath(0, 0, r0)} stroke="#F2F2F2" vectorEffect="non-scaling-stroke" />
        <path d={hexPath(0, 0, r1)} stroke="#5AE36F" vectorEffect="non-scaling-stroke" />
        <path d={hexPath(0, 0, r2)} stroke="url(#pv-lit-inner)" vectorEffect="non-scaling-stroke" />
        <path d={`M${fmt(-r1 * S)} ${-r1 / 2}L0 0L${fmt(r1 * S)} ${-r1 / 2}`} stroke="#5AE36F" vectorEffect="non-scaling-stroke" />
        <path d={`M0 0V${r1}`} stroke="#F2F2F2" vectorEffect="non-scaling-stroke" />
      </g>
    </svg>
  );
}
