import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode, RefObject } from "react";
import { Link } from "react-router";
import { SiteMasthead } from "../components/SiteMasthead";
import { SiteFooter } from "../components/SiteFooter";
import { ClippedHeading } from "../components/ClippedHeading";
import { PrincipleCardStatic } from "../components/PrincipleCard";
import { HexCube } from "../components/marks/HexCube";
import { StudioMobileMenu } from "../components/StudioMobileMenu";
import {
  IDENT,
  StudioMobileOrbit,
  apply,
  axisLine,
  mul,
  ringEllipse,
  useSphereMotion,
  wobble,
  writeEllipse,
  writeLine,
} from "../components/marks/StudioMobileOrbit";
import type { Mat3, Vec3 } from "../components/marks/StudioMobileOrbit";
import { useMotionPolicy } from "../motion/reducedMotion";
import { STUDIO_PRINCIPLES } from "../data/studioPrinciples";

export function meta() {
  return [{ title: "CCDV — Studio" }];
}

/* R4-B06: the ink-tone principle (Build with WrkOps™) is no longer the fourth
   accordion row; it is the standalone chapter after Studio Approach. The cards
   still list all four principles. */
const WRKOPS_PRINCIPLE = STUDIO_PRINCIPLES.find((principle) => principle.fanTone === "ink")!;
const ACCORDION_PRINCIPLES = STUDIO_PRINCIPLES.filter((principle) => principle.fanTone !== "ink");
/* R1-FB002-08: the chapter's visible title (the data's own label stays as it is
   for the squares and every other use); the strip renders the TM as a lighter,
   smaller superscript. */
const WRKOPS_TITLE = "Build /w WrkOps™";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const delay = (seconds: number) => ({ "--rd": `${seconds}s` }) as CSSProperties;

/* Masthead collapse (R1-FB002-01, supersedes the R4-B05 text threshold and its
   timed transition). A = expanded lilac (--mh-p 0), B = compact light (--mh-p 1).
   The black chapter's top edge is the controlling geometry: while it is below the
   masthead's bottom edge nothing happens; from the moment it reaches that edge
   (its distance from the top equals the full masthead height) every pixel of
   further scrolling shrinks the masthead by exactly that pixel, so its bottom
   edge and the black edge stay one line (no gap, no overlap) until the compact
   height is reached. Scrolling back reverses it exactly. No timers, no smoothing,
   no scroll ownership: p is a pure function of the edge's position. */

/* WrkOps -> CC.OS ground (R4-B07). WO_ON: fraction of the viewport height the
   CC.OS block's top must reach (from the top) before the change starts, so the
   last black beat gets room (was 0.95: started as the block entered). WO_SPAN:
   scroll distance of the change itself, as a fraction of the viewport (was 0.75).
   WO_TAU: smoothing time constant in seconds (was 0.16). */
const WO_ON = 0.6;
const WO_SPAN = 0.3;
const WO_TAU = 0.1;

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/* All strokes in the Studio illustrations are 0.5 (MTG05 R4-B03, B03-09). */
const STROKE = 0.5;
const LILAC = "#A864E2";

/* Orbit illustration (Frame 44 in work_assets/feedback_r4_2): two rounded rings,
   a Y of spokes and four lilac nodes. Rings are the reference outlines drawn as
   plain 0.5 strokes (Figma's masked inner-stroke trick is not reproduced). */
/* viewBox x starts at -0.5: the rings and the centre node are centred on
   x=148.0 (rings 19.37..275.77, node 148.035) while the box centre is 148.5, so
   the shift puts the visible centre on the wrapper centre (0.43u at 256u wide). */
function OrbitMark() {
  const id = `orbit-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const ramp = (n: number, x1: number, y1: number, x2: number, y2: number) => (
    <linearGradient id={`${id}-${n}`} gradientUnits="userSpaceOnUse" x1={x1} y1={y1} x2={x2} y2={y2}>
      <stop stopColor="#D4D4D4" />
      <stop offset="1" stopColor={LILAC} />
    </linearGradient>
  );
  return (
    <svg className="studio-art" viewBox="-0.5 0 297 297" fill="none" aria-hidden="true" focusable="false">
      <defs>
        {ramp(0, 228.837, 203.373, 272.235, 210.626)}
        {ramp(1, 148.035, 118, 148.035, 178)}
        {ramp(2, 148.535, 52, 148.535, 8)}
        {ramp(3, 66.7864, 201.306, 24.2857, 212.694)}
      </defs>
      <path
        d="M19.3681 148.035C19.3681 102.233 43.8034 59.9098 83.4693 37.0086C123.135 14.1075 172.006 14.1075 211.672 37.0086C251.337 59.9097 275.773 102.233 275.773 148.035C275.773 193.837 251.337 236.16 211.672 259.062C172.006 281.963 123.135 281.963 83.4693 259.062C43.8034 236.16 19.3681 193.837 19.3681 148.035Z"
        stroke="#CACAC8"
        strokeWidth={STROKE}
      />
      <path
        d="M45.4015 148.035C45.4015 111.393 64.9497 77.5345 96.6824 59.2136C128.415 40.8927 167.511 40.8927 199.244 59.2136C230.977 77.5345 250.525 111.393 250.525 148.035C250.525 184.677 230.977 218.535 199.244 236.856C167.512 255.177 128.415 255.177 96.6824 236.856C64.9497 218.535 45.4015 184.677 45.4015 148.035Z"
        stroke="#CACAC8"
        strokeWidth={STROKE}
      />
      <path d="M45.7949 207.143L148.034 148.035L250.275 207.143" stroke="#CACAC8" strokeWidth={STROKE} />
      <path d="M148.535 148.035V30.0894" stroke="#CACAC8" strokeWidth={STROKE} />
      <circle cx="251.8" cy="206.7" r="19" fill={`url(#${id}-0)`} />
      <circle cx="148.035" cy="148" r="25.5" fill={`url(#${id}-1)`} />
      <circle cx="148.5" cy="30" r="19" fill={`url(#${id}-2)`} />
      <circle cx="45.5" cy="207" r="19" fill={`url(#${id}-3)`} />
    </svg>
  );
}

/* Gear illustration (Frame 327): the eight-tooth outline with a lilac core.
   The core follows the 2026-11-06 re-export: a rounded shape centred on
   (148, 148) with a vertical grey -> lilac ramp. */
function GearOutlineMark() {
  const id = `gear-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg className="studio-art" viewBox="0 0 297 297" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="148" y1="170" x2="148" y2="126">
          <stop stopColor="#D4D4D4" />
          <stop offset="1" stopColor={LILAC} />
        </linearGradient>
      </defs>
      <path
        d={GEAR_OUTLINE}
        stroke="#D9D9D9"
        strokeWidth={STROKE}
      />
      <path
        d={GEAR_CORE}
        fill={`url(#${id})`}
      />
    </svg>
  );
}

/* --- R1-FB001: scroll-reel figures (phones, <768px) ---------------------------
   Geometry is read from the OPERATOR's local STUDIO_resp3.svg (390 wide
   artboard) and kept in artboard coordinates: every viewBox below is a window
   on that artboard. Each figure is hidden by CSS from 768px up (desktop keeps
   its existing composition) and is driven by exactly one loop that runs only
   while the figure is on screen. The verbatim drawing is what renders on the
   server, without JS and under reduced motion; motion only adds attributes. */

const smooth = (value: number) => {
  const v = clamp01(value);
  return v * v * (3 - 2 * v);
};

/* Phones only; false on the server and until mounted. */
function useNarrow() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const sync = () => setNarrow(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  return narrow;
}

/* One rAF driver per figure. `step(clock)` gets the running time in seconds
   (time spent off screen never counts, so leaving and returning never jumps)
   and writes attributes straight to the DOM; it is called once with 0 on mount
   so a figure's first painted state is its start state. `rest()` puts the
   verbatim drawing back (cleanup, or motion switched off). */
function useVisibleLoop(
  ref: RefObject<Element | null>,
  enabled: boolean,
  step: (clock: number) => void,
  rest: () => void,
) {
  const latest = useRef({ step, rest });
  latest.current = { step, rest };
  useEffect(() => {
    const node = ref.current;
    if (!node || !enabled) return;
    let frame = 0;
    let clock = 0;
    let last = 0;
    const tick = (now: number) => {
      clock += Math.min(0.1, Math.max(0, (now - last) / 1000));
      last = now;
      latest.current.step(clock);
      frame = requestAnimationFrame(tick);
    };
    const start = () => {
      if (frame) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };
    latest.current.step(0);
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()));
    if (observer) observer.observe(node);
    else start();
    return () => {
      observer?.disconnect();
      stop();
      latest.current.rest();
    };
  }, [ref, enabled]);
}

/* the intro gear (GearOutlineMark) outline and lilac core, shared with the conveyor */
const GEAR_OUTLINE =
  "M169.454 0H126.602C122.299 0 118.811 3.48828 118.811 7.79129V58.6648C118.811 65.6061 110.418 69.0823 105.51 64.1741L69.5347 28.1988C66.492 25.1561 61.5588 25.1561 58.5161 28.1989L28.2152 58.5005C25.1726 61.5432 25.1726 66.4763 28.2153 69.519L64.2131 105.517C69.1213 110.425 65.6451 118.817 58.7038 118.817H7.79129C3.48828 118.817 0 122.306 0 126.609V169.461C0 173.764 3.48828 177.252 7.79129 177.252H58.6902C65.6315 177.252 69.1077 185.644 64.1994 190.553L28.2046 226.547C25.1619 229.59 25.1619 234.523 28.2046 237.566L58.5054 267.867C61.5481 270.909 66.4812 270.909 69.5239 267.867L105.51 231.881C110.418 226.972 118.811 230.449 118.811 237.39V288.278C118.811 292.581 122.299 296.069 126.602 296.069H169.454C173.757 296.069 177.245 292.581 177.245 288.278V237.359C177.245 230.417 185.637 226.941 190.546 231.849L226.548 267.852C229.591 270.895 234.524 270.895 237.567 267.852L267.869 237.551C270.911 234.509 270.911 229.575 267.869 226.533L231.888 190.553C226.98 185.644 230.456 177.252 237.398 177.252H288.277C292.58 177.252 296.068 173.764 296.068 169.461V126.609C296.068 122.306 292.58 118.817 288.277 118.817H237.383C230.442 118.817 226.966 110.425 231.874 105.517L267.858 69.5327C270.901 66.49 270.901 61.5568 267.858 58.5142L237.557 28.2134C234.514 25.1707 229.581 25.1707 226.539 28.2134L190.546 64.2063C185.637 69.1145 177.245 65.6383 177.245 58.697V7.79129C177.245 3.48828 173.757 0 169.454 0Z";

const GEAR_CORE =
  "M138.474 164.5C144.369 167.903 151.631 167.903 157.526 164.5C163.421 161.097 167.053 154.807 167.053 148C167.053 141.193 163.421 134.903 157.526 131.5C151.631 128.097 144.369 128.097 138.474 131.5C132.579 134.903 128.947 141.193 128.947 148C128.947 154.807 132.579 161.097 138.474 164.5Z";

const INK = "#1A1A1A";
const LIGHT = "#F2F2F2";

/* --- The two lilac gyroscopes are spheres (R1-FB002-06/07/09) ------------------
   Both are drawn from a 3D model, not from the source's paths, and the model is
   fitted so that at rest it reproduces STUDIO_resp3.svg: outer circle, "+" axes,
   dashed rings (1.5s ramp from that pose). A pose M = wobble(t) * drag (the
   engine in StudioMobileOrbit.tsx) turns the whole system, so the rings, the
   axes, the needle and the cube always move together, through any angle, and
   everything inside the circle is clipped to it. Drawing, dash and tilt values
   below come from the artboard: viewBox x 0..390; Approach y 2573..3169, Build
   y 3831..4427. */
const GYRO_DASH = "5.5 6.5";
const gyroSlug = (id: string) => id.replace(/[^a-zA-Z0-9]/g, "");
type EllipseGeo = ReturnType<typeof ringEllipse>;
type LineGeo = ReturnType<typeof axisLine>;
const ellipseProps = (g: EllipseGeo) => ({
  cx: g.cx.toFixed(2),
  cy: g.cy.toFixed(2),
  rx: g.rx.toFixed(2),
  ry: g.ry.toFixed(2),
  transform: `rotate(${g.angle.toFixed(2)} ${g.cx.toFixed(2)} ${g.cy.toFixed(2)})`,
});
const lineProps = (g: LineGeo) => ({
  x1: g.x1.toFixed(2),
  y1: g.y1.toFixed(2),
  x2: g.x2.toFixed(2),
  y2: g.y2.toFixed(2),
});
/* the highlight in the lilac block follows where the figure's axis points, so
   the light reads as responding to the rotation (white over the canonical lilac
   only; unset = the static default in global.css) */
const setHighlight = (svg: SVGSVGElement | null, dir: Vec3 | null) => {
  const block = svg?.parentElement;
  if (!block) return;
  if (!dir) {
    block.style.removeProperty("--hx");
    block.style.removeProperty("--hy");
    return;
  }
  block.style.setProperty("--hx", `${(50 + 30 * dir[0]).toFixed(1)}%`);
  block.style.setProperty("--hy", `${(50 + 28 * dir[1]).toFixed(1)}%`);
};

/* Approach (artboard y 2573..3169). A sphere whose polar axis is the dotted
   needle (60 deg below +x on screen, 13 deg out of the screen: |n.z| = 0.225 is
   what makes the source's rings 0.225 as thin as they are long). The three rings
   are its equator (R = 164.16) and its two latitude circles +-117.3 along the
   needle (radius 114.8): the source's 232 x 52 ellipses 233.4 apart. Needle and
   rings are one rigid object; the "+" is the sphere's x and y diameters. */
const AP = { cx: 192.415, cy: 2881.59, r: 164.163 };
const AP_AXIS: Vec3 = [0.4872, 0.8439, 0.225];
const AP_LAT = 117.3;
const AP_LAT_R = 114.8;

function approachGeometry(m: Mat3) {
  const u = apply(m, AP_AXIS);
  return {
    rings: [
      ringEllipse(u, AP.cx, AP.cy, AP_LAT_R, -AP_LAT),
      ringEllipse(u, AP.cx, AP.cy, AP.r),
      ringEllipse(u, AP.cx, AP.cy, AP_LAT_R, AP_LAT),
    ],
    lines: [
      axisLine(apply(m, [0, 1, 0]), 192.662, 2881.585, 164.415),
      axisLine(apply(m, [1, 0, 0]), 192.411, 2881.84, 164.413),
      axisLine(u, AP.cx, AP.cy, AP.r * 1.0275), // meets the circle at rest; clipped when it lengthens
    ],
    dir: u,
  };
}

function ApproachGyro({ reduced }: { reduced: boolean }) {
  const clip = `apg-${gyroSlug(useId())}`;
  const svgRef = useRef<SVGSVGElement>(null);
  const ringRefs = useRef<(SVGEllipseElement | null)[]>([]);
  const lineRefs = useRef<(SVGLineElement | null)[]>([]);
  const write = (m: Mat3, live: boolean) => {
    const g = approachGeometry(m);
    g.rings.forEach((ring, i) => writeEllipse(ringRefs.current[i], ring));
    g.lines.forEach((line, i) => writeLine(lineRefs.current[i], line));
    setHighlight(svgRef.current, live ? g.dir : null);
  };

  useSphereMotion(svgRef, {
    reduced,
    interactive: true,
    draw: (drag, clock) => write(mul(wobble(clock), drag), true),
    rest: () => write(IDENT, false),
  });

  const rest = approachGeometry(IDENT);
  const stroke = { stroke: INK, strokeWidth: STROKE } as const;
  return (
    <svg
      ref={svgRef}
      className="studio-art studio-sphere"
      viewBox="0 2573 390 596"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      role="group"
      aria-roledescription="rotatable sphere"
      aria-label="Gyroscope drawing. Drag, or use the arrow keys, to turn it."
      tabIndex={0}
    >
      <defs>
        <clipPath id={clip}>
          <circle cx={AP.cx} cy={AP.cy} r={AP.r + 0.6} />
        </clipPath>
      </defs>
      <circle cx={AP.cx} cy={AP.cy} r={AP.r} {...stroke} />
      <g clipPath={`url(#${clip})`}>
        {rest.rings.map((ring, i) => (
          <ellipse
            key={i}
            ref={(node) => {
              ringRefs.current[i] = node;
            }}
            {...ellipseProps(ring)}
            {...stroke}
            strokeLinecap="round"
            strokeDasharray={GYRO_DASH}
          />
        ))}
        {rest.lines.map((line, i) => (
          <line
            key={i}
            ref={(node) => {
              lineRefs.current[i] = node;
            }}
            {...lineProps(line)}
            {...stroke}
            strokeDasharray={i === 2 ? "0.5 0.5" : undefined}
          />
        ))}
      </g>
    </svg>
  );
}

/* Build /w WrkOps™ (artboard y 3831..4427). A wireframe cube sits on a diameter
   of the circle (the axis, which runs through the cube's centre) and the two are
   one rigid body that sways like a heavy pendulum. The Saturn ring is a great
   circle with its own normal (0.229 thin, 15 deg off level): it takes the same
   sway 0.6s late and 1.8x wider, plus the user's drag, so it follows and
   outruns the axis. The cube is drawn as 12 projected edges with the edges of
   hidden faces left out: at rest that is the source's hexagon and its Y; turned,
   it stays a correct see-through cube. Never filled. */
const BU = { cx: 192.415, cy: 4080.59, r: 164.163 };
const CUBE_H = 47.15; // half edge: the isometric hexagon's circumradius 77 = 1.633 * H
const CUBE_VIEW: Mat3 = [
  0.70711, -0.70711, 0,
  0.40825, 0.40825, -0.8165,
  0.57735, 0.57735, 0.57735,
];
const RING_N0: Vec3 = [0.2519, 0.9402, 0.229];
const CUBE_VERTS: Vec3[] = Array.from({ length: 8 }, (_, i): Vec3 => [
  i & 4 ? CUBE_H : -CUBE_H,
  i & 2 ? CUBE_H : -CUBE_H,
  i & 1 ? CUBE_H : -CUBE_H,
]);
const CUBE_FACES: Vec3[] = [[-1, 0, 0], [1, 0, 0], [0, -1, 0], [0, 1, 0], [0, 0, -1], [0, 0, 1]];
/* edge: two vertex indices and the two faces it lies on */
const CUBE_EDGES = (() => {
  const edges: { i: number; j: number; f1: number; f2: number }[] = [];
  for (let axis = 0; axis < 3; axis++) {
    const bit = 4 >> axis;
    for (let i = 0; i < 8; i++) {
      if (i & bit) continue;
      const others = [0, 1, 2].filter((a) => a !== axis);
      const face = (a: number) => a * 2 + (i & (4 >> a) ? 1 : 0);
      edges.push({ i, j: i | bit, f1: face(others[0]), f2: face(others[1]) });
    }
  }
  return edges;
})();

function buildGeometry(axisPose: Mat3, ringPose: Mat3) {
  const g = mul(axisPose, CUBE_VIEW);
  const verts = CUBE_VERTS.map((v) => apply(g, v));
  const faceZ = CUBE_FACES.map((n) => apply(g, n)[2]);
  const axis = apply(axisPose, [0, -1, 0]);
  return {
    edges: CUBE_EDGES.map((e) => ({
      line: {
        x1: BU.cx + verts[e.i][0],
        y1: BU.cy + verts[e.i][1],
        x2: BU.cx + verts[e.j][0],
        y2: BU.cy + verts[e.j][1],
      },
      visible: faceZ[e.f1] > 0 || faceZ[e.f2] > 0,
    })),
    axis: axisLine(axis, BU.cx, BU.cy, BU.r),
    ring: ringEllipse(apply(ringPose, RING_N0), BU.cx, BU.cy, BU.r),
    dir: axis,
  };
}

function BuildGyro({ reduced }: { reduced: boolean }) {
  const clip = `bug-${gyroSlug(useId())}`;
  const svgRef = useRef<SVGSVGElement>(null);
  const ringRef = useRef<SVGEllipseElement>(null);
  const axisRef = useRef<SVGLineElement>(null);
  const edgeRefs = useRef<(SVGLineElement | null)[]>([]);
  const write = (axisPose: Mat3, ringPose: Mat3, live: boolean) => {
    const g = buildGeometry(axisPose, ringPose);
    writeEllipse(ringRef.current, g.ring);
    writeLine(axisRef.current, g.axis);
    g.edges.forEach((edge, i) => {
      const node = edgeRefs.current[i];
      writeLine(node, edge.line);
      node?.setAttribute("visibility", edge.visible ? "visible" : "hidden");
    });
    setHighlight(svgRef.current, live ? g.dir : null);
  };

  useSphereMotion(svgRef, {
    reduced,
    interactive: true,
    draw: (drag, clock) => write(mul(wobble(clock), drag), mul(wobble(clock, 1.8, 0.6), drag), true),
    rest: () => write(IDENT, IDENT, false),
  });

  const rest = buildGeometry(IDENT, IDENT);
  const stroke = { stroke: INK, strokeWidth: STROKE } as const;
  return (
    <svg
      ref={svgRef}
      className="studio-art studio-sphere"
      viewBox="0 3831 390 596"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      role="group"
      aria-roledescription="rotatable sphere"
      aria-label="Gyroscope drawing. Drag, or use the arrow keys, to turn it."
      tabIndex={0}
    >
      <defs>
        <clipPath id={clip}>
          <circle cx={BU.cx} cy={BU.cy} r={BU.r + 0.6} />
        </clipPath>
      </defs>
      <circle cx={BU.cx} cy={BU.cy} r={BU.r} {...stroke} />
      <g clipPath={`url(#${clip})`}>
        <ellipse ref={ringRef} {...ellipseProps(rest.ring)} {...stroke} strokeLinecap="round" strokeDasharray={GYRO_DASH} />
        <line ref={axisRef} {...lineProps(rest.axis)} {...stroke} />
        {rest.edges.map((edge, i) => (
          <line
            key={i}
            ref={(node) => {
              edgeRefs.current[i] = node;
            }}
            {...lineProps(edge.line)}
            visibility={edge.visible ? "visible" : "hidden"}
            stroke={INK}
            strokeWidth="0.9"
            strokeLinecap="round"
          />
        ))}
      </g>
    </svg>
  );
}

/* Black chapter 2, beat 1: three cubes (artboard y 4824..5144). The two lower
   cubes are fixed; the upper one starts nested in the notch between them (19u
   lower: its lower vertex rests on the notch) and, when the figure first
   reaches the middle of the screen, rises to the drawn position, then floats
   gently. Separation is a transition on the outer group, the float an
   animation on the inner one (see global.css), so nothing fights over one
   transform. The observer only writes data attributes. */
const CUBE_OUTLINE = "M0 0L75 43L74.927 129.36L0 172L-74 129V43Z";
const CUBE_STEM = "M0 171.89V86C29.289 69.21 45.211 59.79 74.5 43M0 85.99L-73.5 43";

function CubeDrawing({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={CUBE_OUTLINE} stroke={LIGHT} strokeWidth="0.77554" />
      <path d={CUBE_STEM} stroke={LIGHT} strokeWidth={STROKE} />
    </g>
  );
}

function ThreeCubes({ reduced }: { reduced: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const node = svgRef.current;
    if (!node || reduced || typeof IntersectionObserver === "undefined") return;
    node.setAttribute("data-armed", "true");
    const observer = new IntersectionObserver(
      ([entry]) => {
        node.setAttribute("data-live", entry.isIntersecting ? "true" : "false");
        if (entry.isIntersecting && entry.intersectionRatio >= 0.4) node.setAttribute("data-sep", "true");
      },
      { threshold: [0, 0.4] },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      node.removeAttribute("data-armed");
      node.removeAttribute("data-live");
      node.removeAttribute("data-sep");
    };
  }, [reduced]);

  return (
    <svg ref={svgRef} className="studio-art wo-cubes" viewBox="0 4800 390 360" fill="none" aria-hidden="true" focusable="false">
      <CubeDrawing x={120} y={4972.1} />
      <CubeDrawing x={269} y={4972.1} />
      <g className="wo-cubes__top">
        <g className="wo-cubes__float">
          <CubeDrawing x={194} y={4824.1} />
        </g>
      </g>
    </svg>
  );
}

/* Black chapter 2, beat 2: the five-column writing diagram (artboard y
   5494..5688), one deterministic timeline, T seconds long, looped:

     S0 anchors   the five upper segments and the lower baseline only
     S1 columns   each column writes its own stack of compact lines, top down,
                  at its own rhythm (COL_PACE) and start (COL_STAGGER)
     S2 route     the rising line draws left -> right: level, diagonal, level
     hold         everything shown
     S3 reset     the written lines and the route fade together, the anchors and
                  baseline never leave; the loop restarts at S0

   Lines draw with pathLength 1 + dashoffset, so one code path serves every
   segment; no random numbers, and the reset is invisible because every written
   line is already at progress 0 when the fade ends. */
const COL_TOPS: [number, number][] = [
  [28.5488, 75.7147],
  [98.75, 145.916],
  [168.949, 216.115],
  [239.15, 286.316],
  [309.35, 356.515],
];
const COL_LINE_Y = [5519.88, 5529.75, 5539.62, 5549.49, 5559.36, 5569.24, 5579.11, 5588.98, 5598.85, 5608.72, 5618.6];
const COL_LINES = [11, 6, 6, 6, 6];
const COL_PACE = [0.105, 0.09, 0.12, 0.098, 0.112];
const COL_STAGGER = 0.18;
const LINE_DRAW = 0.2;
const S1_AT = 0.9;
const S2_AT = 2.7;
const S2_FOR = 1.9;
const HOLD_UNTIL = 6.1;
const FADE_FOR = 0.45;
const LOOP_FOR = HOLD_UNTIL + FADE_FOR;
const easeOut = (value: number) => 1 - Math.pow(1 - clamp01(value), 3);

const WRITTEN = COL_LINES.flatMap((count, col) =>
  Array.from({ length: count }, (_, row) => ({
    col,
    row,
    x1: col === 0 ? 28 : COL_TOPS[col][0],
    x2: col === 0 ? 75.1658 : COL_TOPS[col][1],
    y: COL_LINE_Y[row],
  })),
);

function WritingDiagram({ reduced }: { reduced: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const writtenRef = useRef<SVGGElement>(null);
  const lineRefs = useRef<(SVGPathElement | null)[]>([]);
  const routeRef = useRef<SVGPathElement>(null);

  const draw = (node: SVGPathElement | null | undefined, progress: number) => {
    node?.setAttribute("stroke-dashoffset", (1 - progress).toFixed(4));
  };

  useVisibleLoop(
    svgRef,
    !reduced,
    (clock) => {
      const t = clock % LOOP_FOR;
      WRITTEN.forEach((line, i) => {
        const at = S1_AT + line.col * COL_STAGGER + line.row * COL_PACE[line.col];
        draw(lineRefs.current[i], easeOut((t - at) / LINE_DRAW));
      });
      draw(routeRef.current, easeOut((t - S2_AT) / S2_FOR));
      const fade = t > HOLD_UNTIL ? 1 - (t - HOLD_UNTIL) / FADE_FOR : 1;
      writtenRef.current?.setAttribute("opacity", clamp01(fade).toFixed(3));
      routeRef.current?.setAttribute("opacity", clamp01(fade).toFixed(3));
    },
    () => {
      lineRefs.current.forEach((node) => node?.removeAttribute("stroke-dashoffset"));
      routeRef.current?.removeAttribute("stroke-dashoffset");
      writtenRef.current?.removeAttribute("opacity");
      routeRef.current?.removeAttribute("opacity");
    },
  );

  const stroke = { stroke: LIGHT, strokeWidth: 0.54844 } as const;
  const dashed = { pathLength: 1, strokeDasharray: 1 } as const;
  return (
    <svg ref={svgRef} className="studio-art wo-diagram" viewBox="0 5470 390 240" fill="none" aria-hidden="true" focusable="false">
      {COL_TOPS.map(([x1, x2], col) => (
        <path key={col} d={`M${x1} 5494.1H${x2}`} {...stroke} />
      ))}
      <path d="M28.2734 5688.03H361.725" {...stroke} />
      <g ref={writtenRef}>
        {WRITTEN.map((line, i) => (
          <path
            key={`${line.col}-${line.row}`}
            ref={(node) => {
              lineRefs.current[i] = node;
            }}
            d={`M${line.x1} ${line.y}H${line.x2}`}
            {...stroke}
            {...dashed}
          />
        ))}
      </g>
      <path ref={routeRef} d="M28 5677.06H159.626L241.892 5629.56H362" {...stroke} {...dashed} />
    </svg>
  );
}

/* Black chapter 2, beat 3: the gear conveyor (gear artwork as in beat 3 of the
   intro, scaled to the artboard's 127.66u gears at a 135u pitch). A row of gear
   slots is indexed: each cycle the gears turn together (neighbours opposite,
   as meshed gears do) while the row rests, then the row advances exactly one
   pitch and rests again. Slots are repositioned after each step, so slot 0
   (the centre, x = 195) is always a gear. A gear's identity is k = slot +
   steps, which fixes its turning direction and tooth phase, so a step never
   changes either. R only advances during the rest, one tooth (45 deg) per
   cycle, so the angle is continuous across the step. */
const GEAR_SCALE = 127.66 / 296.069;
const GEAR_PITCH = 135;
const GEAR_SLOTS = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
const DWELL = 1.5;
const ADVANCE = 0.8;
const INDEX_FOR = DWELL + ADVANCE;
const inOut = (value: number) => smooth(value);

function GearConveyor({ reduced }: { reduced: boolean }) {
  const id = `conv-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const svgRef = useRef<SVGSVGElement>(null);
  const slotRefs = useRef<(SVGUseElement | null)[]>([]);

  const place = (clock: number) => {
    const steps = Math.floor(clock / INDEX_FOR);
    const u = clock - steps * INDEX_FOR;
    const turn = 45 * (steps + (u < DWELL ? inOut(u / DWELL) : 1));
    const shift = u < DWELL ? 0 : inOut((u - DWELL) / ADVANCE) * GEAR_PITCH;
    GEAR_SLOTS.forEach((slot, i) => {
      const k = slot + steps;
      const odd = ((k % 2) + 2) % 2;
      const angle = (odd ? -turn : turn) + (odd ? 22.5 : 0);
      const x = 195 + slot * GEAR_PITCH - shift;
      slotRefs.current[i]?.setAttribute(
        "transform",
        `translate(${x.toFixed(3)} 65) rotate(${angle.toFixed(3)}) scale(${GEAR_SCALE.toFixed(5)}) translate(-148.034 -148.034)`,
      );
    });
  };

  useVisibleLoop(svgRef, !reduced, place, () => place(0));

  /* the verbatim state is the t = 0 state: a gear on every slot, centre at 195 */
  const initial = (slot: number) =>
    `translate(${195 + slot * GEAR_PITCH} 65) rotate(${((slot % 2) + 2) % 2 ? 22.5 : 0}) scale(${GEAR_SCALE.toFixed(5)}) translate(-148.034 -148.034)`;
  return (
    <svg ref={svgRef} className="studio-art" viewBox="0 0 390 130" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="148" y1="170" x2="148" y2="126">
          <stop stopColor="#D4D4D4" />
          <stop offset="1" stopColor={LILAC} />
        </linearGradient>
        <g id={`${id}-gear`}>
          <path d={GEAR_OUTLINE} stroke={LIGHT} strokeWidth={STROKE} />
          <path d={GEAR_CORE} fill={`url(#${id})`} />
        </g>
      </defs>
      {GEAR_SLOTS.map((slot, i) => (
        <use
          key={slot}
          href={`#${id}-gear`}
          transform={initial(slot)}
          ref={(node) => {
            slotRefs.current[i] = node;
          }}
        />
      ))}
    </svg>
  );
}

/* Studio page, MTG05 R4-B03 (supersedes the R4-B01/B02 order; FBI-040..055).
   Studio only.

   Page flow, all in the document (no nested scroller, no scroll hijack):

     masthead (sticky, full lilac at first, compact white later)
     · lilac [Studio] hero, pinned while the black intro slides over it
     · black intro: three text beats, each with its own illustration
     · lilac [Studio Approach] strip (sticky within its section)
     · four static principle squares + four accordion rows · footer

   Header (R4-B05, supersedes the black-edge trigger). The masthead is sticky
   and has two resting states: A, full lilac, and B, compact light. `--mh-p`
   only travels between 0 (A) and 1 (B) during a short animation; it is never
   left in between. The black intro first shows an empty breathing interval at
   A; the switch to B starts when the first intro text nears the viewport
   (MH_ENTER / MH_LEAVE above). A margin keeps the masthead's flow footprint at
   full height, so content never moves faster than the page.
   `data-collapse="on"` is set from an effect: without JS the masthead is the
   plain full-size lilac one and scrolls away.

   Accordion (R4-B03, supersedes R4-B02). Fixed order, all closed on load; a
   click opens a closed row, a click on the open row closes it, so zero or one
   row is open. Nothing reorders and nothing scrolls the page.

   R4-B06: the group is [Studio Approach], a disclosure button that holds the
   four squares and three rows (closing it clears the open row). Build with
   WrkOps™ is no longer a row: it is its own chapter after it, with its own
   sticky strip and its own independent disclosure. Both open by default.

   Build with WrkOps™ is the one deliberately long section. The panel
   background runs black -> lilac from where the CC.OS block sits in the
   viewport (`--wo`), damped with a time-corrected exponential, reversible.

   Per-frame work is one rAF updater that writes CSS custom properties straight
   to the DOM (no React state). Reveals are presentation only: all copy is
   always in the DOM; hidden start states exist only where CSS scroll timelines
   apply or once `data-motion="on"` is set from an effect, i.e. never without
   JS, IntersectionObserver, or when reduced motion is set. */
export default function Studio() {
  const [selected, setSelected] = useState<number | null>(null);
  const [approachOpen, setApproachOpen] = useState(true);
  const [wrkopsOpen, setWrkopsOpen] = useState(true);
  const baseId = useId();
  const { reduced } = useMotionPolicy();
  const narrow = useNarrow();

  const rootRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const introRef = useRef<HTMLElement>(null);
  const woRef = useRef<HTMLDivElement>(null);
  const ccosRef = useRef<HTMLElement>(null);

  const panelId = (index: number) => `${baseId}-fan-${index}`;

  /* Progressive reveals: one observer, one-way (seen stays seen). Used where
     scroll timelines are unavailable; see the @supports block in global.css. */
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-seen", "true");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    root.querySelectorAll("[data-reveal]").forEach((node) => observer.observe(node));
    root.setAttribute("data-motion", "on");
    return () => {
      observer.disconnect();
      root.removeAttribute("data-motion");
      root.querySelectorAll("[data-seen]").forEach((node) => node.removeAttribute("data-seen"));
    };
  }, [reduced]);

  /* Scroll-linked state, written straight to the DOM (no re-render per frame):
     the masthead collapse progress from the black intro's top edge, and the
     WrkOps black->lilac progress from the CC.OS block's position. All geometry
     reads happen before any write in a frame. The masthead progress is exact
     (it must stay glued to the black edge); only the WrkOps ground is damped,
     with a frame-rate independent factor, and never touches window.scrollY. */
  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    const intro = introRef.current;
    if (!root || !intro) return;
    /* the masthead's two heights in px, resolved from the same CSS variables the
       layout uses (they are calc() in --u, so they are measured, not parsed) */
    const probe = document.createElement("div");
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none;width:0;height:0";
    root.appendChild(probe);
    let mhFull = 0;
    let mhRange = 0;
    const measure = () => {
      probe.style.height = "var(--mh-full)";
      mhFull = probe.getBoundingClientRect().height;
      probe.style.height = "var(--mh-range)";
      mhRange = probe.getBoundingClientRect().height;
    };

    let frame = 0;
    let active = false;
    let last = 0;
    let primed = false;
    let woNow = 0;
    let lastWo = "";
    let lastP = "";
    let lastTuck = "";

    const update = () => {
      frame = 0;
      const now = performance.now();
      const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
      last = now;

      // reads
      const edgeTop = intro.getBoundingClientRect().top;
      const wo = woRef.current;
      const ccos = ccosRef.current;
      const ccosTop = wo && ccos && !reduced ? ccos.getBoundingClientRect().top : 0;
      const vh = window.innerHeight;
      const hero = heroRef.current;
      const heroH = hero ? hero.offsetHeight : 0;
      const scrolled = window.scrollY;

      // masthead progress from the black edge (0 where there is no range: phones)
      const mhNow = mhRange > 0 ? clamp01((mhFull - edgeTop) / mhRange) : 0;

      // writes
      const p = mhNow.toFixed(5);
      if (p !== lastP) {
        lastP = p;
        root.style.setProperty("--mh-p", p);
      }

      /* R1-FB001 (phones): [Studio] rides up with the page instead of being
         covered by the black edge: the distance scrolled, capped at the hero's
         height. Written on the hero only (not the root), so a scroll frame
         re-styles one small subtree. Exact, never smoothed; unused by CSS
         from 768px up, and left at 0 under reduced motion. */
      if (hero) {
        const tuck = reduced ? "0" : Math.min(Math.max(scrolled, 0), heroH).toFixed(1);
        if (tuck !== lastTuck) {
          lastTuck = tuck;
          hero.style.setProperty("--tuck", `${tuck}px`);
        }
      }

      let settled = true;
      if (wo && ccos && !reduced) {
        /* B07-05: dwell and change are separate. Nothing happens until the CC.OS
           block's top has risen to WO_ON of the viewport (the preceding WrkOps
           beat keeps its black ground until then); the black -> lilac change
           then runs over the short WO_SPAN, eased at both ends (smoothstep). */
        const raw = clamp01((vh * WO_ON - ccosTop) / (vh * WO_SPAN));
        const target = raw * raw * (3 - 2 * raw);
        if (!primed) {
          woNow = target;
          primed = true;
        } else {
          woNow += (target - woNow) * (1 - Math.exp(-dt / WO_TAU));
          if (Math.abs(target - woNow) < 0.002) woNow = target;
          else settled = false;
        }
        const value = woNow.toFixed(3);
        if (value !== lastWo) {
          lastWo = value;
          wo.style.setProperty("--wo", value);
          /* B07-05: type flips in a narrow window around the point where light and
             dark type have equal contrast on the blended ground (~0.65), so the
             grey mid-tone on purple never lingers */
          wo.style.setProperty("--wo-text", clamp01((woNow - 0.6) / 0.12).toFixed(3));
        }
      }
      active = !settled;
      if (!settled) frame = requestAnimationFrame(update);
    };

    const schedule = () => {
      if (frame) return;
      if (!active) last = performance.now();
      frame = requestAnimationFrame(update);
    };
    const onResize = () => {
      measure();
      schedule();
    };

    root.setAttribute("data-collapse", "on");
    measure();
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", onResize);
      probe.remove();
      if (frame) cancelAnimationFrame(frame);
      root.removeAttribute("data-collapse");
      root.style.removeProperty("--mh-p");
      heroRef.current?.style.removeProperty("--tuck");
    };
  }, [reduced]);

  /* four informational squares: plain articles in a plain section. On phones
     they are the Approach carousel, shown only while no row is open (R1-FB001):
     the one `selected` state drives both, so there is no second source of truth
     and a row-to-row switch (A -> B) never passes through "none". Collapsing is
     CSS-only and phones-only (global.css); the hidden carousel leaves the tab
     order and the accessibility tree via visibility, and the row that was
     activated keeps focus. */
  const carouselOpen = selected === null;
  const cardsBlock = (
    <section
      className="section section--cards"
      aria-label="Core principles"
      data-collapsed={carouselOpen ? undefined : "true"}
      key="cards"
    >
      <div className="cards__clip">
        <div
          className="cards"
          role="group"
          aria-roledescription="carousel"
          aria-label="Core principles"
          tabIndex={narrow && carouselOpen ? 0 : undefined}
        >
          {STUDIO_PRINCIPLES.map((principle) => (
            <PrincipleCardStatic
              key={principle.key}
              label={principle.label}
              body={principle.summary}
            />
          ))}
        </div>
      </div>
    </section>
  );

  const fan = (index: number): ReactNode => {
    const principle = ACCORDION_PRINCIPLES[index];
    const open = selected === index;
    return (
      <div className="fan" key={principle.fanKey} data-tone={principle.fanTone} data-fan={index}>
        <ClippedHeading
          label={principle.fanLabel}
          expanded={open}
          onToggle={() => setSelected((current) => (current === index ? null : index))}
          panelId={panelId(index)}
        />
        <div
          id={panelId(index)}
          className="fan__panel"
          role="region"
          aria-label={principle.fanLabel}
          data-open={open}
          aria-hidden={open ? undefined : "true"}
        >
          <div className="fan__inner">
            <div className="fan__body">
              <div className="fan__copy">
                {principle.fanBody.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              {principle.fanSteps && (
                <div className="columns">
                  {principle.fanSteps.map((step) => (
                    <PrincipleCardStatic key={step.label} {...step} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* Build with WrkOps™ chapter body (R4-B06): the former fourth row's panel,
     content unchanged, now under its own sticky heading. */
  const [woLead, woHow, woDaily] = WRKOPS_PRINCIPLE.fanBody;
  const woBlock = (
    <div className="wo" ref={woRef} data-reduced={reduced ? "true" : undefined}>
      {/* R1-FB002-03: three text + drawing beats, the same grammar as the black
          intro: text above its drawing on phones, alternating sides from 768px
          (text | drawing, drawing | text, text | drawing). Copy is unchanged. */}
      <div className="wo__beat">
        <p data-reveal>{woLead}</p>
        <div className="wo__figure" data-reveal style={delay(0.25)} aria-hidden="true">
          <ThreeCubes reduced={reduced} />
        </div>
      </div>
      <div className="wo__beat" data-side="right">
        <p data-reveal>{woHow}</p>
        <div className="wo__figure" data-reveal style={delay(0.25)} aria-hidden="true">
          <WritingDiagram reduced={reduced} />
        </div>
      </div>
      <div className="wo__beat">
        <p data-reveal>{woDaily}</p>
        <div className="wo__figure wo__figure--gears" data-reveal style={delay(0.25)} aria-hidden="true">
          <GearConveyor reduced={reduced} />
        </div>
      </div>

      <section className="wo__ccos" ref={ccosRef} aria-labelledby="ccos-title">
        <div className="wo__ccos-head" data-reveal>
          <HexCube
            className="studio-hex wo__ccos-cube"
            variant="solid"
            gradientFrom="#FFFFFF"
            gradientTo={LILAC}
            lineColor="#D9D9D9"
            outerFill="#1A1A1A"
            lineWidth={STROKE}
          />
          <h3 className="ccos__wordmark" id="ccos-title">
            CC.OS
          </h3>
        </div>
        <div className="wo__ccos-copy">
          <p data-reveal>We build tools for the way we work.</p>
          <p data-reveal style={delay(0.12)}>
            CC.OS is the developing software environment behind our studio. Its components
            address different parts of our operations, including work management, project
            intelligence, information, security and business coordination.
          </p>
          <p data-reveal style={delay(0.24)}>
            We use these projects to explore new ways of connecting software, automation and AI
            with everyday work.
          </p>
        </div>
        <Link className="ccos__action" to="/products/ccos" data-reveal>
          Read dev notes <span aria-hidden="true">→</span>
        </Link>
        <span className="ccos__dot" aria-hidden="true" />
      </section>
    </div>
  );

  /* B06-02: closing the group also clears the open row, so reopening shows all
     three rows closed. Nothing scrolls and no focus moves. */
  const toggleApproach = () => {
    if (approachOpen) setSelected(null);
    setApproachOpen(!approachOpen);
  };

  /* fixed order: the squares, then the three rows as authored */
  const stack: ReactNode[] = [cardsBlock, ...ACCORDION_PRINCIPLES.map((_, index) => fan(index))];
  const approachId = `${baseId}-approach`;
  const wrkopsId = `${baseId}-wrkops`;

  return (
    <div className="r11 r11--studio" ref={rootRef}>
      {/* M1: operator-designed phone header + menu; hidden from 768px up, where
          the masthead below stays as is (and is hidden on phones). */}
      <StudioMobileMenu />
      <SiteMasthead variant="studio" />

      <div className="studio-top">
        {/* B03-01: the page opens on the full-lilac hero. It stays pinned while
            the black intro slides over it. B04-02: the hero ends at the
            baseline of [Studio], so the black edge cuts the brackets there. */}
        <section className="studio-hero" aria-labelledby="studio-hero" ref={heroRef}>
          <StudioMobileOrbit className="studio-hero__orbit" />
          <h1 className="studio-hero__label" id="studio-hero">
            [Studio]
          </h1>
          <span className="studio-hero__suffix" aria-hidden="true">
            :P
          </span>
        </section>

        {/* B03-04: three beats, each a paragraph with its own illustration.
            Plain visible content; the scroll-linked fade is CSS-only and
            applies only where scroll timelines exist and motion is allowed. */}
        <section className="studio-intro" ref={introRef} aria-label="About the studio">
          <div className="studio-beat">
            <p className="studio-beat__text">
              Collapse Creative Dev. Unit is a technical studio working across design, software
              development and applied research.
            </p>
            <div className="studio-beat__figure" aria-hidden="true">
              <HexCube
                className="studio-hex"
                variant="interior"
                gradientFrom={LILAC}
                gradientTo="#5C377C"
                lineColor="#6E6E6E"
                lineWidth={STROKE}
              />
            </div>
          </div>
          <div className="studio-beat" data-side="right">
            <p className="studio-beat__text">
              Our background is in visual design and digital experiences. Today, we use that
              knowledge to build web applications, custom tools and software around how people
              actually work.
            </p>
            <div className="studio-beat__figure" aria-hidden="true">
              <OrbitMark />
            </div>
          </div>
          <div className="studio-beat">
            <p className="studio-beat__text">
              We approach development through the interface, the underlying logic and the people
              who will use it.
            </p>
            <div className="studio-beat__figure" aria-hidden="true">
              <GearOutlineMark />
            </div>
          </div>
        </section>
      </div>

      {/* B06-02: the lilac strip is the group's disclosure button (not a link).
          B06-04: Build with WrkOps™ below is its own chapter with the same
          strip and the same independent disclosure. Each strip is sticky
          inside its own section only, so the two never stack. */}
      <section className="studio-approach" aria-label="Studio Approach">
        {/* R1-FB001/FB002: the lilac gyroscope that opens the chapter (a turnable sphere) */}
        <div className="studio-gyro">
          <ApproachGyro reduced={reduced} />
        </div>
        <div className="studio-strip" data-open={approachOpen}>
          <h2 className="studio-strip__heading">
            <button
              type="button"
              className="studio-strip__toggle"
              aria-expanded={approachOpen}
              aria-controls={approachId}
              onClick={toggleApproach}
            >
              <span className="studio-strip__title">
                <span className="studio-strip__label">[Studio Approach]</span>
                <span className="studio-strip__suffix" aria-hidden="true">
                  :P
                </span>
              </span>
              <span className="studio-strip__chevron" aria-hidden="true">
                v
              </span>
            </button>
          </h2>
        </div>

        <div
          id={approachId}
          className="studio-disc studio-stage"
          data-open={approachOpen}
          aria-hidden={approachOpen ? undefined : "true"}
        >
          <div className="studio-disc__inner">
            <div className="studio-disc__body">
              <div className="studio-stage__stack">{stack}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="studio-wrkops" aria-label={WRKOPS_TITLE}>
        <div className="studio-gyro">
          <BuildGyro reduced={reduced} />
        </div>
        <div className="studio-strip" data-open={wrkopsOpen}>
          <h2 className="studio-strip__heading">
            <button
              type="button"
              className="studio-strip__toggle"
              aria-expanded={wrkopsOpen}
              aria-controls={wrkopsId}
              onClick={() => setWrkopsOpen((current) => !current)}
            >
              <span className="studio-strip__title">
                <span className="studio-strip__label">[Build /w WrkOps<sup className="studio-strip__tm">™</sup>]</span>
              </span>
              <span className="studio-strip__chevron" aria-hidden="true">
                v
              </span>
            </button>
          </h2>
        </div>

        <div
          id={wrkopsId}
          className="studio-disc"
          data-open={wrkopsOpen}
          aria-hidden={wrkopsOpen ? undefined : "true"}
        >
          <div className="studio-disc__inner">
            <div className="studio-disc__body">{woBlock}</div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
