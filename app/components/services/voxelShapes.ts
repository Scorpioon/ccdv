/* Services R1 CORR01: isometric cube geometry and the cube formations.

   One cube outline serves every figure: the hexagon and inner Y of the OPERATOR
   exports (Frame 348..353, Group 336-1 / 388 / 392 / 422 and the SERVICES_v2
   Formation pile all draw the same cube: top vertex at the origin, half width
   37.373, side 43.03, height 85.708), scaled per figure. A formation is a list
   of slots (top-vertex position, scale, ghost) in drawing order, back to front.

     transcribed  slot positions copied from the export (Frame 351 cluster,
                  Group 422 network, the SERVICES_v2 pile with its four outline
                  "ghost" cubes)
     built        isometric grid cells (x, y, z) projected with the same cube
                  (ring = Group 388, stepped pyramid = Group 392, the Formation
                  gear and arrow), sorted back to front by x + y + z */

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
const PILE_CX = 762.4;
const PILE_BASE = 4006.4;
/* Group 422: input, four columns of five, output; drawn at 2x, ends as ghosts */
const NETWORK_COLS = [308.897, 230.045, 158.084, 76.2171];
const NETWORK_ROWS = [105.137, 81.8672, 53.8594, 28.0078, 0];
const PILE_NETWORK: VoxelShape = shift(
  [
    [354.147, 52.5664, true],
    ...NETWORK_COLS.flatMap((x) => NETWORK_ROWS.map((y) => [x, y] as const)),
    [15.889, 69.8047, true],
  ],
  2,
  PILE_CX - 185.5 * 2,
  PILE_BASE - 142.1 * 2,
  0.8617,
);
/* a voxel gear: a 5 x 5 ring, one tooth on each side, a ghost core */
const GEAR: Cell[] = [];
for (let x = 0; x < 5; x++) for (let y = 0; y < 5; y++) if (x === 0 || y === 0 || x === 4 || y === 4) GEAR.push([x, y, 0]);
GEAR.push([2, -1, 0], [5, 2, 0], [2, 5, 0], [-1, 2, 0], [2, 2, 0, true]);
/* a voxel arrow standing on the x/z plane, pointing up and to the right */
const ARROW: Cell[] = [
  [0, 0, 0], [1, 0, 1], [2, 0, 2], [3, 0, 3], [5, 0, 3],
  [4, 0, 4], [5, 0, 4], [3, 0, 5, true], [4, 0, 5], [5, 0, 5],
];

/* one per Formation card, in card order: Tailored formation, Keep up with
   advancements, Understanding LLMs, Toolmaking Workshops (the drawn pile) */
export const FORMATION_SHAPES: readonly VoxelShape[] = [
  build(GEAR, 1.5, PILE_CX, PILE_BASE),
  build(ARROW, 1.35, PILE_CX, PILE_BASE),
  PILE_NETWORK,
  PILE_CLUSTER,
];
