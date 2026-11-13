/* Services R1 CORR01: the seven card figures. Each is drawn in its export's own
   card coordinates (SERVICES_v2 cards are 303.644 wide; the viewBox is the card,
   so the figure sits where the export draws it) and has one calm loop that runs
   only while it is on screen (useVisibleLoop). The rendered markup is the
   figure's rest state: what shows on the server, without JS, under reduced
   motion and when the loop stops.

   Work with CCDV (Frame 348..350, 303.644 x 480):
     DiagnoseArt      three stacked cubes, the outer two dimmed; the dashed
                      production ellipse scans slowly down through all three and
                      back (its far half passes behind each cube, its near half
                      in front); a cube brightens a little while it is scanned
     IntelligenceArt  the centre cube holds; the four others drift straight out
                      from it, pause, and come back to where they were drawn
                      (near the centre, never into it), each on its own phase
     ModularArt       the large centre cube holds; the six modules trade slots
                      clockwise one step at a time, slow and continuous; the one
                      passing the top leaves outward and a new one enters
   Formation (SERVICES_v2 cards):
     GearMeshArt      the centre gear turns; a gear slides in from the right,
                      meshes, both turn, it leaves; then the same from the left
                      (teeth phased 22.5 deg, tip to gap, never overlapping)
     AdvanceArrowArt  the one arrow steps from lower left to upper right with
                      two stops, fades out, and comes back to its start
     NetworkArt       Frame 353's network builds left to right: the input cube,
                      each column, then that column's threads, which sag a
                      little and keep a faint living tension; then it resets
     ToolmakingArt    the cube rain (VoxelRain): the drawn cluster, then the
                      ring base (Group 388), then the stepped pyramid built on
                      that base (Group 392) */
import { useId, useRef } from "react";
import { GEAR_CORE, GEAR_OUTLINE, LILAC, useVisibleLoop } from "../studio/artworks";
import { ARROW } from "./ArrowTrace";
import { VoxelRain } from "./VoxelRain";
import { CUBE_HEX, CUBE_Y, TOOLMAKING_SHAPES } from "./voxelShapes";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (v: number) => {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
};
const CARD_W = 303.644;

function Cube({ x, y, s = 1, opacity }: { x: number; y: number; s?: number; opacity?: number }) {
  return (
    <g transform={`translate(${x} ${y})${s === 1 ? "" : ` scale(${s})`}`} opacity={opacity}>
      <path className="sv-ca__cube" d={CUBE_HEX} />
      <path className="sv-ca__edge" d={CUBE_Y} />
    </g>
  );
}

/* --- Diagnose (Frame 348) ---------------------------------------------------- */
const DIAG_CUBES: [number, number][] = [
  [151.538, 50.551],
  [151.546, 171.363],
  [151.554, 291.145],
];
const DIAG_CENTRES = DIAG_CUBES.map(([, y]) => y + 42.857);
const DIAG_RING = { cx: 151.55, rx: 110, ry: 24.3 };
const DIAG_DIM = 0.3;
const DIAG_SCAN_DIM = 0.5;
const DIAG_PERIOD = 9;

const ringArc = (cy: number, half: "back" | "front") => {
  const { cx, rx, ry } = DIAG_RING;
  return half === "back"
    ? `M${cx - rx} ${cy}A${rx} ${ry} 0 0 1 ${cx + rx} ${cy}`
    : `M${cx + rx} ${cy}A${rx} ${ry} 0 0 1 ${cx - rx} ${cy}`;
};

export function DiagnoseArt({ reduced }: { reduced: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const backRef = useRef<SVGPathElement>(null);
  const frontRef = useRef<SVGPathElement>(null);
  const cubeRefs = useRef<(SVGGElement | null)[]>([]);
  const place = (cy: number) => {
    backRef.current?.setAttribute("d", ringArc(cy, "back"));
    frontRef.current?.setAttribute("d", ringArc(cy, "front"));
    [0, 2].forEach((i) => {
      const near = clamp01(1 - Math.abs(cy - DIAG_CENTRES[i]) / 70);
      cubeRefs.current[i]?.setAttribute("opacity", (DIAG_DIM + (DIAG_SCAN_DIM - DIAG_DIM) * smooth(near)).toFixed(3));
    });
  };
  const mid = DIAG_CENTRES[1];
  const amp = DIAG_CENTRES[2] - mid;
  /* starts on the middle cube (the drawn state), goes down, up, back */
  useVisibleLoop(svgRef, !reduced, (clock) => place(mid + amp * Math.sin((clock / DIAG_PERIOD) * Math.PI * 2)), () => place(mid));

  return (
    <svg ref={svgRef} className="studio-art sv-ca" viewBox={`0 0 ${CARD_W} 480`} fill="none" aria-hidden="true" focusable="false">
      <path ref={backRef} className="sv-ca__ring" d={ringArc(mid, "back")} />
      {DIAG_CUBES.map(([x, y], i) => (
        <g
          key={i}
          ref={(node) => {
            cubeRefs.current[i] = node;
          }}
          opacity={i === 1 ? undefined : DIAG_DIM}
        >
          <Cube x={x} y={y} />
        </g>
      ))}
      <path ref={frontRef} className="sv-ca__ring" d={ringArc(mid, "front")} />
    </svg>
  );
}

/* --- Product intelligence (Frame 349) ---------------------------------------- */
/* drawing order of the export; index 2 is the centre */
const INTEL: [number, number][] = [
  [105.648, 141],
  [151.21, 216.086],
  [151.194, 162.473],
  [197.499, 190],
  [151.187, 108.609],
];
const INTEL_CENTRE = 2;
const INTEL_REACH = 15;
const INTEL_PERIOD = 7.5;
const INTEL_DIRS = INTEL.map(([x, y]) => {
  const [cx, cy] = INTEL[INTEL_CENTRE];
  const len = Math.hypot(x - cx, y - cy) || 1;
  return [(x - cx) / len, (y - cy) / len];
});
/* out 0..1.8 s, pause to 3.4, back by 5.2, rest to the period's end */
const intelReach = (t: number) => (t < 1.8 ? smooth(t / 1.8) : t < 3.4 ? 1 : t < 5.2 ? 1 - smooth((t - 3.4) / 1.8) : 0);

export function IntelligenceArt({ reduced }: { reduced: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const cubeRefs = useRef<(SVGGElement | null)[]>([]);
  const place = (clock: number) =>
    INTEL.forEach(([x, y], i) => {
      if (i === INTEL_CENTRE) return;
      const phase = (((clock - i * 0.35) % INTEL_PERIOD) + INTEL_PERIOD) % INTEL_PERIOD;
      const r = clock > 0 ? INTEL_REACH * intelReach(phase) : 0;
      cubeRefs.current[i]?.setAttribute("transform", `translate(${(x + INTEL_DIRS[i][0] * r).toFixed(2)} ${(y + INTEL_DIRS[i][1] * r).toFixed(2)})`);
    });
  useVisibleLoop(svgRef, !reduced, place, () => place(0));

  return (
    <svg ref={svgRef} className="studio-art sv-ca" viewBox={`0 0 ${CARD_W} 480`} fill="none" aria-hidden="true" focusable="false">
      {INTEL.map(([x, y], i) => (
        <g
          key={i}
          ref={(node) => {
            cubeRefs.current[i] = node;
          }}
          transform={`translate(${x} ${y})`}
        >
          <path className="sv-ca__cube" d={CUBE_HEX} />
          <path className="sv-ca__edge" d={CUBE_Y} />
        </g>
      ))}
    </svg>
  );
}

/* --- Modular approach (Frame 350) -------------------------------------------- */
/* the six module slots, clockwise from the top; the large centre cube */
const MOD_SLOTS: [number, number][] = [
  [151.569, 75.848],
  [225.569, 118.848],
  [225.569, 205.848],
  [151.569, 248.848],
  [77.57, 205.848],
  [77.57, 118.848],
];
const MOD_CENTRE = { x: 151.4, y: 132.555, s: 1.6835 };
const MOD_MOVE = 1.8;
const MOD_REST = 1.6;
const MOD_STEP = MOD_MOVE + MOD_REST;
const MOD_REACH = 34; // how far a leaving / entering module travels outward

export function ModularArt({ reduced }: { reduced: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const cubeRefs = useRef<(SVGGElement | null)[]>([]);
  const n = MOD_SLOTS.length;
  const place = (clock: number) => {
    const steps = Math.floor(clock / MOD_STEP);
    const u = clock - steps * MOD_STEP;
    const p = u < MOD_MOVE ? smooth(u / MOD_MOVE) : 1;
    MOD_SLOTS.forEach((_, i) => {
      const from = (i + steps) % n;
      const to = (from + 1) % n;
      let x: number;
      let y: number;
      let alpha = 1;
      if (to === 0) {
        /* across the top: the old module leaves outward, a new one enters */
        const out = p < 0.5;
        const [sx, sy] = out ? MOD_SLOTS[from] : MOD_SLOTS[to];
        const k = out ? p * 2 : 1 - (p - 0.5) * 2;
        const dx = sx - (MOD_CENTRE.x);
        const dy = sy - (MOD_CENTRE.y + 42.857 * MOD_CENTRE.s - 42.857);
        const len = Math.hypot(dx, dy) || 1;
        x = sx + (dx / len) * MOD_REACH * smooth(k);
        y = sy + (dy / len) * MOD_REACH * smooth(k);
        alpha = 1 - smooth(k);
      } else {
        x = MOD_SLOTS[from][0] + (MOD_SLOTS[to][0] - MOD_SLOTS[from][0]) * p;
        y = MOD_SLOTS[from][1] + (MOD_SLOTS[to][1] - MOD_SLOTS[from][1]) * p;
      }
      const node = cubeRefs.current[i];
      node?.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
      node?.setAttribute("opacity", alpha.toFixed(3));
    });
  };
  /* rest: module i on slot i, the drawing */
  useVisibleLoop(svgRef, !reduced, (clock) => place(Math.max(0, clock - MOD_REST)), () => place(0));

  return (
    <svg ref={svgRef} className="studio-art sv-ca" viewBox={`0 0 ${CARD_W} 480`} fill="none" aria-hidden="true" focusable="false">
      {MOD_SLOTS.map(([x, y], i) => (
        <g
          key={i}
          ref={(node) => {
            cubeRefs.current[i] = node;
          }}
          transform={`translate(${x} ${y})`}
        >
          <path className="sv-ca__cube" d={CUBE_HEX} />
          <path className="sv-ca__edge" d={CUBE_Y} />
        </g>
      ))}
      <Cube x={MOD_CENTRE.x} y={MOD_CENTRE.y} s={MOD_CENTRE.s} />
    </svg>
  );
}

/* --- Tailored formation (Frame 354 / SERVICES_v2 card, 303.644 x 275.22) ------ */
const GEAR_C = { x: 151.82, y: 111.31 };
const GEAR_S = 145.818 / 296.069;
/* the outline's eight parallel-sided teeth (58.4 wide) are wider than any gap
   between them, so two of these gears cannot interleave without overlapping:
   they mesh tip to gap, 4 units apart (centre distance 300 of 296 outline) */
const GEAR_MESH = 300 * GEAR_S;
const GEAR_AWAY = 210; // a partner's start / end distance, outside the card
const GEAR_SPEED = 16; // deg/s
const G = { alone: 1.6, enter: 1.4, mesh: 3.0, leave: 1.4 };
const G_HALF = G.alone + G.enter + G.mesh + G.leave;
const gearAt = (x: number, y: number, deg: number) =>
  `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${deg.toFixed(2)}) scale(${GEAR_S.toFixed(5)}) translate(-148.034 -148.034)`;

export function GearMeshArt({ reduced }: { reduced: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const centreRef = useRef<SVGGElement>(null);
  const partnerRef = useRef<SVGGElement>(null);
  const place = (clock: number) => {
    const turn = clock * GEAR_SPEED;
    centreRef.current?.setAttribute("transform", gearAt(GEAR_C.x, GEAR_C.y, turn));
    const half = Math.floor(clock / G_HALF);
    const side = half % 2 === 0 ? 1 : -1; // right first, then left
    const u = clock - half * G_HALF - G.alone;
    const k = u < 0 ? 0 : u < G.enter ? smooth(u / G.enter) : u < G.enter + G.mesh ? 1 : 1 - smooth((u - G.enter - G.mesh) / G.leave);
    const dist = GEAR_AWAY + (GEAR_MESH - GEAR_AWAY) * k;
    const partner = partnerRef.current;
    if (!partner) return;
    partner.setAttribute("transform", gearAt(GEAR_C.x + side * dist, GEAR_C.y, 22.5 - turn));
    partner.setAttribute("opacity", u < 0 ? "0" : "1");
  };
  useVisibleLoop(svgRef, !reduced, place, () => place(0));

  const id = `gm-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const gear = (
    <>
      <path className="sv-ca__gear" d={GEAR_OUTLINE} />
      <path d={GEAR_CORE} fill={`url(#${id})`} />
    </>
  );
  return (
    <svg ref={svgRef} className="studio-art sv-ca" viewBox={`0 0 ${CARD_W} 275.22`} fill="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="148" y1="170" x2="148" y2="126">
          <stop stopColor="#D4D4D4" />
          <stop offset="1" stopColor={LILAC} />
        </linearGradient>
      </defs>
      <g ref={partnerRef} opacity={0} transform={gearAt(GEAR_C.x + GEAR_AWAY, GEAR_C.y, 22.5)}>
        {gear}
      </g>
      <g ref={centreRef} transform={gearAt(GEAR_C.x, GEAR_C.y, 0)}>
        {gear}
      </g>
    </svg>
  );
}

/* --- Keep up with advancements (SERVICES_v2 card, 303.644 x 258.22) ---------- */
const ARROW_C = { x: 144.5, y: 118 };
const ARROW_S = 0.8;
const ARROW_STEP = 15; // per stop, along the diagonal
const A = { show: 0.5, move: 1.0, stop: 1.1 };
const ARROW_PERIOD = A.show + 2 * (A.move + A.stop) + A.move + A.show + 0.6;
/* offset in steps (-1 start, 0 the drawn place, 1, then 2 while fading) and alpha */
function arrowState(t: number): [number, number] {
  let u = t;
  if (u < A.show) return [-1, smooth(u / A.show)];
  u -= A.show;
  for (let s = 0; s < 2; s++) {
    if (u < A.move) return [-1 + s + smooth(u / A.move), 1];
    u -= A.move;
    if (u < A.stop) return [s, 1];
    u -= A.stop;
  }
  if (u < A.move) return [1 + smooth(u / A.move), 1 - smooth(u / A.move)];
  return [-1, 0];
}

export function AdvanceArrowArt({ reduced }: { reduced: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const arrowRef = useRef<SVGGElement>(null);
  const place = (offset: number, alpha: number) => {
    const d = (offset * ARROW_STEP) / Math.SQRT2;
    const node = arrowRef.current;
    node?.setAttribute(
      "transform",
      `translate(${(ARROW_C.x + d).toFixed(2)} ${(ARROW_C.y - d).toFixed(2)}) scale(${ARROW_S}) translate(-95.2 -81.06)`,
    );
    node?.setAttribute("opacity", alpha.toFixed(3));
  };
  /* the loop starts on the drawn place (the first stop) */
  const atFirstStop = A.show + A.move;
  useVisibleLoop(svgRef, !reduced, (clock) => place(...arrowState((clock + atFirstStop) % ARROW_PERIOD)), () => place(0, 1));

  return (
    <svg ref={svgRef} className="studio-art sv-ca" viewBox={`0 0 ${CARD_W} 258.22`} fill="none" aria-hidden="true" focusable="false">
      <g ref={arrowRef} transform={`translate(${ARROW_C.x} ${ARROW_C.y}) scale(${ARROW_S}) translate(-95.2 -81.06)`}>
        <path className="sv-ca__arrow" d={ARROW} />
      </g>
    </svg>
  );
}

/* --- Understanding LLMs (Frame 353; the card window is y104..422) ------------- */
const NET_S = 11.38 / 37.373;
const NET_INPUT: [number, number] = [32.2281, 221.332];
const NET_OUTPUT: [number, number] = [271.259, 209.152];
const NET_COLS = [74.8609, 132.712, 183.564, 239.283];
const NET_ROWS = [246.301, 229.855, 210.066, 191.797, 172.004]; // bottom to top, the export's order
/* the threads of the export, grouped by the layer they enter (0 = column 1 ...
   4 = the output) */
const NET_LINKS: [number, number, number, number][][] = [
  [[69.5322, 188.541, 32.3835, 234.216], [71.9349, 208.366, 32.3502, 234.248], [69.4446, 226.657, 32.2959, 234.269], [69.3666, 246.445, 32.2179, 234.266], [69.3211, 262.867, 32.1724, 234.244]],
  [[80.4342, 188.305, 127.327, 208.097], [80.4709, 208.12, 127.364, 246.182], [80.3127, 247.381, 127.205, 226.37], [77.5466, 227.302, 127.18, 188.326], [77.635, 264.418, 127.268, 262.591]],
  [[138.302, 188.309, 178.191, 208.101], [138.341, 208.13, 178.23, 247.41], [138.337, 226.395, 178.226, 262.63], [138.132, 262.633, 178.021, 226.398], [138.109, 247.434, 178.302, 188.361]],
  [[189.758, 188.306, 233.91, 208.099], [189.627, 209.016, 233.779, 186.788], [189.071, 227.574, 233.832, 225.443], [189.132, 246.158, 232.675, 262.601], [189.029, 262.602, 233.79, 247.377]],
  [[244.938, 188.372, 265.948, 226.434], [244.9, 209.947, 265.91, 226.695], [244.807, 226.356, 265.817, 226.66], [244.697, 247.412, 265.707, 226.402], [244.671, 264.497, 265.682, 226.435]],
];
const NET_SAG = 2.2;
const N = { input: 0.6, layer: 1.25, cube: 0.07, link: 0.8, hold: 3.6, fade: 0.8, gap: 0.5 };
const NET_BUILT = N.input + 5 * N.layer;
const NET_PERIOD = NET_BUILT + N.hold + N.fade + N.gap;

const thread = ([x1, y1, x2, y2]: [number, number, number, number], sag: number) =>
  `M${x1} ${y1}Q${((x1 + x2) / 2).toFixed(2)} ${((y1 + y2) / 2 + 2 * sag).toFixed(2)} ${x2} ${y2}`;

export function NetworkArt({ reduced }: { reduced: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const inputRef = useRef<SVGGElement>(null);
  const outputRef = useRef<SVGGElement>(null);
  const cubeRefs = useRef<(SVGGElement | null)[][]>(NET_COLS.map(() => []));
  const linkRefs = useRef<(SVGPathElement | null)[][]>(NET_LINKS.map(() => []));
  const place = (t: number, clock: number) => {
    const fade = t < NET_BUILT + N.hold ? 1 : 1 - smooth((t - NET_BUILT - N.hold) / N.fade);
    const show = (start: number) => smooth((t - start) / 0.35) * fade;
    inputRef.current?.setAttribute("opacity", show(0).toFixed(3));
    NET_COLS.forEach((_, c) => {
      const at = N.input + c * N.layer;
      cubeRefs.current[c].forEach((node, r) =>
        node?.setAttribute("opacity", show(at + (NET_ROWS.length - 1 - r) * N.cube).toFixed(3)),
      );
    });
    outputRef.current?.setAttribute("opacity", show(N.input + 4 * N.layer).toFixed(3));
    NET_LINKS.forEach((links, layer) => {
      const at = N.input + layer * N.layer + 0.3;
      links.forEach((link, i) => {
        const node = linkRefs.current[layer][i];
        if (!node) return;
        const drawn = smooth((t - at - i * 0.06) / N.link);
        const sag = clock ? NET_SAG + 0.7 * Math.sin(clock * 1.3 + layer * 1.7 + i) : NET_SAG;
        node.setAttribute("d", thread(link, sag));
        node.setAttribute("stroke-dashoffset", (1 - drawn).toFixed(3));
        node.setAttribute("opacity", fade.toFixed(3));
      });
    });
  };
  useVisibleLoop(svgRef, !reduced, (clock) => place(clock % NET_PERIOD, clock), () => place(NET_BUILT + 1, 0));

  return (
    <svg ref={svgRef} className="studio-art sv-ca" viewBox={`0 104 ${CARD_W} 318.45`} fill="none" aria-hidden="true" focusable="false">
      {NET_LINKS.map((links, layer) =>
        links.map((link, i) => (
          <path
            key={`${layer}-${i}`}
            ref={(node) => {
              linkRefs.current[layer][i] = node;
            }}
            className="sv-ca__thread"
            d={thread(link, NET_SAG)}
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset={0}
          />
        )),
      )}
      <g ref={outputRef}>
        <Cube x={NET_OUTPUT[0]} y={NET_OUTPUT[1]} s={NET_S} />
      </g>
      {NET_COLS.slice()
        .reverse()
        .map((x) => {
          const c = NET_COLS.indexOf(x);
          return NET_ROWS.map((y, r) => (
            <g
              key={`${c}-${r}`}
              ref={(node) => {
                cubeRefs.current[c][r] = node;
              }}
            >
              <Cube x={x} y={y} s={NET_S} />
            </g>
          ));
        })}
      <g ref={inputRef}>
        <Cube x={NET_INPUT[0]} y={NET_INPUT[1]} s={NET_S} />
      </g>
    </svg>
  );
}

/* --- Toolmaking Workshops (Frame 352 coordinates, scaled into the card) ------- */
export function ToolmakingArt({ reduced }: { reduced: boolean }) {
  return (
    <VoxelRain
      shapes={TOOLMAKING_SHAPES}
      active={0}
      reduced={reduced}
      viewBox="-79.2 23.4 462.2 484.7"
      tone="card"
      className="studio-art sv-ca"
      rain={260}
      cycle={{ order: [0, 1, 2], hold: 3.2 }}
    />
  );
}
