/* Services R1 CORR01 S2: the Service Index voxel face (the "quantum Rubik" cube
   of the brief). At rest it is exactly the approved SERVICES_v2 index seen
   front-on: a 648 x 600 face (1440 reference, x48..696) of red / half-red /
   blank tiles, 7.5 gaps. Each tile is a shallow box behind its face (deeper the
   redder it is), so when the face tilts the tiles read as voxels.

     state     servicesVoxels.ts: one pattern per service, 15 in all. Tile slot
               band * 4 + cell keeps every tile's identity across patterns, so a
               switch moves, cuts and recolours tiles instead of swapping
               pictures; a cell a pattern lacks collapses into its band's end.
     motion    every tile value eases toward its target (exponential approach,
               so a new selection mid-transition simply retargets from where the
               tiles are); a switch gives the face a small turn that springs
               back. Pointer: the face leans very softly toward the pointer
               (at most ~8 deg) and springs back to front-on when it leaves. It
               is never free to orbit and never shows its back.
     touch     a touch leans it the same way until the browser takes the gesture
               for scrolling (pointercancel), then it springs back; it never
               blocks the page scroll (no touch-action change, no capture).
     reduced   no loop, no lean: the face is redrawn front-on per state.
   The loop runs only while the face is on screen (useVisibleLoop). Attributes
   are written to the DOM; React renders the first state only (motion on), or
   every state (reduced motion). Decorative: the tabs are the control. */
import { useEffect, useRef } from "react";
import { apply, mul, rotX, rotY } from "../marks/StudioMobileOrbit";
import { useVisibleLoop } from "../studio/artworks";
import type { IndexPattern } from "../../data/servicesVoxels";

const W = 648;
const H = 600;
const GAP = 7.5;
const DEPTH = 42; // a full-red tile's box depth; a blank tile keeps DEPTH_MIN
const DEPTH_MIN = 5;
const PERSP = 1800;
const LEAN = { x: 0.1, y: 0.14 }; // rad, the pointer's full lean
const BREATH = 0.006; // rad, the idle drift
const SPRING = { k: 38, c: 9 }; // a little under critical: one soft return
const KICK = { x: 0.35, y: 0.75 }; // rad/s on a switch

interface Tile {
  x: number;
  y: number;
  w: number;
  h: number;
  f: number;
  a: number;
}

function layout(p: IndexPattern): Tile[] {
  const tiles: Tile[] = [];
  const band = ((p.axis === "rows" ? H : W) - 2 * GAP) / 3;
  p.bands.forEach((cells, b) => {
    const n = cells.length;
    const along = p.axis === "rows" ? W : H;
    const cell = (along - (n - 1) * GAP) / n;
    for (let c = 0; c < 4; c++) {
      const at = c < n ? c * (cell + GAP) : along;
      const size = c < n ? cell : 0;
      const f = c < n ? cells[c] : 0;
      const a = c < n ? 1 : 0;
      const across = b * (band + GAP);
      tiles.push(
        p.axis === "rows"
          ? { x: at, y: across, w: size, h: band, f, a }
          : { x: across, y: at, w: band, h: size, f, a },
      );
    }
  });
  return tiles;
}

type Pose = { rx: number; ry: number };
const FRONT: Pose = { rx: 0, ry: 0 };

function project(pose: Pose) {
  const m = mul(rotX(pose.rx), rotY(pose.ry));
  return (x: number, y: number, z: number): [number, number] => {
    const q = apply(m, [x - W / 2, y - H / 2, z]);
    const s = PERSP / (PERSP - q[2]);
    return [W / 2 + q[0] * s, H / 2 + q[1] * s];
  };
}

const pt = (p: [number, number]) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;

function tileGeometry(t: Tile, pose: Pose) {
  const to = project(pose);
  const d = -(DEPTH_MIN + t.f * DEPTH);
  const x2 = t.x + t.w;
  const y2 = t.y + t.h;
  const f = [to(t.x, t.y, 0), to(x2, t.y, 0), to(x2, y2, 0), to(t.x, y2, 0)];
  const b = [to(t.x, t.y, d), to(x2, t.y, d), to(x2, y2, d), to(t.x, y2, d)];
  const front = `M${pt(f[0])}L${pt(f[1])}L${pt(f[2])}L${pt(f[3])}Z`;
  let sides = "";
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    sides += `M${pt(f[i])}L${pt(f[j])}L${pt(b[j])}L${pt(b[i])}Z`;
  }
  return { front, sides };
}

const sideOpacity = (f: number) => 0.06 + f * 0.5;

export function IndexVoxel({ pattern, reduced }: { pattern: IndexPattern; reduced: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tileRefs = useRef<(SVGGElement | null)[]>([]);
  const target = useRef(layout(pattern));
  const sim = useRef({
    tiles: layout(pattern),
    pose: { ...FRONT },
    vel: { rx: 0, ry: 0 },
    aim: { rx: 0, ry: 0 },
    clock: 0,
  });
  /* motion on: React keeps the first drawing and the loop owns the attributes */
  const first = useRef(pattern);
  if (reduced) first.current = pattern;
  const drawn = layout(first.current);

  const write = (tiles: Tile[], pose: Pose) => {
    tiles.forEach((t, i) => {
      const g = tileRefs.current[i];
      if (!g) return;
      const { front, sides } = tileGeometry(t, pose);
      const sidePath = g.children[0];
      const frontPath = g.children[1];
      sidePath?.setAttribute("d", sides);
      sidePath?.setAttribute("fill-opacity", sideOpacity(t.f).toFixed(3));
      frontPath?.setAttribute("d", front);
      frontPath?.setAttribute("fill-opacity", t.f.toFixed(3));
      g.setAttribute("opacity", Math.min(1, t.a * 1.4).toFixed(3));
    });
  };

  /* a new state: retarget the tiles and give the face its small turn */
  const previous = useRef(pattern);
  useEffect(() => {
    if (previous.current === pattern) return;
    previous.current = pattern;
    target.current = layout(pattern);
    if (reduced) return;
    const s = sim.current;
    s.vel.rx += KICK.x;
    s.vel.ry += KICK.y;
  }, [pattern, reduced]);

  useVisibleLoop(
    svgRef,
    !reduced,
    (clock) => {
      const s = sim.current;
      const dt = Math.min(0.05, Math.max(0, clock - s.clock));
      s.clock = clock;
      s.tiles.forEach((t, i) => {
        const goal = target.current[i];
        const k = 1 - Math.exp(-(5.5 + (i % 4) * 0.6) * dt);
        t.x += (goal.x - t.x) * k;
        t.y += (goal.y - t.y) * k;
        t.w += (goal.w - t.w) * k;
        t.h += (goal.h - t.h) * k;
        t.f += (goal.f - t.f) * k;
        t.a += (goal.a - t.a) * k;
      });
      const aim = {
        rx: s.aim.rx + BREATH * Math.sin(clock * 0.61),
        ry: s.aim.ry + BREATH * Math.sin(clock * 0.43 + 1),
      };
      for (const axis of ["rx", "ry"] as const) {
        const acc = SPRING.k * (aim[axis] - s.pose[axis]) - SPRING.c * s.vel[axis];
        s.vel[axis] += acc * dt;
        s.pose[axis] += s.vel[axis] * dt;
      }
      write(s.tiles, s.pose);
    },
    () => {
      const s = sim.current;
      s.tiles = target.current.map((t) => ({ ...t }));
      s.pose = { ...FRONT };
      s.vel = { rx: 0, ry: 0 };
      s.clock = 0;
      write(s.tiles, FRONT);
    },
  );

  /* the soft lean toward a pointer (mouse, pen, or a touch until it scrolls) */
  useEffect(() => {
    const node = svgRef.current;
    if (!node || reduced) return;
    const aim = sim.current.aim;
    const onMove = (event: PointerEvent) => {
      const r = node.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const nx = Math.max(-1, Math.min(1, (event.clientX - (r.left + r.width / 2)) / (r.width / 2)));
      const ny = Math.max(-1, Math.min(1, (event.clientY - (r.top + r.height / 2)) / (r.height / 2)));
      aim.ry = nx * LEAN.y;
      aim.rx = -ny * LEAN.x;
    };
    const onLeave = () => {
      aim.rx = 0;
      aim.ry = 0;
    };
    const onUp = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") onLeave();
    };
    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerdown", onMove);
    node.addEventListener("pointerleave", onLeave);
    node.addEventListener("pointercancel", onLeave);
    node.addEventListener("pointerup", onUp);
    return () => {
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerdown", onMove);
      node.removeEventListener("pointerleave", onLeave);
      node.removeEventListener("pointercancel", onLeave);
      node.removeEventListener("pointerup", onUp);
      onLeave();
    };
  }, [reduced]);

  return (
    <svg
      ref={svgRef}
      className="sv-vf"
      viewBox={`0 0 ${W} ${H}`}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {drawn.map((t, i) => {
        const { front, sides } = tileGeometry(t, FRONT);
        return (
          <g
            key={i}
            ref={(node) => {
              tileRefs.current[i] = node;
            }}
            opacity={Math.min(1, t.a * 1.4)}
          >
            <path className="sv-vf__side" d={sides} fillOpacity={sideOpacity(t.f)} />
            <path className="sv-vf__face" d={front} fillOpacity={t.f} />
          </g>
        );
      })}
    </svg>
  );
}
