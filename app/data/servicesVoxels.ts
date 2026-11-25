/* Services R1 CORR01: the Service Index voxel face, one pattern per service
   (5 categories x 3 services = 15 states), keyed by the stable category ids of
   servicesContent.ts and indexed by the service's position in its category.

   Vocabulary, read from the OPERATOR exports (webdesign_responsive_v2):
     SERVICES_v2.svg   the approved index: three rows of three tiles
     Frame 355..358    the four variation studies (bands of 2, 3 or 4 cells,
                       each blank, half red or full red)

   N4 P-I (N1 P6): the band patterns those studies were first transcribed into
   (`IndexPattern`, `INDEX_PATTERNS`, `indexPattern`) fed only IndexVoxel, which
   the Rubik cube replaced in A11; both are gone. The grids below are what the
   cube draws. */

export type VoxelFill = 0 | 0.5 | 1;

const h = 0.5;

/* A11 (OPERATOR): the Service Index is a Rubik cube (RubikCube.tsx), so every
   state is a strict 3 x 3 face — no 2- or 4-cuts, a piece never resizes. The
   15 states (row-major, top row first), each category keeping its motif:
     strategy        a heavy top row        (Frame 358 family)
     product         a checker              (Frame 356 family)
     experience      the red middle column (service 1 = SERVICES_v2, exact)
     ai-rnd          column-led (Frame 357's columns)
     automatization  diagonal steps         (Frame 355 family) */
export type VoxelGrid = readonly [
  VoxelFill, VoxelFill, VoxelFill,
  VoxelFill, VoxelFill, VoxelFill,
  VoxelFill, VoxelFill, VoxelFill,
];

export const INDEX_GRIDS: Readonly<Record<string, readonly [VoxelGrid, VoxelGrid, VoxelGrid]>> = {
  strategy: [
    [1, 1, 0, 0, h, 0, 1, h, 1],
    [0, 1, 1, h, 0, 1, 1, 0, h],
    [h, 1, 1, 0, 1, 0, 0, h, 1],
  ],
  product: [
    [1, 0, h, 0, h, 1, h, 0, 1],
    [1, 0, h, 0, 1, 0, h, 0, 1],
    [h, 1, 0, 1, 0, h, 0, 1, h],
  ],
  experience: [
    [h, 1, 0, 0, 1, h, 0, 1, 0],
    [0, 1, h, h, 1, 0, 0, 1, 0],
    [h, 1, 0, 0, 1, 1, 0, 1, 0],
  ],
  "ai-rnd": [
    [0, 0, 1, 1, h, h, 1, 0, 1],
    [h, 1, 0, 1, 0, 1, 0, h, 1],
    [1, h, 0, 0, 1, 1, h, 1, h],
  ],
  automatization: [
    [1, 0, 0, 0, 1, 0, h, h, 1],
    [1, h, 0, 0, 1, h, 0, 0, 1],
    [1, 0, h, h, 1, 0, 0, h, 1],
  ],
};

const FALLBACK_GRIDS = INDEX_GRIDS.experience;

/** the category's three service grids (selected first is the caller's job) */
export function indexGrids(categoryId: string): readonly [VoxelGrid, VoxelGrid, VoxelGrid] {
  return INDEX_GRIDS[categoryId] ?? FALLBACK_GRIDS;
}
