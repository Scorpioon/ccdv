/* A6.1 (OPERATOR): the Products persistent cube, the phone cube (LitCube)
   rebuilt in 3D. Three nested cubes, orthographic, posed M = tilt · ISO.
   A10 (OPERATOR): the idle wobble and the spring kick on landing are gone; the
   cube rests in the phone pose and moves only on a step.
   N4 P-L (OPERATOR): the Studio sphere's push engine drives it. Each step is a
   push (tiltFloatingCube kicks a spin about the cube's own vertical axis), the
   spin decays by the sphere's friction and the cube may turn past 360 deg; the
   lit pattern changes half-way through the step. When the spin is nearly spent
   a critically damped spring settles the pose into the nearest of the cube's
   24 symmetric iso poses, so it always rests looking like the phone cube.
   The drawing shows the three faces of the corner nearest the viewer: the pose
   is re-anchored on the symmetry that puts a corner at the front, and the
   nested cubes (which share that corner at rest) go concentric while turning,
   so the re-anchoring never pops.
   One shared driver draws every copy (cover / module / rail) with the same
   pose, so the curtain shows no seam; attributes are written straight to the
   DOM (no React state per frame). The still iso pose is the server render, the
   first paint and the reduced-motion drawing; phones and tablets keep it too. */
import { useEffect, useId, useRef } from "react";
import { apply, IDENT, mul, rotX, rotY, type Mat3, type Vec3 } from "../marks/StudioMobileOrbit";
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
function drawing(m: Mat3, k: number): string[] {
  /* N4 P-L: k scales the nesting (1 = the shared front corner, 0 = concentric) */
  const off = OFFSET.map((o) => o * k);
  const faces = H.map((h, layer) => faceCorners(h).map((pts) => shift(pts, off[layer])));
  const out: string[] = [];
  for (let layer = 0; layer < 3; layer++) {
    for (let face = 0; face < 3; face++) {
      out.push(
        outline(m, faces[layer][face], true) + (layer < 2 ? outline(m, faces[layer + 1][face], true) : ""),
      );
    }
  }
  H.forEach((h, layer) => out.push(outline(m, shift(silhouetteCorners(h), off[layer]), true)));
  const mid = H[1];
  const [front, left, right, down] = shift(
    [
      [mid, mid, mid],
      [-mid, mid, mid],
      [mid, mid, -mid],
      [mid, -mid, mid],
    ],
    off[1],
  );
  out.push(outline(m, [left, front, right], false));
  out.push(outline(m, [front, down], false));
  return out;
}

/* the still pose: the server render, the first paint and reduced motion */
const REST = drawing(ISO, 1);

const LIT = [0, 1, 2].flatMap((layer) =>
  [0, 1, 2].map((face) => ({ layer, face, k: layer * 3 + face })),
);

/* N4 P-L (OPERATOR): the push engine, after useSphereMotion (StudioMobileOrbit):
   `drag` is the accumulated screen-space rotation (pose M = drag · ISO), `spin`
   an angular velocity in rad/s that a step kicks and the sphere's friction
   (3 /s) decays. A kick turns the cube about its own vertical axis by about
   (spin - 0.25) / 3 = 70 deg before the settle takes it on to the next quarter
   turn (stronger than the sphere's {0.9, 1.6}), with a small tumble; the sign
   is the scroll direction. Tune `spin` and `tumble` here. */
const CUBE_IMPULSE = { spin: 3.9, tumble: 0.5 };
const FRICTION = 3;
const SETTLE_BELOW = 0.25; // rad/s: under this the spin hands over to the settle
const SETTLE_W0 = 11; // rad/s, critically damped: ~0.4 s to settle
const SETTLE_H = 1 / 120; // s, the spring's integration step
const NEST_FULL = 0.15; // rad from a symmetric pose: nesting fully shared ...
const NEST_NONE = 0.5; // ... and fully concentric (a front-corner switch is > 0.6)

type Phase = "idle" | "spinning" | "settling";
type Copy = { draw: (d: string[]) => void };
const copies = new Set<Copy>();
let frame = 0;
let last = 0;
let timer = 0;
let midway: (() => void) | null = null;
let reducedAll = false;
let drag: Mat3 = IDENT;
const spin: Vec3 = [0, 0, 0];
let phase: Phase = "idle";
let target: Mat3 = IDENT;

const transpose = (m: Mat3): Mat3 => [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];
const dot = (a: Mat3, b: Mat3) => a.reduce((s, v, i) => s + v * b[i], 0); // tr(aT b)
const angleOf = (tr: number) => Math.acos(Math.max(-1, Math.min(1, (tr - 1) / 2)));

/* rotation by |v| rad about v (Rodrigues) */
function rotVec(v: Vec3): Mat3 {
  const a = Math.hypot(v[0], v[1], v[2]);
  if (a < 1e-9) return IDENT;
  const x = v[0] / a, y = v[1] / a, z = v[2] / a;
  const c = Math.cos(a), s = Math.sin(a), t = 1 - c;
  return [
    t * x * x + c, t * x * y - s * z, t * x * z + s * y,
    t * x * y + s * z, t * y * y + c, t * y * z - s * x,
    t * x * z - s * y, t * y * z + s * x, t * z * z + c,
  ];
}

/* the axis · angle of r (the nearest symmetric pose is always < 63 deg away) */
function logRot(r: Mat3): Vec3 {
  const v: Vec3 = [(r[7] - r[5]) / 2, (r[2] - r[6]) / 2, (r[3] - r[1]) / 2];
  const s = Math.hypot(v[0], v[1], v[2]);
  if (s < 1e-9) return [0, 0, 0];
  const f = angleOf(r[0] + r[4] + r[8]) / s;
  return [v[0] * f, v[1] * f, v[2] * f];
}

/* the cube's 24 rotations G (signed permutations, det +1): `corner` is G·(1,1,1)
   and `sym` = ISO · G · ISO⁻¹ the same symmetry in the drag's frame, so a drag
   equal to a `sym` poses M = sym · ISO = ISO · G, the iso cube turned */
const SYM = (() => {
  const isoT = transpose(ISO);
  const out: { g: Mat3; corner: Vec3; sym: Mat3 }[] = [];
  const perms: [number[], number][] = [[[0, 1, 2], 1], [[1, 2, 0], 1], [[2, 0, 1], 1], [[0, 2, 1], -1], [[1, 0, 2], -1], [[2, 1, 0], -1]];
  for (const [p, parity] of perms) {
    for (let bits = 0; bits < 8; bits++) {
      const sg = [bits & 1 ? -1 : 1, bits & 2 ? -1 : 1, bits & 4 ? -1 : 1];
      if (parity * sg[0] * sg[1] * sg[2] !== 1) continue;
      const g = new Array<number>(9).fill(0);
      p.forEach((col, row) => (g[row * 3 + col] = sg[row]));
      const gm = g as Mat3;
      out.push({
        g: gm,
        corner: [g[0] + g[1] + g[2], g[3] + g[4] + g[5], g[6] + g[7] + g[8]],
        sym: mul(mul(ISO, gm), isoT),
      });
    }
  }
  return out;
})();

/* the symmetric drag nearest to d, and its angle from d */
function nearest(d: Mat3) {
  let best = IDENT, tr = -Infinity;
  for (const { sym } of SYM) {
    const t = dot(sym, d);
    if (t > tr) { tr = t; best = sym; }
  }
  return { sym: best, angle: angleOf(tr) };
}

/* the pose to draw: M = drag · ISO re-anchored on the symmetry G that puts a
   corner at the front (the largest screen z of M · G · (1,1,1); +z faces the
   viewer, apply(ISO, [1,1,1]) = (0, 0, sqrt 3)), ties (the corner's three
   turns) to the one nearest ISO, so the lit faces keep their places. At a
   symmetric rest M · G = ISO exactly. */
function render() {
  const M = mul(drag, ISO);
  let pose = M, bestZ = -Infinity, bestTr = -Infinity;
  for (const { g, corner } of SYM) {
    const z = M[6] * corner[0] + M[7] * corner[1] + M[8] * corner[2];
    if (z < bestZ - 1e-9) continue;
    const m = mul(M, g);
    const tr = dot(ISO, m);
    if (z > bestZ + 1e-9 || tr > bestTr) {
      if (z > bestZ) bestZ = z;
      bestTr = tr;
      pose = m;
    }
  }
  /* the nesting goes concentric while the cube turns (a front-corner switch
     would move the inner cubes) and shares the corner again near the rest */
  const u = Math.max(0, Math.min(1, (nearest(drag).angle - NEST_FULL) / (NEST_NONE - NEST_FULL)));
  const d = drawing(pose, 1 - u * u * (3 - 2 * u));
  for (const copy of copies) copy.draw(d);
}

function runMidway() {
  window.clearTimeout(timer);
  const fn = midway;
  midway = null;
  fn?.();
}

function tick(now: number) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (phase === "spinning") {
    drag = mul(rotVec([spin[0] * dt, spin[1] * dt, spin[2] * dt]), drag);
    const f = Math.exp(-FRICTION * dt);
    for (let i = 0; i < 3; i++) spin[i] *= f;
    if (Math.hypot(spin[0], spin[1], spin[2]) < SETTLE_BELOW) {
      phase = "settling";
      target = nearest(drag).sym;
    }
  } else if (phase === "settling") {
    /* critically damped spring on the rotation drag -> target, starting from
       the spin's own velocity, so the hand-over is continuous */
    const n = Math.max(1, Math.ceil(dt / SETTLE_H));
    const h = dt / n;
    for (let s = 0; s < n; s++) {
      const e = logRot(mul(target, transpose(drag)));
      for (let i = 0; i < 3; i++) spin[i] += (SETTLE_W0 * SETTLE_W0 * e[i] - 2 * SETTLE_W0 * spin[i]) * h;
      drag = mul(rotVec([spin[0] * h, spin[1] * h, spin[2] * h]), drag);
    }
    const e = logRot(mul(target, transpose(drag)));
    if (Math.hypot(e[0], e[1], e[2]) < 1e-3 && Math.hypot(spin[0], spin[1], spin[2]) < 0.02) {
      /* settled: the target draws as the iso cube, so drag restarts at the
         identity (no drift from the accumulated products) */
      drag = IDENT;
      spin[0] = spin[1] = spin[2] = 0;
      phase = "idle";
    }
  }
  render();
  frame = phase === "idle" ? 0 : requestAnimationFrame(tick);
}

/* N4 P-L: a step began: push the cube (a kick on its spin, the sign is the
   scroll direction) and change the lit faces half-way through the step. Reduced
   motion, no copy on the page or no duration: only the change. */
export function tiltFloatingCube(direction: 1 | -1, durationMs: number, onMidway: () => void) {
  runMidway(); // a step whose change is still pending hands it over first
  if (reducedAll || copies.size === 0 || durationMs <= 0) {
    onMidway();
    return;
  }
  /* the spin is about the cube's own vertical axis as drawn now (M's second
     column), where every quarter turn is a symmetric pose, so the settle carries
     the push forward to the next iso pose instead of back; plus a small tumble
     about the screen's horizontal */
  const M = mul(drag, ISO);
  spin[0] += direction * (CUBE_IMPULSE.spin * M[1] - CUBE_IMPULSE.tumble);
  spin[1] += direction * CUBE_IMPULSE.spin * M[4];
  spin[2] += direction * CUBE_IMPULSE.spin * M[7];
  phase = "spinning";
  midway = onMidway;
  timer = window.setTimeout(runMidway, durationMs / 2);
  if (!frame) {
    last = performance.now();
    frame = requestAnimationFrame(tick);
  }
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
      draw: (d) => paths.current.forEach((p, k) => p?.setAttribute("d", d[k])),
    };
    copies.add(copy);

    return () => {
      copies.delete(copy);
      copy.draw(REST);
      if (copies.size === 0) {
        cancelAnimationFrame(frame);
        window.clearTimeout(timer);
        frame = 0;
        midway = null;
        drag = IDENT;
        spin[0] = spin[1] = spin[2] = 0;
        phase = "idle";
      }
    };
  }, [reduced]);

  return (
    <svg data-illo=""
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
        <g>
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
