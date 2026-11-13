/* Services R1 CORR01: isometric cube geometry and the cube formations.

   One cube outline serves every figure: the hexagon and inner Y of the OPERATOR
   exports (Frame 348..353, Group 336-1 / 388 / 392 / 422 and the SERVICES_v2
   Formation pile all draw the same cube: top vertex at the origin, half width
   37.373, side 43.03, height 85.708), scaled per figure. A formation is a list
   of slots (top-vertex position, scale, ghost) in drawing order, back to front
   (the Formation pile instead lists its cubes by identity, with a depth key).

     transcribed  slot positions copied from the export (Frame 351 cluster,
                  the SERVICES_v2 pile with its four outline "ghost" cubes)
     built        isometric grid cells (x, y, z) projected with the same cube
                  (ring = Group 388, stepped pyramid = Group 392, the pile's
                  three scrambles), sorted back to front by x + y + z */

export const CUBE_HEX = "M0 0L37.373 21.427L37.336 64.46L0 85.708L-36.874 64.281V21.427Z";
export const CUBE_Y = "M0 85.708V42.857L37.373 21.427M0 42.857L-36.874 21.427";
const HW = 37.373;
const HH = 21.427;
const SIDE = 43.03;
const TALL = 85.708;

export interface VoxelSlot {
  x: number;
  y: number;
  s: number;
  /** drawn as an outline cube in the ground colour (SERVICES_v2 pile) */
  ghost?: boolean;
  /** back-to-front key for shapes listed by cube identity (the pile) */
  d?: number;
}
export type VoxelShape = readonly VoxelSlot[];

type Cell = readonly [x: number, y: number, z: number, ghost?: boolean];

/* grid cells -> slots, sorted back to front, centred on cx with the lowest
   cube's bottom vertex on baseY */
function build(cells: readonly Cell[], s: number, cx: number, baseY: number): VoxelShape {
  const sorted = [...cells].sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]) || a[2] - b[2]);
  const raw = sorted.map(([x, y, z, ghost]) => ({ x: (x - y) * HW * s, y: ((x + y) * HH - z * SIDE) * s, s, ghost }));
  const minX = Math.min(...raw.map((c) => c.x)) - HW * s;
  const maxX = Math.max(...raw.map((c) => c.x)) + HW * s;
  const maxY = Math.max(...raw.map((c) => c.y)) + TALL * s;
  const dx = cx - (minX + maxX) / 2;
  const dy = baseY - maxY;
  return raw.map((c) => ({ ...c, x: c.x + dx, y: c.y + dy }));
}

const shift = (pts: readonly (readonly [number, number, boolean?])[], k: number, ox: number, oy: number, s: number) =>
  pts.map(([x, y, ghost]) => ({ x: ox + x * k, y: oy + y * k, s, ghost }));

/* Group 388: the 4 x 4 ring (2 x 2 hole) */
const RING: Cell[] = [];
for (let x = 0; x < 4; x++) for (let y = 0; y < 4; y++) if (x === 0 || y === 0 || x === 3 || y === 3) RING.push([x, y, 0]);
/* Group 392: the ring plus a stepped pyramid in its back corner */
const PYRAMID: Cell[] = [
  ...RING,
  [0, 0, 1], [1, 0, 1], [2, 0, 1], [0, 1, 1], [0, 2, 1],
  [0, 0, 2], [1, 0, 2], [0, 1, 2],
  [0, 0, 3],
];

/* --- Toolmaking card (Frame 352 coordinates, a 303.644 x 480 card) ---------- */
/* Frame 351/352: the cluster, verbatim top vertices in drawing order */
const CARD_CLUSTER: VoxelShape = (
  [
    [207.069, 217.348], [244.069, 255.348], [133.069, 87.3477], [59.0695, 216.348], [207.069, 174.348],
    [244.069, 196.348], [170.069, 66.3477], [96.0695, 130.348], [133.069, 173.348], [170.069, 212.348],
    [244.069, 109.348], [59.0695, 130.348], [207.069, 260.348], [133.069, 259.348], [170.069, 292.348],
  ] as const
).map(([x, y]) => ({ x, y, s: 1 }));
const CARD_BASE = 378.06; // the cluster's lowest vertex
export const TOOLMAKING_SHAPES: readonly VoxelShape[] = [
  CARD_CLUSTER,
  build(RING, 0.8, 151.8, CARD_BASE),
  build(PYRAMID, 0.8, 151.8, CARD_BASE),
];

/* --- the Formation pile (SERVICES_v2 coordinates, 1536 artboard) ------------ */
/* the pile as drawn: Group 336-1's cluster at 2.0932, ghosts as drawn */
const PILE_CLUSTER: VoxelShape = shift(
  [
    [184.874, 151], [221.874, 189], [110.874, 21, true], [36.874, 150], [184.874, 108],
    [221.874, 130], [147.874, 0], [73.874, 64], [110.874, 107, true], [147.874, 146],
    [221.874, 43, true], [36.874, 64], [184.874, 194], [110.874, 193], [147.874, 226, true],
  ],
  2.0932,
  491.0,
  3354,
  2.0932,
);
/* R1 CORR01 round 3 (OPERATOR): the pile rains between four formations again,
   now the OPERATOR's own voxel drawings (session images "gear", "arrow", "llm
   learning"; screenshots, no SVG export, so they are transcribed onto the cube
   lattice cell by cell: the drawings use the same cube and the same 30 deg
   projection, and their cube steps match the lattice's x / y / z steps). Their
   red cubes are the pile's red "ghost" cubes. Every drawing is centred in the
   scene, between the cards (x768, its box centred at y3727, the cards' middle)
   at the drawn cluster's cube size (2.0932), smaller only if it would leave
   the 760 x 720 window between the cards. Toolmaking keeps the drawn cluster
   (SERVICES_v2), unchanged. The round 2 scrambles are gone. */
const PILE_S = 2.0932;
const PILE_C = { x: 768, y: 3727, w: 760, h: 720 } as const;

/* cells -> slots in the cells' own order, the box centred on PILE_C */
function fit(cells: readonly Cell[]): VoxelSlot[] {
  const unit = cells.map(([x, y, z]) => ({ x: (x - y) * HW, y: (x + y) * HH - z * SIDE }));
  const minX = Math.min(...unit.map((c) => c.x)) - HW;
  const maxX = Math.max(...unit.map((c) => c.x)) + HW;
  const minY = Math.min(...unit.map((c) => c.y));
  const maxY = Math.max(...unit.map((c) => c.y)) + TALL;
  const s = Math.min(PILE_S, PILE_C.w / (maxX - minX), PILE_C.h / (maxY - minY));
  const dx = PILE_C.x - ((minX + maxX) / 2) * s;
  const dy = PILE_C.y - ((minY + maxY) / 2) * s;
  return unit.map((c, k) => ({ x: dx + c.x * s, y: dy + c.y * s, s, ghost: cells[k][3] }));
}
/* back to front (x + y + z, then height), as build() */
const depthSorted = (cells: readonly Cell[], slots: readonly VoxelSlot[]): VoxelShape =>
  cells
    .map((_, k) => k)
    .sort((a, b) => cells[a][0] + cells[a][1] + cells[a][2] - (cells[b][0] + cells[b][1] + cells[b][2]) || cells[a][2] - cells[b][2])
    .map((k) => slots[k]);

/* Tailored formation, "gear": an upright 3 x 3 plate (the y-z plane) with
   eight teeth on its 5 x 5 rim, one at each side's middle and one at each
   corner, as the CCDV gear's eight; its centre cube is red and stands one
   cell forward (+x), as drawn */
const GEAR_CELLS: Cell[] = [];
for (let y = 0; y < 3; y++) for (let z = 0; z < 3; z++) GEAR_CELLS.push([0, y, z]);
for (const [y, z] of [[-1, -1], [1, -1], [3, -1], [-1, 1], [3, 1], [-1, 3], [1, 3], [3, 3]]) GEAR_CELLS.push([0, y, z]);
GEAR_CELLS.push([1, 1, 1, true]);
const GEAR = depthSorted(GEAR_CELLS, fit(GEAR_CELLS));

/* Keep up with advancements, "arrow": upright (the y-z plane), pointing up and
   to the right. The ink corner cube at the tip, the red head bar running left
   from it (3) and the red head bar running down from it (3), the ink shaft
   stepping down-left from the tip (4) */
const ARROW_CELLS: Cell[] = [
  [0, 0, 4],
  [0, 1, 4, true], [0, 2, 4, true], [0, 3, 4, true],
  [0, 0, 3, true], [0, 0, 2, true], [0, 0, 1, true],
  [0, 1, 3], [0, 2, 2], [0, 3, 1], [0, 4, 0],
];
const ARROW = depthSorted(ARROW_CELLS, fit(ARROW_CELLS));

/* Understanding LLMs, "llm learning": an input cube, three columns of four
   cubes (stacked with a gap, the third column a half cube higher) and an
   output cube, left to right, as drawn; all ink. Column c sits at x = 1.4c,
   y = -1.4c (level across the screen, a cube's width apart plus a gap). */
const LLM_COL = (c: number, z: number): Cell => [1.4 * c, -1.4 * c, z];
const LLM_ROWS = [0, 1.5, 3, 4.5];
const LLM_CELLS: Cell[] = [
  LLM_COL(-1.12, 2.25),
  ...[0, 1, 2].flatMap((c) => LLM_ROWS.map((z) => LLM_COL(c, z + (c === 2 ? 0.5 : 0)))),
  LLM_COL(3, 2.8),
];
const LLM_SLOTS = fit(LLM_CELLS);
const LLM = depthSorted(LLM_CELLS, LLM_SLOTS);

/* the LLM wires: the input fans out to column 1, each column joins the next
   cube for cube and one step up, column 3 fans in to the output; each wire
   runs from a cube's right corner to the next cube's left corner (the side
   faces' outer vertices, mid height), as the card's threads (Frame 353) */
const LLM_LINKS: [number, number][] = [
  ...[1, 2, 3, 4].map((k): [number, number] => [0, k]),
  ...[0, 1].flatMap((c) =>
    [0, 1, 2, 3].flatMap((r): [number, number][] => {
      const a = 1 + c * 4 + r;
      const b = 1 + (c + 1) * 4 + r;
      return r < 3 ? [[a, b], [a, b + 1]] : [[a, b]];
    }),
  ),
  ...[9, 10, 11, 12].map((k): [number, number] => [k, 13]),
];
const MID = (21.427 + 64.46) / 2;
export const LLM_WIRES: readonly string[] = LLM_LINKS.map(([a, b]) => {
  const p = LLM_SLOTS[a];
  const q = LLM_SLOTS[b];
  return `M${(p.x + 37.373 * p.s).toFixed(2)} ${(p.y + MID * p.s).toFixed(2)}L${(q.x - 36.874 * q.s).toFixed(2)} ${(q.y + MID * q.s).toFixed(2)}`;
});

/* one per Formation card, in card order: Tailored formation, Keep up with
   advancements, Understanding LLMs, Toolmaking Workshops (the drawn pile) */
export const FORMATION_SHAPES: readonly VoxelShape[] = [GEAR, ARROW, LLM, PILE_CLUSTER];
/* the Formation card whose shape carries the wires */
export const FORMATION_WIRED = 2;
/* the cube's corners, for anchoring a line on a cube (left / right vertex at
   the upper or lower edge of the side faces) */
export const CUBE_CORNERS = { left: -36.874, right: 37.373, upper: 21.427, lower: 64.281 } as const;
