import { useEffect, useRef, type CSSProperties } from "react";
import { useVisibleLoop } from "../studio/artworks";
import { apply, mul, rotX, rotY, rotZ, type Mat3, type Vec3 } from "../marks/StudioMobileOrbit";

/* Products V2 artwork. The hero cube and the card icons are transcribed from
   PRODUCTS_v2.svg: each viewBox is the drawing's own source box, so the path
   data is pasted unchanged (the ProductsCard / WorkGearTile convention). The
   phone artboard (PRODUCTS_responsive_v2.svg) draws the same shapes uniformly
   scaled, so one drawing serves both layouts.

   P1b (OPERATOR): the four \\Our Software Code figures are animated
   recreations in the same language (green <-> #F2F2F2 ramps, #1A1A1A edges),
   each in a 340 x 222 box: Approach (a hand slides in, the cube lifts),
   Target (four intersecting beams turning like a chaos pendulum), Offline
   (signal bars counting down and back up) and Updates (community pillars
   growing). Each runs only while it is the selected topic and on screen
   (useVisibleLoop); a selection replays it; reduced motion shows the rest
   pose. `Products demo cube (not use, recreate)` is not used anywhere here.
   All art is decorative. */

type ArtProps = { active: boolean; reduced: boolean };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeOut = (v: number) => 1 - (1 - clamp01(v)) ** 3;
const easeOutBack = (v: number) => {
  const t = clamp01(v) - 1;
  return 1 + 2.4 * t ** 3 + 1.4 * t ** 2;
};
const fmt = (n: number) => Math.round(n * 100) / 100;
/** exponential approach: the share of the gap closed in `dt` seconds */
const approach = (dt: number, rate: number) => 1 - Math.exp(-dt * rate);

/* An isometric hexagonal prism (the series' bar / pillar): front-bottom vertex
   (cx, yb), half width a, top-face half height c, top corners at yt. Returns
   the silhouette and the Y of edges that reads it as a solid. */
function prism(cx: number, yb: number, yt: number, a: number, c: number) {
  const body = `M${fmt(cx + a)} ${fmt(yb - c)}V${fmt(yt)}L${fmt(cx)} ${fmt(yt - c)}L${fmt(cx - a)} ${fmt(yt)}V${fmt(yb - c)}L${fmt(cx)} ${fmt(yb)}Z`;
  const edges = `M${fmt(cx)} ${fmt(yb)}V${fmt(yt + c)}M${fmt(cx)} ${fmt(yt + c)}L${fmt(cx + a)} ${fmt(yt)}M${fmt(cx)} ${fmt(yt + c)}L${fmt(cx - a)} ${fmt(yt)}`;
  return { body, edges };
}

/* --- 01 Approach: the hand gives the product -------------------------------
   The source hand and cube (PRODUCTS_v2.svg column 1), polished into the
   series: the palm is a slab now (a green under-face 5 below the top face, a
   #1A1A1A rim). The hand comes in from the left, then the cube lifts off it
   and floats. Rest pose: hand in place, cube lifted. */
const HAND =
  "M186.7 1468.91H164.906C163.802 1468.91 162.906 1469.81 162.906 1470.91V1483.27C162.906 1484.37 163.802 1485.27 164.906 1485.27H244.251C244.542 1485.27 244.829 1485.21 245.093 1485.08L277.845 1469.87C278.938 1469.36 279.337 1468.01 278.694 1466.99L275.886 1462.53C275.365 1461.71 274.324 1461.38 273.424 1461.75L245.062 1473.59C244.818 1473.69 244.557 1473.74 244.292 1473.74H214.13C213.025 1473.74 212.13 1472.85 212.13 1471.74V1466.08C212.13 1464.97 213.025 1464.08 214.13 1464.08H233.605C234.71 1464.08 235.605 1463.18 235.605 1462.08V1458.27C235.605 1457.16 234.71 1456.27 233.605 1456.27H201.209C200.685 1456.27 200.182 1456.48 199.808 1456.84L188.101 1468.34C187.727 1468.7 187.224 1468.91 186.7 1468.91Z";
const LIFT = -10;

function ApproachArt({ active, reduced }: ArtProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const handRef = useRef<SVGGElement>(null);
  const cubeRef = useRef<SVGGElement>(null);

  const pose = (handX: number, handA: number, cubeY: number) => {
    handRef.current?.setAttribute("transform", `translate(${fmt(handX)} 0)`);
    handRef.current?.setAttribute("opacity", `${fmt(handA)}`);
    cubeRef.current?.setAttribute("transform", `translate(0 ${fmt(cubeY)})`);
  };
  useVisibleLoop(
    svgRef,
    active && !reduced,
    (t) => {
      const lift = t < 0.75 ? 0 : t < 1.3 ? LIFT * easeOutBack((t - 0.75) / 0.55) : LIFT + 2 * Math.sin((t - 1.3) * 2.2);
      pose(-170 * (1 - easeOut(t / 0.75)), clamp01(t / 0.3), lift);
    },
    () => pose(0, 1, LIFT),
  );

  return (
    <svg ref={svgRef} className="pv-topic__svg" viewBox="0 0 340 222" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="pv-topic-a1" x1="221.409" y1="1440.04" x2="221.409" y2="1365.79" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5AE36F" />
          <stop offset="1" stopColor="#F2F2F2" />
        </linearGradient>
        <linearGradient id="pv-topic-a2" x1="156.406" y1="1485.27" x2="280.192" y2="1481.97" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5AE36F" />
          <stop offset="0.454452" stopColor="#84E794" />
          <stop offset="1" stopColor="#F2F2F2" />
        </linearGradient>
      </defs>
      <g transform="translate(-51.2 -1314.33)">
        <g ref={cubeRef} transform={`translate(0 ${LIFT})`}>
          <path d="M221.409 1365.79L253.658 1384.41V1421.65L221.409 1440.27L189.161 1421.65V1384.41L221.409 1365.79Z" fill="url(#pv-topic-a1)" />
          <path d="M188.43 1383.97L221.454 1403.26L254.48 1383.97" strokeWidth="2" stroke="#1A1A1A" />
          <path d="M221.409 1403.26V1440.27" strokeWidth="1" stroke="#1A1A1A" opacity="0.5" />
        </g>
        <g ref={handRef}>
          <path d={HAND} transform="translate(0 5)" fill="#5AE36F" opacity="0.45" />
          <path d={HAND} fill="url(#pv-topic-a2)" stroke="#1A1A1A" strokeWidth="1" strokeLinejoin="round" />
        </g>
      </g>
    </svg>
  );
}

/* --- 02 Target: four beams through one centre -------------------------------
   Four long square-section boxes share one centre point and truly intersect.
   Each turns on its own bounded swings of incommensurate period (a chaos
   pendulum: never repeating, never flying apart) and rolls about its own
   length. Orthographic projection; each long side is cut into strips so the
   painter's sort holds where the beams cross. A face's tone mixes green and
   light by its lighting and by its place along the beam (the source ramps). */
const BEAM = { half: 92, w: 11, strips: 6 };
const VIEW = mul(rotX(0.42), rotY(-0.32));
const LIGHT_DIR: Vec3 = (() => {
  const v: Vec3 = [-0.45, -0.7, 0.55];
  const n = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / n, v[1] / n, v[2] / n];
})();
const BEAMS = [
  { base: 0.2, k: 1, spin: 0.42, p: 0 },
  { base: 0.2 + Math.PI / 4, k: 1.37, spin: -0.55, p: 1.7 },
  { base: 0.2 + Math.PI / 2, k: 0.83, spin: 0.68, p: 3.1 },
  { base: 0.2 + (3 * Math.PI) / 4, k: 1.71, spin: -0.33, p: 4.4 },
];
type Quad = { local: Vec3[]; normal: Vec3; along: number; cap: boolean };

/* one beam's faces in its own frame (length on x) */
const BEAM_QUADS: Quad[] = (() => {
  const { half, w, strips } = BEAM;
  const quads: Quad[] = [];
  const sides: { n: Vec3; corner: (s: number, x: number) => Vec3 }[] = [
    { n: [0, 1, 0], corner: (s, x) => [x, w, s * w] },
    { n: [0, -1, 0], corner: (s, x) => [x, -w, s * w] },
    { n: [0, 0, 1], corner: (s, x) => [x, s * w, w] },
    { n: [0, 0, -1], corner: (s, x) => [x, s * w, -w] },
  ];
  for (const side of sides) {
    for (let i = 0; i < strips; i++) {
      const x0 = -half + (2 * half * i) / strips;
      const x1 = -half + (2 * half * (i + 1)) / strips;
      quads.push({
        local: [side.corner(-1, x0), side.corner(1, x0), side.corner(1, x1), side.corner(-1, x1)],
        normal: side.n,
        along: (x0 + x1) / (2 * half),
        cap: false,
      });
    }
  }
  for (const end of [-1, 1]) {
    const x = end * half;
    quads.push({ local: [[x, -w, -w], [x, w, -w], [x, w, w], [x, -w, w]], normal: [end, 0, 0], along: end, cap: true });
  }
  return quads;
})();
const POOL = BEAMS.length * BEAM_QUADS.length;

/* #5AE36F -> #F2F2F2 */
const ramp = (v: number) => {
  const t = clamp01(v);
  const ch = (a: number, b: number) => Math.round(a + (b - a) * t);
  return `rgb(${ch(0x5a, 0xf2)} ${ch(0xe3, 0xf2)} ${ch(0x6f, 0xf2)})`;
};

function beamPose(i: number, t: number): Mat3 {
  const b = BEAMS[i];
  const swing = 0.38 * Math.sin(0.37 * b.k * t + b.p) + 0.16 * Math.sin(0.91 * b.k * t + 2 * b.p);
  const tilt = 0.55 * Math.sin(0.29 * b.k * t + 1.3 * b.p);
  return mul(VIEW, mul(rotZ(b.base + swing), mul(rotY(tilt), rotX(b.spin * t))));
}

function TargetArt({ active, reduced }: ArtProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const poolRef = useRef<SVGGElement>(null);

  const draw = (t: number) => {
    const nodes = poolRef.current?.children;
    if (!nodes) return;
    const faces: { d: string; z: number; fill: string; cap: boolean }[] = [];
    BEAMS.forEach((_, i) => {
      const m = beamPose(i, t);
      for (const q of BEAM_QUADS) {
        const n = apply(m, q.normal);
        if (n[2] <= 0) continue;
        const pts = q.local.map((v) => apply(m, v));
        const lit = Math.max(0, n[0] * LIGHT_DIR[0] + n[1] * LIGHT_DIR[1] + n[2] * LIGHT_DIR[2]);
        faces.push({
          d: `M${pts.map((p) => `${fmt(170 + p[0])} ${fmt(111 + p[1])}`).join("L")}Z`,
          z: pts.reduce((sum, p) => sum + p[2], 0) / pts.length,
          fill: ramp(0.15 + 0.55 * lit + 0.3 * (i % 2 ? q.along : -q.along)),
          cap: q.cap,
        });
      }
    });
    faces.sort((a, b) => a.z - b.z);
    for (let k = 0; k < nodes.length; k++) {
      const node = nodes[k];
      const face = faces[k];
      if (!face) {
        node.setAttribute("d", "");
        continue;
      }
      node.setAttribute("d", face.d);
      node.setAttribute("fill", face.fill);
      /* strips take their own fill as stroke (no seams); the caps an ink rim */
      node.setAttribute("stroke", face.cap ? "#1A1A1A" : face.fill);
      node.setAttribute("stroke-width", face.cap ? "0.9" : "0.4");
    }
  };
  // the start pose is drawn once whether or not the loop runs (reduced motion)
  useEffect(() => draw(0), []);
  useVisibleLoop(svgRef, active && !reduced, draw, () => draw(0));

  return (
    <svg ref={svgRef} className="pv-topic__svg" viewBox="0 0 340 222" fill="none" aria-hidden="true" focusable="false">
      <g ref={poolRef} strokeLinejoin="round">
        {Array.from({ length: POOL }, (_, k) => (
          <path key={k} />
        ))}
      </g>
    </svg>
  );
}

/* --- 03 Offline: four signal bars ------------------------------------------
   The column-3 bars (PRODUCTS_v2.svg, which draws one of them hollow). They
   count down 4 -> 3 -> 2 -> 1 -> 0 full bars and back up; a bar that is off
   is the hollow green outline, a bar that is on cross-fades to its filled
   ramp. Rest pose: all four full. */
const OFFLINE_BARS = [
  { cx: 86.58, yt: 133.43 },
  { cx: 142.76, yt: 105.32 },
  { cx: 200.58, yt: 85.9 },
  { cx: 260.2, yt: 40.06 },
].map((bar) => ({ ...bar, ...prism(bar.cx, 195.89, bar.yt, 25.05, 14.46) }));
const SIGNAL = [4, 3, 2, 1, 0, 1, 2, 3];
const SIGNAL_STEP = 0.6;

function OfflineArt({ active, reduced }: ArtProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const fillRefs = useRef<(SVGGElement | null)[]>([]);
  const state = useRef({ last: 0, on: [1, 1, 1, 1] });

  const write = () => fillRefs.current.forEach((node, i) => node?.setAttribute("opacity", `${fmt(state.current.on[i])}`));
  useVisibleLoop(
    svgRef,
    active && !reduced,
    (t) => {
      const s = state.current;
      if (t === 0) s.on = [1, 1, 1, 1];
      const dt = Math.max(0, t - s.last);
      s.last = t;
      const full = SIGNAL[Math.floor(t / SIGNAL_STEP) % SIGNAL.length];
      s.on = s.on.map((v, i) => v + ((i < full ? 1 : 0) - v) * approach(dt, 14));
      write();
    },
    () => {
      state.current = { last: 0, on: [1, 1, 1, 1] };
      write();
    },
  );

  return (
    <svg ref={svgRef} className="pv-topic__svg" viewBox="0 0 340 222" fill="none" aria-hidden="true" focusable="false">
      <defs>
        {OFFLINE_BARS.map((bar, i) => (
          <linearGradient key={i} id={`pv-topic-o${i}`} x1={bar.cx - 25} y1={bar.yt} x2={bar.cx + 25} y2="196" gradientUnits="userSpaceOnUse">
            <stop stopColor={i % 2 ? "#F2F2F2" : "#5AE36F"} />
            <stop offset="1" stopColor={i % 2 ? "#5AE36F" : "#F2F2F2"} />
          </linearGradient>
        ))}
      </defs>
      {OFFLINE_BARS.map((bar, i) => (
        <g key={i}>
          <g stroke="#5AE36F" strokeWidth="1.55" strokeLinejoin="round">
            <path d={bar.body} />
            <path d={bar.edges} />
          </g>
          <g
            ref={(node) => {
              fillRefs.current[i] = node;
            }}
          >
            <path d={bar.body} fill={`url(#pv-topic-o${i})`} />
            <path d={bar.edges} strokeWidth="1.55" stroke="#1A1A1A" />
          </g>
        </g>
      ))}
    </svg>
  );
}

/* --- 04 Updates and community feedback: growth pillars ---------------------
   The column-4 cluster of six pillars (PRODUCTS_v2.svg, source paint order,
   back to front). They grow from their footings one after another, hold,
   settle back a little and grow again. Rest pose: full height. */
const PILLARS = [
  { cx: 171.62, yb: 153.97, yt: 31.43, green: false },
  { cx: 140.78, yb: 155.26, yt: 32.87, green: true },
  { cx: 201.26, yb: 159.84, yt: 37.33, green: true },
  { cx: 154.93, yb: 173.56, yt: 51.15, green: false },
  { cx: 186.93, yb: 184.09, yt: 61.68, green: false },
  { cx: 172.26, yb: 199.18, yt: 76.79, green: true },
];
const PILLAR = { a: 14.75, c: 8.5, cycle: 4.4, hold: 3.4, stagger: 0.16, grow: 0.8, floor: 0.08, settle: 0.35 };

/** pillar i's share of its full height at time t */
function pillarShare(i: number, t: number) {
  const { cycle, hold, stagger, grow, floor, settle } = PILLAR;
  const u = t % cycle;
  const from = t < cycle ? floor : settle;
  if (u < hold) return from + (1 - from) * easeOut((u - i * stagger) / grow);
  return 1 - (1 - settle) * easeOut((u - hold) / 0.8);
}

function UpdatesArt({ active, reduced }: ArtProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const bodyRefs = useRef<(SVGPathElement | null)[]>([]);
  const edgeRefs = useRef<(SVGPathElement | null)[]>([]);

  const draw = (share: (i: number) => number) =>
    PILLARS.forEach((p, i) => {
      const h = p.yb - PILLAR.c - p.yt;
      const { body, edges } = prism(p.cx, p.yb, p.yb - PILLAR.c - h * share(i), PILLAR.a, PILLAR.c);
      bodyRefs.current[i]?.setAttribute("d", body);
      edgeRefs.current[i]?.setAttribute("d", edges);
    });
  useVisibleLoop(
    svgRef,
    active && !reduced,
    (t) => draw((i) => pillarShare(i, t)),
    () => draw(() => 1),
  );

  return (
    <svg ref={svgRef} className="pv-topic__svg" viewBox="0 0 340 222" fill="none" aria-hidden="true" focusable="false">
      <defs>
        {PILLARS.map((p, i) => (
          <linearGradient key={i} id={`pv-topic-u${i}`} x1={p.cx} y1={p.yt} x2={p.cx} y2={p.yb} gradientUnits="userSpaceOnUse">
            <stop stopColor={p.green ? "#5AE36F" : "#F2F2F2"} />
            <stop offset="1" stopColor={p.green ? "#F2F2F2" : "#5AE36F"} />
          </linearGradient>
        ))}
      </defs>
      {PILLARS.map((p, i) => {
        const { body, edges } = prism(p.cx, p.yb, p.yt, PILLAR.a, PILLAR.c);
        return (
          <g key={i}>
            <path
              ref={(node) => {
                bodyRefs.current[i] = node;
              }}
              d={body}
              fill={`url(#pv-topic-u${i})`}
            />
            <path
              ref={(node) => {
                edgeRefs.current[i] = node;
              }}
              d={edges}
              strokeWidth="0.91498"
              stroke="#1A1A1A"
            />
          </g>
        );
      })}
    </svg>
  );
}

export function ProductsTopicArt({ topic, active, reduced }: ArtProps & { topic: "approach" | "target" | "offline" | "updates" }) {
  if (topic === "approach") return <ApproachArt active={active} reduced={reduced} />;
  if (topic === "target") return <TargetArt active={active} reduced={reduced} />;
  if (topic === "offline") return <OfflineArt active={active} reduced={reduced} />;
  return <UpdatesArt active={active} reduced={reduced} />;
}

/* the icon is sized by its source width (CSS: --icon-w x the page unit) */
const iconWidth = (w: number) => ({ "--icon-w": w }) as CSSProperties;

/* Product card icons: outer plate, inner plate, a white-to-#202020 core and
   the ink Y + vertical. CC.OS is green; LS and iDS are light (a closed
   card dims its contents to 0.2, as the source group does). */
export function ProductsCardIcon({ kind }: { kind: "ccos" | "triangle" | "pentagon" }) {
  if (kind === "ccos") {
    return (
      <svg className="pv-card__icon" viewBox="97.52 2339.37 65.57 75.71" style={iconWidth(65.57)} aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="pv-card-g-ccos" x1="130.309" y1="2357.54" x2="130.309" y2="2396.91" gradientUnits="userSpaceOnUse">
            <stop stopColor="white" />
            <stop offset="1" stopColor="#202020" />
          </linearGradient>
        </defs>
        <path d="M130.308 2339.37L163.091 2358.29V2396.15L130.308 2415.08L97.5247 2396.15V2358.29L130.308 2339.37Z" fill="#5AE36F" />
        <path d="M130.307 2346.93L156.534 2362.08V2392.36L130.307 2407.5L104.081 2392.36V2362.08L130.307 2346.93Z" fill="#5AE36F" />
        <path d="M130.309 2357.54L147.357 2367.38V2387.07L130.309 2396.91L113.262 2387.07V2367.38L130.309 2357.54Z" fill="url(#pv-card-g-ccos)" />
        <path d="M103.812 2362.08L130.311 2377.22L156.809 2362.08" strokeWidth="1.30851" stroke="#141414" fill="none" />
        <path d="M130.305 2377.22V2407.51" strokeWidth="1.30851" stroke="#141414" />
      </svg>
    );
  }
  if (kind === "triangle") {
    return (
      <svg className="pv-card__icon" viewBox="279.73 2328.47 65.57 68.14" style={iconWidth(65.57)} aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="pv-card-g-triangle" x1="312.505" y1="2346.64" x2="312.505" y2="2386.01" gradientUnits="userSpaceOnUse">
            <stop stopColor="white" />
            <stop offset="1" stopColor="#202020" />
          </linearGradient>
        </defs>
        <path d="M312.511 2328.47L345.294 2385.25H279.728L312.511 2328.47Z" fill="#F2F2F2" />
        <path d="M312.51 2336.04L338.737 2381.46H286.284L312.51 2336.04Z" fill="#F2F2F2" />
        <path d="M312.505 2346.64L329.552 2376.17H295.458L312.505 2346.64Z" fill="url(#pv-card-g-triangle)" />
        <path d="M286.016 2351.18L312.514 2366.33L339.012 2351.18" strokeWidth="1.30851" stroke="#141414" fill="none" />
        <path d="M312.508 2366.33V2396.61" strokeWidth="1.30851" stroke="#141414" />
      </svg>
    );
  }
  return (
    <svg className="pv-card__icon" viewBox="640.91 2328.47 72 68.48" style={iconWidth(72)} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="pv-card-g-pentagon" x1="676.903" y1="2346.64" x2="676.903" y2="2386.01" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" />
          <stop offset="1" stopColor="#202020" />
        </linearGradient>
      </defs>
      <path d="M676.909 2328.47L712.911 2354.63L699.16 2396.95H654.659L640.907 2354.63L676.909 2328.47Z" fill="#F2F2F2" />
      <path d="M676.901 2336.04L705.703 2356.96L694.701 2390.82H659.101L648.099 2356.96L676.901 2336.04Z" fill="#F2F2F2" />
      <path d="M676.903 2346.64L695.624 2360.25L688.473 2382.25H665.333L658.182 2360.25L676.903 2346.64Z" fill="url(#pv-card-g-pentagon)" />
      <path d="M650.406 2351.18L676.905 2366.33L703.403 2351.18" strokeWidth="1.30851" stroke="#141414" fill="none" />
      <path d="M676.906 2366.33V2396.61" strokeWidth="1.30851" stroke="#141414" />
    </svg>
  );
}
