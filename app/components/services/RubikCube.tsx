/* A11 (OPERATOR): the Service Index cube — a 3 x 3 x 3 Rubik cube, the Services
   counterpart of the Studio Approach sphere, replacing IndexVoxel's morphing
   face. A12 (OPERATOR): at rest it faces the reader square on (the front face
   only, as the approved index); the pointer, anywhere over the Service Index,
   tilts and turns it (up to ~20 / ~28 deg) on a critically damped spring.
   Orthographic; 27 ink cubies, each outer face carrying a red / half-red /
   blank sticker. The FRONT face always shows the selected service's 3 x 3 grid
   (servicesVoxels INDEX_GRIDS); the other faces show what the moves left
   there, as on a real cube.

   Rules — the engine never does anything else:
     1  a move is a quarter turn (90 deg) of one layer or of the whole cube,
        about one axis, on a cubic ease-in-out; nothing slides diagonally,
        nothing resizes;
     2  a new CATEGORY turns the whole cube once: a later category about the
        vertical (sideways), an earlier one about the horizontal (a tumble);
     3  a new SERVICE turns only the rows that differ, one layer at a time;
     4  a sticker changes colour only while it is on a face turned away from
        the reader: each turn brings its stickers from whichever of its two
        sides faces away at that moment (A12), painted just before the move;
     5  a new choice mid-move lets the running quarter turn finish, drops the
        queued ones and plans again from there;
     6  reduced motion: the front face is repainted at once, no move.
   Pointer: the cube leans softly toward the pointer (IndexVoxel's lean) and
   springs back. The loop runs only while the cube is on screen
   (useVisibleLoop); between moves, once the lean has settled, it stops
   writing. Decorative: the tabs are the control. */
import { useEffect, useRef } from "react";
import { IDENT, apply, mul, rotX, rotY, type Mat3 } from "../marks/StudioMobileOrbit";
import { useVisibleLoop } from "../studio/artworks";
import type { VoxelGrid } from "../../data/servicesVoxels";

type V = [number, number, number];
type Axis = 0 | 1;
type Sign = 1 | -1;
interface Face {
  n: V;
  f: number;
}
interface Cubie {
  p: V;
  faces: Face[];
}
interface Move {
  axis: Axis;
  layer: number | null; // null: the whole cube
  s: Sign; // chosen when the move starts (A12: from the side turned away)
  dur: number;
  target: VoxelGrid;
}
interface Quad {
  d: string;
  sticker: boolean;
  f: number;
}

/* A12 (OPERATOR): at rest the cube faces the reader (the front face square
   on, as the approved index); the pointer tilts and turns it */
const VIEW: Mat3 = IDENT;
/* the default rest pose: square on (a stable identity, so the default prop
   never re-runs effects) */
const REST_DEFAULT = { rx: 0, ry: 0 };
const SCALE = 150; // px per cubie (A12: the square-on face fills the box, as the approved index)
const HALF = 0.47; // cubie half-size (0.06 gaps)
const INSET = 0.39; // sticker half-size
const LAYERS = [-1, 0, 1] as const;
const DIRS: V[] = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];
const POOL = 27 * 3 * 2; // at most three faces of a box show, each with its sticker
const CUBE_S = 0.6; // s, a whole-cube turn
const ROW_S = 0.34; // s, a layer turn
const GAP_S = 0.05; // s between two moves
const LEAN = { x: 0.35, y: 0.5 }; // rad (~20 / ~28 deg), A12: the pointer turns it clearly
const SPRING = { k: 30, c: 11 }; // critically damped: smooth, no wobble

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const same = (a: V, b: V) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
const rotAxis = (axis: Axis, a: number) => (axis === 0 ? rotX(a) : rotY(a));
/* the exact quarter turn of rotAxis(axis, s * PI / 2) */
const turn = (v: V, axis: Axis, s: Sign): V =>
  axis === 0 ? [v[0], -s * v[2], s * v[1]] : [s * v[2], v[1], -s * v[0]];
const inMove = (m: Move, p: V) => m.layer === null || p[m.axis] === m.layer;

/* grid cell (row-major, top row first) of a face position */
const frontCell = (p: V) => (1 - p[1]) * 3 + (p[0] + 1);

function buildCube(front: VoxelGrid, top: VoxelGrid, right: VoxelGrid): Cubie[] {
  const cubies: Cubie[] = [];
  for (const x of LAYERS) {
    for (const y of LAYERS) {
      for (const z of LAYERS) {
        const faces: Face[] = [];
        if (x === 1) faces.push({ n: [1, 0, 0], f: right[(1 - y) * 3 + (1 - z)] });
        if (x === -1) faces.push({ n: [-1, 0, 0], f: 0 });
        if (y === 1) faces.push({ n: [0, 1, 0], f: top[(z + 1) * 3 + (x + 1)] });
        if (y === -1) faces.push({ n: [0, -1, 0], f: 0 });
        if (z === 1) faces.push({ n: [0, 0, 1], f: front[frontCell([x, y, z])] });
        if (z === -1) faces.push({ n: [0, 0, -1], f: 0 });
        cubies.push({ p: [x, y, z], faces });
      }
    }
  }
  return cubies;
}

function face(cubies: Cubie[], p: V, n: V) {
  return cubies.find((c) => same(c.p, p))?.faces.find((fc) => same(fc.n, n));
}

/* the face a quarter turn brings to the front: about the vertical, +1 brings
   the left face, -1 the right; about the horizontal, -1 the bottom, +1 the top */
const sourceNormal = (axis: Axis, s: Sign): V =>
  axis === 1 ? [-s, 0, 0] : [0, s, 0];

/* rule 4: paint the source face's stickers with the cells they will land on */
function paintSource(cubies: Cubie[], m: Move) {
  const n = sourceNormal(m.axis, m.s);
  for (const c of cubies) {
    if (!inMove(m, c.p)) continue;
    const fc = c.faces.find((x) => same(x.n, n));
    if (fc) fc.f = m.target[frontCell(turn(c.p, m.axis, m.s))];
  }
}

/* A12: the cube faces the reader and leans, so a side may be in view: a turn
   brings its stickers from whichever of its two sides faces away */
function awaySign(view: Mat3, axis: Axis): Sign {
  const z = (s: Sign) => apply(view, sourceNormal(axis, s))[2];
  return z(1) <= z(-1) ? 1 : -1;
}
function paintFront(cubies: Cubie[], target: VoxelGrid) {
  for (const c of cubies) {
    if (c.p[2] !== 1) continue;
    const fc = c.faces.find((x) => same(x.n, [0, 0, 1]));
    if (fc) fc.f = target[frontCell(c.p)];
  }
}

/* rules 2 and 3 */
function plan(cubies: Cubie[], target: VoxelGrid, category: 0 | Sign): Move[] {
  if (category === 1) return [{ axis: 1, layer: null, s: 1, dur: CUBE_S, target }];
  if (category === -1) return [{ axis: 0, layer: null, s: 1, dur: CUBE_S, target }];
  const moves: Move[] = [];
  for (const y of [1, 0, -1]) {
    const differs = LAYERS.some((x) => face(cubies, [x, y, 1], [0, 0, 1])?.f !== target[frontCell([x, y, 1])]);
    if (differs) moves.push({ axis: 1, layer: y, s: 1, dur: ROW_S, target });
  }
  return moves;
}

function finish(cubies: Cubie[], m: Move) {
  for (const c of cubies) {
    if (!inMove(m, c.p)) continue;
    c.p = turn(c.p, m.axis, m.s);
    for (const fc of c.faces) fc.n = turn(fc.n, m.axis, m.s);
  }
}

const fmt = (n: number) => (Math.round(n * 100) / 100).toString();

function square(m: Mat3, center: V, n: V, h: number) {
  const k = n[0] !== 0 ? 0 : n[1] !== 0 ? 1 : 2;
  const u: V = k === 0 ? [0, 1, 0] : [1, 0, 0];
  const w: V = k === 2 ? [0, 1, 0] : [0, 0, 1];
  const corner = (a: number, b: number): string => {
    const q = apply(m, [
      center[0] + n[0] * HALF + (u[0] * a + w[0] * b) * h,
      center[1] + n[1] * HALF + (u[1] * a + w[1] * b) * h,
      center[2] + n[2] * HALF + (u[2] * a + w[2] * b) * h,
    ]);
    return `${fmt(q[0] * SCALE)} ${fmt(-q[1] * SCALE)}`;
  };
  return `M${corner(1, 1)}L${corner(1, -1)}L${corner(-1, -1)}L${corner(-1, 1)}Z`;
}

/* painter's order: during a layer turn the cube is three slabs along the turn
   axis (separated by planes, drawn far to near); inside a slab, cubies far to
   near; each cubie's front-facing faces with their stickers */
function scene(cubies: Cubie[], view: Mat3, move: Move | null, angle: number): Quad[] {
  const turning = move ? mul(view, rotAxis(move.axis, move.s * angle)) : view;
  const slabDepth = (slab: number) =>
    move && move.layer !== null ? apply(view, move.axis === 0 ? [slab, 0, 0] : [0, slab, 0])[2] : 0;
  const items = cubies.map((c) => {
    const moving = !!move && inMove(move, c.p);
    const m = moving ? turning : view;
    const slab = move && move.layer !== null ? c.p[move.axis] : 0;
    return { c, m, slab: slabDepth(slab), depth: apply(m, c.p)[2] };
  });
  items.sort((a, b) => a.slab - b.slab || a.depth - b.depth);
  const quads: Quad[] = [];
  for (const { c, m } of items) {
    for (const n of DIRS) {
      if (apply(m, n)[2] <= 1e-6) continue;
      quads.push({ d: square(m, c.p, n, HALF), sticker: false, f: 0 });
      const fc = c.faces.find((x) => same(x.n, n));
      if (fc) quads.push({ d: square(m, c.p, n, INSET), sticker: true, f: fc.f });
    }
  }
  return quads;
}

const leanView = (rx: number, ry: number) => (rx === 0 && ry === 0 ? VIEW : mul(mul(rotX(rx), rotY(ry)), VIEW));

export function RubikCube({
  front,
  top,
  right,
  category,
  reduced,
  className,
  rest = REST_DEFAULT,
  interactive = true,
  zone = ".sv-ix",
}: {
  front: VoxelGrid;
  top: VoxelGrid;
  right: VoxelGrid;
  /** the category's position in the index; a change turns the whole cube */
  category: number;
  reduced: boolean;
  className?: string;
  /** the pose at rest and the pointer's home (copied, never mutated) */
  rest?: { rx: number; ry: number };
  /** false: no pointer lean; the cube stays at rest */
  interactive?: boolean;
  /** the pointer zone: the nearest ancestor matching this selector */
  zone?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const sim = useRef<{
    cubies: Cubie[];
    target: VoxelGrid;
    category: number;
    wanted: { target: VoxelGrid; dir: 0 | Sign } | null;
    queue: Move[];
    move: Move | null;
    t0: number;
    nextAt: number;
    clock: number;
    pose: { rx: number; ry: number };
    vel: { rx: number; ry: number };
    aim: { rx: number; ry: number };
    still: boolean;
  } | null>(null);
  if (!sim.current) {
    sim.current = {
      cubies: buildCube(front, top, right),
      target: front,
      category,
      wanted: null,
      queue: [],
      move: null,
      t0: 0,
      nextAt: 0,
      clock: 0,
      pose: { ...rest },
      vel: { rx: 0, ry: 0 },
      aim: { ...rest },
      still: false,
    };
  }
  /* the server and the first paint: the cube at rest */
  const firstQuads = useRef<Quad[] | null>(null);
  if (!firstQuads.current) firstQuads.current = scene(sim.current.cubies, leanView(rest.rx, rest.ry), null, 0);

  const write = (quads: Quad[]) => {
    pathRefs.current.forEach((path, i) => {
      if (!path) return;
      const q = quads[i];
      if (!q) {
        if (path.getAttribute("d")) path.setAttribute("d", "");
        return;
      }
      path.setAttribute("d", q.d);
      path.setAttribute("class", q.sticker ? "rc__sticker" : "rc__body");
      path.setAttribute("fill-opacity", q.sticker ? q.f.toFixed(2) : "1");
    });
  };

  /* a new selection: rule 5, or rule 6 under reduced motion */
  useEffect(() => {
    const s = sim.current;
    if (!s || s.target === front) return;
    const dir: 0 | Sign = category === s.category ? 0 : category > s.category ? 1 : -1;
    s.target = front;
    s.category = category;
    if (reduced) {
      paintFront(s.cubies, front);
      write(scene(s.cubies, leanView(rest.rx, rest.ry), null, 0));
      return;
    }
    s.wanted = { target: front, dir: dir === 0 && s.wanted ? s.wanted.dir : dir };
    s.queue = [];
    s.still = false;
  }, [front, category, reduced]);

  useVisibleLoop(
    svgRef,
    !reduced,
    (clock) => {
      const s = sim.current;
      if (!s) return;
      const dt = Math.min(0.05, Math.max(0, clock - s.clock));
      s.clock = clock;
      if (!s.move && s.wanted) {
        s.queue = plan(s.cubies, s.wanted.target, s.wanted.dir);
        s.wanted = null;
      }
      if (!s.move && s.queue.length > 0 && clock >= s.nextAt) {
        const next = s.queue.shift()!;
        next.s = awaySign(leanView(s.pose.rx, s.pose.ry), next.axis);
        paintSource(s.cubies, next);
        s.move = next;
        s.t0 = clock;
      }
      let angle = 0;
      if (s.move) {
        const t = Math.min(1, (clock - s.t0) / s.move.dur);
        angle = (Math.PI / 2) * ease(t);
        if (t >= 1) {
          finish(s.cubies, s.move);
          s.move = null;
          angle = 0;
          s.nextAt = clock + GAP_S;
        }
      }
      let settling = false;
      for (const axis of ["rx", "ry"] as const) {
        const acc = SPRING.k * (s.aim[axis] - s.pose[axis]) - SPRING.c * s.vel[axis];
        s.vel[axis] += acc * dt;
        s.pose[axis] += s.vel[axis] * dt;
        if (Math.abs(s.vel[axis]) > 1e-4 || Math.abs(s.aim[axis] - s.pose[axis]) > 1e-4) settling = true;
      }
      const busy = !!s.move || s.queue.length > 0 || settling;
      if (!busy && s.still) return;
      s.still = !busy;
      write(scene(s.cubies, leanView(s.pose.rx, s.pose.ry), s.move, angle));
    },
    () => {
      const s = sim.current;
      if (!s) return;
      if (s.move) finish(s.cubies, s.move);
      s.move = null;
      s.queue = [];
      s.wanted = null;
      paintFront(s.cubies, s.target);
      s.pose = { ...rest };
      s.vel = { rx: 0, ry: 0 };
      s.clock = 0;
      s.nextAt = 0;
      s.still = false;
      write(scene(s.cubies, leanView(rest.rx, rest.ry), null, 0));
    },
  );

  /* the soft lean toward a pointer (IndexVoxel's) */
  useEffect(() => {
    const node = svgRef.current;
    const s = sim.current;
    if (!node || !s || reduced || !interactive) return;
    const aim = s.aim;
    /* A12: the whole Service Index is the pointer's zone, so the cube follows
       smoothly from anywhere in the module, not only over itself */
    const home = node.closest(zone) ?? node;
    const onMove = (event: PointerEvent) => {
      const r = node.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const nx = Math.max(-1, Math.min(1, (event.clientX - (r.left + r.width / 2)) / (r.width / 2)));
      const ny = Math.max(-1, Math.min(1, (event.clientY - (r.top + r.height / 2)) / (r.height / 2)));
      aim.ry = nx * LEAN.y;
      aim.rx = -ny * LEAN.x;
      s.still = false;
    };
    const onLeave = () => {
      aim.rx = rest.rx;
      aim.ry = rest.ry;
      s.still = false;
    };
    const onUp = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") onLeave();
    };
    const move = onMove as EventListener;
    const up = onUp as EventListener;
    home.addEventListener("pointermove", move);
    home.addEventListener("pointerdown", move);
    home.addEventListener("pointerleave", onLeave);
    home.addEventListener("pointercancel", onLeave);
    home.addEventListener("pointerup", up);
    return () => {
      home.removeEventListener("pointermove", move);
      home.removeEventListener("pointerdown", move);
      home.removeEventListener("pointerleave", onLeave);
      home.removeEventListener("pointercancel", onLeave);
      home.removeEventListener("pointerup", up);
      onLeave();
    };
  }, [reduced, interactive, zone, rest.rx, rest.ry]);

  const quads = firstQuads.current ?? [];
  return (
    <svg
      ref={svgRef}
      className={`rc${className ? " " + className : ""}`}
      viewBox="-270 -270 540 540" fill="none" aria-hidden="true" focusable="false">
      {Array.from({ length: POOL }, (_, i) => {
        const q = quads[i];
        return (
          <path
            key={i}
            ref={(node) => {
              pathRefs.current[i] = node;
            }}
            className={q?.sticker ? "rc__sticker" : "rc__body"}
            d={q?.d ?? ""}
            fillOpacity={q ? (q.sticker ? q.f : 1) : undefined}
          />
        );
      })}
    </svg>
  );
}
