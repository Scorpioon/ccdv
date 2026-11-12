/* Studio artworks, moved out of routes/studio.tsx in R3 (no geometry change).
   Every figure is inline SVG, drawn from the OPERATOR's STUDIO_resp3.svg
   artboard coordinates; see each block's comment. IDs come from useId. */
import { useEffect, useId, useRef } from "react";
import type { RefObject } from "react";
import {
  IDENT,
  apply,
  axisLine,
  mul,
  ringEllipse,
  useSphereMotion,
  wobble,
  writeEllipse,
  writeLine,
} from "../marks/StudioMobileOrbit";
import type { Mat3, Vec3 } from "../marks/StudioMobileOrbit";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/* All strokes in the Studio illustrations are 0.5 (MTG05 R4-B03, B03-09). */
export const STROKE = 0.5;
export const LILAC = "#A864E2";

/* Orbit illustration (Frame 44 in work_assets/feedback_r4_2): two rounded rings,
   a Y of spokes and four lilac nodes. Rings are the reference outlines drawn as
   plain 0.5 strokes (Figma's masked inner-stroke trick is not reproduced). */
/* viewBox x starts at -0.5: the rings and the centre node are centred on
   x=148.0 (rings 19.37..275.77, node 148.035) while the box centre is 148.5, so
   the shift puts the visible centre on the wrapper centre (0.43u at 256u wide). */
export function OrbitMark() {
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
export function GearOutlineMark() {
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

/* One rAF driver per figure. `step(clock)` gets the running time in seconds
   (time spent off screen never counts, so leaving and returning never jumps)
   and writes attributes straight to the DOM; it is called once with 0 on mount
   so a figure's first painted state is its start state. `rest()` puts the
   verbatim drawing back (cleanup, or motion switched off). */
export function useVisibleLoop(
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
export const GEAR_OUTLINE =
  "M169.454 0H126.602C122.299 0 118.811 3.48828 118.811 7.79129V58.6648C118.811 65.6061 110.418 69.0823 105.51 64.1741L69.5347 28.1988C66.492 25.1561 61.5588 25.1561 58.5161 28.1989L28.2152 58.5005C25.1726 61.5432 25.1726 66.4763 28.2153 69.519L64.2131 105.517C69.1213 110.425 65.6451 118.817 58.7038 118.817H7.79129C3.48828 118.817 0 122.306 0 126.609V169.461C0 173.764 3.48828 177.252 7.79129 177.252H58.6902C65.6315 177.252 69.1077 185.644 64.1994 190.553L28.2046 226.547C25.1619 229.59 25.1619 234.523 28.2046 237.566L58.5054 267.867C61.5481 270.909 66.4812 270.909 69.5239 267.867L105.51 231.881C110.418 226.972 118.811 230.449 118.811 237.39V288.278C118.811 292.581 122.299 296.069 126.602 296.069H169.454C173.757 296.069 177.245 292.581 177.245 288.278V237.359C177.245 230.417 185.637 226.941 190.546 231.849L226.548 267.852C229.591 270.895 234.524 270.895 237.567 267.852L267.869 237.551C270.911 234.509 270.911 229.575 267.869 226.533L231.888 190.553C226.98 185.644 230.456 177.252 237.398 177.252H288.277C292.58 177.252 296.068 173.764 296.068 169.461V126.609C296.068 122.306 292.58 118.817 288.277 118.817H237.383C230.442 118.817 226.966 110.425 231.874 105.517L267.858 69.5327C270.901 66.49 270.901 61.5568 267.858 58.5142L237.557 28.2134C234.514 25.1707 229.581 25.1707 226.539 28.2134L190.546 64.2063C185.637 69.1145 177.245 65.6383 177.245 58.697V7.79129C177.245 3.48828 173.757 0 169.454 0Z";

const GEAR_CORE =
  "M138.474 164.5C144.369 167.903 151.631 167.903 157.526 164.5C163.421 161.097 167.053 154.807 167.053 148C167.053 141.193 163.421 134.903 157.526 131.5C151.631 128.097 144.369 128.097 138.474 131.5C132.579 134.903 128.947 141.193 128.947 148C128.947 154.807 132.579 161.097 138.474 164.5Z";

export const INK = "#1A1A1A";
export const LIGHT = "#F2F2F2";

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
/* R2-FB003-01: the white highlight that followed the axis is gone; the gyro
   block is the flat canonical lilac. */
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
/* R2-FB003-11 / E06: the cube's own vertical (face-normal) axis is the sphere's
   axis. Turned 45 deg about it and tipped 35.26 deg toward the viewer, the cube
   reads as the source hexagon whose near corner sits on the centre, and its top
   and bottom face centres lie on the screen-vertical axis. */
const CUBE_VIEW: Mat3 = [
  0.70711, 0, 0.70711,
  -0.40825, 0.8165, 0.40825,
  -0.57735, -0.57735, 0.57735,
];
/* 1 / 0.8165: stretches the axis so that, at rest, its projected pole meets the
   circle (as drawn); when turned it shortens like a real pole and the clip keeps
   it inside the circle */
const AXIS_REACH = 1.2247;
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
  const up = apply(g, [0, -1, 0]); // the cube's own axis, so the cube and the needle stay one body
  const segment = (face: Vec3, sign: 1 | -1) => {
    const p = apply(g, face);
    return {
      x1: BU.cx + p[0],
      y1: BU.cy + p[1],
      x2: BU.cx + sign * BU.r * AXIS_REACH * up[0],
      y2: BU.cy + sign * BU.r * AXIS_REACH * up[1],
    };
  };
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
    /* the needle enters the cube at the centre of its top face and leaves at the
       centre of its bottom face */
    axes: [segment([0, -CUBE_H, 0], 1), segment([0, CUBE_H, 0], -1)],
    ring: ringEllipse(apply(ringPose, RING_N0), BU.cx, BU.cy, BU.r),
  };
}

/* `tight` (R3, CC.OS scene): a window on the circle alone (artboard y
   3900..4264) instead of the whole 596-tall Build block. Same geometry. */
export function BuildGyro({ reduced, tight = false }: { reduced: boolean; tight?: boolean }) {
  const clip = `bug-${gyroSlug(useId())}`;
  const svgRef = useRef<SVGSVGElement>(null);
  const ringRef = useRef<SVGEllipseElement>(null);
  const axisRefs = useRef<(SVGLineElement | null)[]>([]);
  const edgeRefs = useRef<(SVGLineElement | null)[]>([]);
  const write = (axisPose: Mat3, ringPose: Mat3) => {
    const g = buildGeometry(axisPose, ringPose);
    writeEllipse(ringRef.current, g.ring);
    g.axes.forEach((axis, i) => writeLine(axisRefs.current[i], axis));
    g.edges.forEach((edge, i) => {
      const node = edgeRefs.current[i];
      writeLine(node, edge.line);
      node?.setAttribute("visibility", edge.visible ? "visible" : "hidden");
    });
  };

  useSphereMotion(svgRef, {
    reduced,
    interactive: true,
    draw: (drag, clock) => write(mul(wobble(clock), drag), mul(wobble(clock, 1.8, 0.6), drag)),
    rest: () => write(IDENT, IDENT),
  });

  const rest = buildGeometry(IDENT, IDENT);
  const stroke = { stroke: INK, strokeWidth: STROKE } as const;
  return (
    <svg
      ref={svgRef}
      className="studio-art studio-sphere"
      viewBox={tight ? "0 3900 390 364" : "0 3831 390 596"}
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
        {rest.axes.map((axis, i) => (
          <line
            key={i}
            ref={(node) => {
              axisRefs.current[i] = node;
            }}
            {...lineProps(axis)}
            {...stroke}
          />
        ))}
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

export function ThreeCubes({ reduced }: { reduced: boolean }) {
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

export function WritingDiagram({ reduced }: { reduced: boolean }) {
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

export function GearConveyor({ reduced }: { reduced: boolean }) {
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
