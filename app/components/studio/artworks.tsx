/* Studio artworks, moved out of routes/studio.tsx in R3 (no geometry change).
   Every figure is inline SVG, drawn from the OPERATOR's STUDIO_resp3.svg
   artboard coordinates; see each block's comment. IDs come from useId.
   R3 OPUS CORR01: the three Build card figures take a `frame` viewBox that puts
   them exactly where FB_R4_5.svg draws them inside a 284.67 x 450 card (the V2
   card art is the same geometry, scaled; see BUILD_FRAMES), and the CC.OS globe
   (CcosGyro) replaces BuildGyro. The intro's OrbitMark / GearOutlineMark left
   with the intro beats. */
import { useEffect, useId, useRef } from "react";
import type { RefObject } from "react";
import { IDENT, apply, mul, rotY, useSphereMotion } from "../marks/StudioMobileOrbit";
import type { Mat3, Vec3 } from "../marks/StudioMobileOrbit";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/* All strokes in the Studio illustrations are 0.5 (MTG05 R4-B03, B03-09). */
export const STROKE = 0.5;
export const LILAC = "#A864E2";

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

/* the eight-tooth gear outline and its lilac core, drawn by the conveyor */
export const GEAR_OUTLINE =
  "M169.454 0H126.602C122.299 0 118.811 3.48828 118.811 7.79129V58.6648C118.811 65.6061 110.418 69.0823 105.51 64.1741L69.5347 28.1988C66.492 25.1561 61.5588 25.1561 58.5161 28.1989L28.2152 58.5005C25.1726 61.5432 25.1726 66.4763 28.2153 69.519L64.2131 105.517C69.1213 110.425 65.6451 118.817 58.7038 118.817H7.79129C3.48828 118.817 0 122.306 0 126.609V169.461C0 173.764 3.48828 177.252 7.79129 177.252H58.6902C65.6315 177.252 69.1077 185.644 64.1994 190.553L28.2046 226.547C25.1619 229.59 25.1619 234.523 28.2046 237.566L58.5054 267.867C61.5481 270.909 66.4812 270.909 69.5239 267.867L105.51 231.881C110.418 226.972 118.811 230.449 118.811 237.39V288.278C118.811 292.581 122.299 296.069 126.602 296.069H169.454C173.757 296.069 177.245 292.581 177.245 288.278V237.359C177.245 230.417 185.637 226.941 190.546 231.849L226.548 267.852C229.591 270.895 234.524 270.895 237.567 267.852L267.869 237.551C270.911 234.509 270.911 229.575 267.869 226.533L231.888 190.553C226.98 185.644 230.456 177.252 237.398 177.252H288.277C292.58 177.252 296.068 173.764 296.068 169.461V126.609C296.068 122.306 292.58 118.817 288.277 118.817H237.383C230.442 118.817 226.966 110.425 231.874 105.517L267.858 69.5327C270.901 66.49 270.901 61.5568 267.858 58.5142L237.557 28.2134C234.514 25.1707 229.581 25.1707 226.539 28.2134L190.546 64.2063C185.637 69.1145 177.245 65.6383 177.245 58.697V7.79129C177.245 3.48828 173.757 0 169.454 0Z";

const GEAR_CORE =
  "M138.474 164.5C144.369 167.903 151.631 167.903 157.526 164.5C163.421 161.097 167.053 154.807 167.053 148C167.053 141.193 163.421 134.903 157.526 131.5C151.631 128.097 144.369 128.097 138.474 131.5C132.579 134.903 128.947 141.193 128.947 148C128.947 154.807 132.579 161.097 138.474 164.5Z";

export const INK = "#1A1A1A";
export const LIGHT = "#F2F2F2";

/* Card windows for the three Build figures (CORR01). FB_R4_5 draws each card
   284.667 x 450 with its figure at the positions below; the figures' own
   artboard geometry is the same drawing, scaled, so each window is the card
   rectangle expressed in the figure's artboard units:
     cubes  lower-left apex (96.41, 184.63) in the card = artboard (120, 4972.1),
            1 card unit = 1.6286 artboard units (cube half-width 46.05 vs 75)
     panel  column 1 rows start (27.80, 125.5) = artboard (28, 5494.1),
            1 card unit = 1.4580 (column 32.35 vs 47.17)
     gear   centre (142.33, 192.0) = artboard (195, 65), 1 card unit = 0.93387
            (gear 136.7 vs 127.66) */
export const BUILD_FRAMES = {
  cubes: "-37.01 4671.41 463.61 732.87",
  panel: "-12.53 5311.12 415.04 656.1",
  gear: "62.08 -114.3 265.84 420.24",
} as const;
/* In the card the conveyor shows one gear at rest (E08): the pitch puts the
   neighbours just outside the card (half card 132.92 + half gear 63.83). */
export const CARD_GEAR_PITCH = 200;

/* --- CC.OS globe (CORR01 OC01-07) ----------------------------------------------
   FB_R4_5.svg, y2962..3873: circle (475.5, 3417.5) r454.807; a filled lilac cube
   (isometric hexagon, verbatim path) with its Y; a rod from the circle's top to
   the top-face centre and one from the cube's centre down the front edge to the
   circle's bottom; a dashed great-circle ring. The cube, its rods and the
   circle are one fixed assembly, exactly as drawn (E13); only the ring turns:
   it precesses about the rod (the globe's axis, screen vertical) at a slow
   steady phase, and a drag or the arrow keys turn it further. The ring is split
   by depth, so its far half passes behind the opaque cube and its near half in
   front (the two ring paths of the original). Reduced motion: the drawing as
   authored, still turnable by drag/keys. */
const CG = { cx: 475.5, cy: 3417.5, r: 454.807 };
/* ring normal fitted to the original ring: major axis -15 deg, minor/major 0.236;
   z < 0 so the ring's lower arc is its near half (z toward the viewer is +, as
   in the engine), which is the arc the original draws over the cube */
const CG_RING_N0: Vec3 = [0.2519, 0.9402, -0.229];
const CG_RING_PERIOD = 48; // seconds per full precession
const CG_SAMPLES = 120;
const CG_CUBE = "M476.587 3205.42L661.332 3312.08V3525.41L476.587 3632.07L291.842 3525.41V3312.08L476.587 3205.42Z";

function ringHalves(n: Vec3) {
  const len = Math.hypot(n[0], n[1]) || 1;
  const u: Vec3 = [n[1] / len, -n[0] / len, 0];
  const v: Vec3 = [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]];
  const parts = { back: "", front: "" };
  let side: "back" | "front" | null = null;
  for (let i = 0; i <= CG_SAMPLES; i++) {
    const t = (i / CG_SAMPLES) * Math.PI * 2;
    const c = Math.cos(t);
    const s = Math.sin(t);
    const x = CG.cx + CG.r * (u[0] * c + v[0] * s);
    const y = CG.cy + CG.r * (u[1] * c + v[1] * s);
    const z = u[2] * c + v[2] * s;
    const now = z >= 0 ? "front" : "back";
    const point = `${x.toFixed(2)} ${y.toFixed(2)}`;
    parts[now] += now === side ? `L${point}` : `M${point}`;
    if (now !== side && side) parts[side] += `L${point}`;
    side = now;
  }
  return parts;
}

export function CcosGyro({ reduced }: { reduced: boolean }) {
  const clip = `cgy-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const svgRef = useRef<SVGSVGElement>(null);
  const backRef = useRef<SVGPathElement>(null);
  const frontRef = useRef<SVGPathElement>(null);
  const write = (pose: Mat3) => {
    const ring = ringHalves(apply(pose, CG_RING_N0));
    backRef.current?.setAttribute("d", ring.back);
    frontRef.current?.setAttribute("d", ring.front);
  };

  useSphereMotion(svgRef, {
    reduced,
    interactive: true,
    draw: (drag, clock) => write(mul(drag, rotY((clock / CG_RING_PERIOD) * Math.PI * 2))),
    rest: () => write(IDENT),
  });

  const rest = ringHalves(CG_RING_N0);
  const ink = { stroke: INK, strokeWidth: 1.38523 } as const;
  const ring = { ...ink, strokeLinecap: "round", strokeDasharray: "8 9" } as const;
  return (
    <svg
      ref={svgRef}
      className="cs__globe studio-sphere"
      viewBox="20 2961 911 913"
      fill="none"
      role="group"
      aria-roledescription="rotatable sphere"
      aria-label="CC.OS globe. Drag, or use the arrow keys, to turn its ring."
      tabIndex={0}
    >
      <defs>
        <clipPath id={clip}>
          <circle cx={CG.cx} cy={CG.cy} r={CG.r + 0.8} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <path ref={backRef} d={rest.back} {...ring} />
        <circle cx={CG.cx} cy={CG.cy} r={CG.r} {...ink} />
        <path d={CG_CUBE} fill={LILAC} stroke={INK} strokeWidth="1.47527" strokeLinejoin="round" />
        <path d="M290.965 3313.47L475.198 3418.75L659.435 3313.47" stroke={INK} strokeWidth="1.47527" />
        <path d="M477.125 3418.64L477.125 3873" stroke={INK} strokeWidth="1.47527" />
        <line x1="475.048" y1="2961.52" x2="475.048" y2="3313.37" {...ink} />
        <path ref={frontRef} d={rest.front} {...ring} />
      </g>
      <circle className="studio-sphere__hit" cx={CG.cx} cy={CG.cy} r={CG.r} fill="transparent" />
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

export function ThreeCubes({ reduced, frame = "0 4800 390 360" }: { reduced: boolean; frame?: string }) {
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
    <svg ref={svgRef} className="studio-art wo-cubes" viewBox={frame} fill="none" aria-hidden="true" focusable="false">
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

export function WritingDiagram({ reduced, frame = "0 5470 390 240" }: { reduced: boolean; frame?: string }) {
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
    <svg ref={svgRef} className="studio-art wo-diagram" viewBox={frame} fill="none" aria-hidden="true" focusable="false">
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
const GEAR_PITCH = 135; // the reel row; a card passes CARD_GEAR_PITCH
const GEAR_SLOTS = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
const DWELL = 1.5;
const ADVANCE = 0.8;
const INDEX_FOR = DWELL + ADVANCE;
const inOut = (value: number) => smooth(value);

export function GearConveyor({
  reduced,
  frame = "0 0 390 130",
  pitch = GEAR_PITCH,
}: {
  reduced: boolean;
  frame?: string;
  pitch?: number;
}) {
  const id = `conv-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const svgRef = useRef<SVGSVGElement>(null);
  const slotRefs = useRef<(SVGUseElement | null)[]>([]);

  const place = (clock: number) => {
    const steps = Math.floor(clock / INDEX_FOR);
    const u = clock - steps * INDEX_FOR;
    const turn = 45 * (steps + (u < DWELL ? inOut(u / DWELL) : 1));
    const shift = u < DWELL ? 0 : inOut((u - DWELL) / ADVANCE) * pitch;
    GEAR_SLOTS.forEach((slot, i) => {
      const k = slot + steps;
      const odd = ((k % 2) + 2) % 2;
      const angle = (odd ? -turn : turn) + (odd ? 22.5 : 0);
      const x = 195 + slot * pitch - shift;
      slotRefs.current[i]?.setAttribute(
        "transform",
        `translate(${x.toFixed(3)} 65) rotate(${angle.toFixed(3)}) scale(${GEAR_SCALE.toFixed(5)}) translate(-148.034 -148.034)`,
      );
    });
  };

  useVisibleLoop(svgRef, !reduced, place, () => place(0));

  /* the verbatim state is the t = 0 state: a gear on every slot, centre at 195 */
  const initial = (slot: number) =>
    `translate(${195 + slot * pitch} 65) rotate(${((slot % 2) + 2) % 2 ? 22.5 : 0}) scale(${GEAR_SCALE.toFixed(5)}) translate(-148.034 -148.034)`;
  return (
    <svg ref={svgRef} className="studio-art" viewBox={frame} fill="none" aria-hidden="true" focusable="false">
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
