/* A6.1 (OPERATOR): the Products persistent cube, the phone cube (LitCube)
   rebuilt in 3D. Three nested cubes, orthographic, posed M = tilt · ISO.
   A10 (OPERATOR): the idle wobble and the spring kick on landing are gone (the
   spring overshot: the cube rocked after every step). The cube rests in the
   phone pose and moves once per step, DURING the scroll: tiltFloatingCube
   tilts it out and back on the step's own cubic ease-in-out (zero speed at
   both ends, no overshoot), and the lit pattern changes at the half-way point.
   The nested cubes share the outer cube's front corner, so every layer's three
   visible faces lie in the same three planes: at rest the drawing is the phone
   cube's exactly, and tilted, the lit bands and the Y stay on their faces.
   One shared driver draws every copy (cover / module / rail) with the same
   pose, so the curtain shows no seam; attributes are written straight to the
   DOM (no React state per frame). The still iso pose is the server render, the
   first paint and the reduced-motion drawing; phones and tablets keep it too. */
import { useEffect, useId, useRef } from "react";
import { apply, mul, rotX, rotY, type Mat3, type Vec3 } from "../marks/StudioMobileOrbit";
import { index } from "../../motion/studioMotion";
import { LIT_TONES, type LitPattern } from "./LitCube";

/* hexagon circumradius per layer: outer, middle, inner (the phone cube's radii) */
const RADII = [100, 80, 52] as const;
/* half-size of each nested cube */
const H = RADII.map((r) => (r * Math.sqrt(1.5)) / 2);
/* A10: each inner cube is moved along the diagonal so its front corner is the
   outer cube's (h0, h0, h0); its centre still projects to the middle at iso */
const OFFSET = H.map((h) => H[0] - h);
const shift = (pts: Vec3[], o: number): Vec3[] => pts.map(([x, y, z]) => [x + o, y + o, z + o]);

const ISO: Mat3 = mul(rotX(Math.atan(1 / Math.SQRT2)), rotY(-Math.PI / 4));

const fmt = (n: number) => Math.round(n * 100) / 100;

const project = (m: Mat3, v: Vec3): [number, number] => {
  const p = apply(m, v);
  return [p[0], -p[1]];
};

/* closed or open polyline through the projected points */
function outline(m: Mat3, pts: Vec3[], closed: boolean) {
  const d = pts
    .map((v, k) => {
      const [x, y] = project(m, v);
      return `${k === 0 ? "M" : "L"}${fmt(x)} ${fmt(y)}`;
    })
    .join(" ");
  return closed ? `${d} Z` : d;
}

/* the three visible faces of a cube of half-size h, [top, left, right] */
const faceCorners = (h: number): Vec3[][] => [
  [
    [-h, h, -h],
    [h, h, -h],
    [h, h, h],
    [-h, h, h],
  ],
  [
    [-h, h, h],
    [h, h, h],
    [h, -h, h],
    [-h, -h, h],
  ],
  [
    [h, h, -h],
    [h, h, h],
    [h, -h, h],
    [h, -h, -h],
  ],
];

/* the hexagon outline of a cube of half-size h (its silhouette) */
const silhouetteCorners = (h: number): Vec3[] => [
  [-h, h, -h],
  [h, h, -h],
  [h, -h, -h],
  [h, -h, h],
  [-h, -h, h],
  [-h, h, h],
];

/* every path's d for the pose m, in the order of the JSX refs:
   0-8 lit (layer * 3 + face), 9-11 silhouettes (outer, middle, inner),
   12 the green Y, 13 the light vertical */
function drawing(m: Mat3): string[] {
  const faces = H.map((h, layer) => faceCorners(h).map((pts) => shift(pts, OFFSET[layer])));
  const out: string[] = [];
  for (let layer = 0; layer < 3; layer++) {
    for (let face = 0; face < 3; face++) {
      out.push(
        outline(m, faces[layer][face], true) + (layer < 2 ? outline(m, faces[layer + 1][face], true) : ""),
      );
    }
  }
  H.forEach((h, layer) => out.push(outline(m, shift(silhouetteCorners(h), OFFSET[layer]), true)));
  const mid = H[1];
  const [front, left, right, down] = shift(
    [
      [mid, mid, mid],
      [-mid, mid, mid],
      [mid, mid, -mid],
      [mid, -mid, mid],
    ],
    OFFSET[1],
  );
  out.push(outline(m, [left, front, right], false));
  out.push(outline(m, [front, down], false));
  return out;
}

/* the still pose: the server render, the first paint and reduced motion */
const REST = drawing(ISO);

const LIT = [0, 1, 2].flatMap((layer) =>
  [0, 1, 2].map((face) => ({ layer, face, k: layer * 3 + face })),
);

/* one driver for every copy on the page; every copy is drawn on every frame
   of a tilt (three small SVGs for 0.7 s), so none is left tilted under a
   curtain */
type Copy = { draw: (m: Mat3) => void };
const copies = new Set<Copy>();
let frame = 0;
let start = 0;
let span = 0;
let dir: 1 | -1 = 1;
let midway: (() => void) | null = null;
let reducedAll = false;

const TILT_Y = 0.32; // rad (~18 deg) about the screen's vertical at the peak
const TILT_X = 0.14; // rad (~8 deg) about the screen's horizontal
/* stepScroll.ts's ease, so the tilt rides the scroll */
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

const pose = (a: number): Mat3 => (a === 0 ? ISO : mul(mul(rotY(dir * TILT_Y * a), rotX(-dir * TILT_X * a)), ISO));

function runMidway() {
  const fn = midway;
  midway = null;
  fn?.();
}

function tick(now: number) {
  const t = Math.min(1, (now - start) / span);
  if (t >= 0.5) runMidway();
  const m = pose(t < 1 ? Math.sin(Math.PI * ease(t)) : 0);
  for (const copy of copies) copy.draw(m);
  frame = t < 1 ? requestAnimationFrame(tick) : 0;
}

/* A10: a step began: tilt out and back over its duration (rest -> peak ->
   rest), and change the lit faces half-way. Reduced motion, no copy on the
   page or no duration: only the change. */
export function tiltFloatingCube(direction: 1 | -1, durationMs: number, onMidway: () => void) {
  runMidway(); // a tilt still running hands over its change first
  if (reducedAll || copies.size === 0 || durationMs <= 0) {
    onMidway();
    return;
  }
  dir = direction;
  start = performance.now();
  span = durationMs;
  midway = onMidway;
  if (!frame) frame = requestAnimationFrame(tick);
}

export function FloatingCube({
  pattern,
  reduced,
  className,
  spawn,
}: {
  pattern: LitPattern;
  reduced: boolean;
  className?: string;
  spawn?: number;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const gradientId = `pv-float-g-${uid}`;
  const svgRef = useRef<SVGSVGElement>(null);
  const paths = useRef<(SVGPathElement | null)[]>([]);
  const ref = (k: number) => (node: SVGPathElement | null) => {
    paths.current[k] = node;
  };

  useEffect(() => {
    reducedAll = reduced;
    const node = svgRef.current;
    if (reduced || !node || !window.matchMedia("(min-width: 1024px)").matches) return;

    const copy: Copy = {
      draw: (m) => {
        const d = drawing(m);
        paths.current.forEach((p, k) => p?.setAttribute("d", d[k]));
      },
    };
    copies.add(copy);

    return () => {
      copies.delete(copy);
      copy.draw(ISO);
      if (copies.size === 0 && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
        midway = null;
      }
    };
  }, [reduced]);

  return (
    <svg
      ref={svgRef}
      className={className}
      viewBox="-120 -120 240 240"
      fill="none"
      overflow="visible"
      aria-hidden="true"
      focusable="false"
      data-spawn={spawn === undefined ? undefined : true}
      style={spawn === undefined ? undefined : index(spawn)}
    >
      <defs>
        <linearGradient id={gradientId} x1={0} y1={-52} x2={0} y2={100} gradientUnits="userSpaceOnUse">
          <stop stopColor="#5AE36F" />
          <stop offset="1" stopColor="#F2F2F2" />
        </linearGradient>
      </defs>
      <g className="pv-float__body">
        <g className="pv-lit">
          {LIT.map(({ layer, face, k }) => {
            const tone = LIT_TONES[pattern.tones[layer]];
            return (
              <path
                key={`lit-${k}`}
                ref={ref(k)}
                d={REST[k]}
                fillRule="evenodd"
                style={{
                  fill: tone.fill,
                  fillOpacity: pattern.faces[layer] === face ? tone.alpha : 0,
                  ...index(layer),
                }}
              />
            );
          })}
        </g>
        <g strokeWidth={1}>
          <path ref={ref(9)} d={REST[9]} stroke="#F2F2F2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          <path ref={ref(10)} d={REST[10]} stroke="#5AE36F" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          <path
            ref={ref(11)}
            d={REST[11]}
            stroke={`url(#${gradientId})`}
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
          />
          <path ref={ref(12)} d={REST[12]} stroke="#5AE36F" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          <path ref={ref(13)} d={REST[13]} stroke="#F2F2F2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        </g>
      </g>
    </svg>
  );
}
