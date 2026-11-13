/* Services R1 CORR01: the Service Index voxel face, one pattern per service
   (5 categories x 3 services = 15 states), keyed by the stable category ids of
   servicesContent.ts and indexed by the service's position in its category.

   Vocabulary, read from the OPERATOR exports (webdesign_responsive_v2):
     SERVICES_v2.svg   the approved index: three rows of three tiles
     Frame 355..358    the four variation studies: three bands (rows or
                       columns), each split into 2, 3 or 4 equal cells; a cell is
                       blank (hairline only), half red (0.5) or full red (1)

   A pattern is therefore `axis` + three bands of cell fills. The bands always
   share the one 648 x 600 face (the screenshot's nine-tile 3 x 3 square, x48..696
   at the 1440 reference), so a pattern never becomes an 81-cell grid: the
   OPERATOR's "9x9" is read as the nine-position 3 x 3 face, re-cut per state into
   2-, 3- or 4-cell bands (see the report).

   Category identity = axis + band cut family; the three services of a category
   are three different cuts (shape changes, not only colour):
     strategy        rows, the top band a 2-cut   (Frame 358 family)
     product         rows, 4-cut bands            (Frame 356 family)
     experience      rows, 3-cut with the red middle spine (SERVICES_v2 family)
     ai-rnd          columns, 2/3/4 cuts          (Frame 357 family)
     automatization  columns, even 3- and 4-cuts  (Frame 355 family)

   Transitions are mapped, not swapped: tile slot = band * 4 + cell (12 slots),
   so cell c of band b always moves to cell c of band b of the next pattern; a
   cell the next pattern does not have collapses into its band's far end. */

export type VoxelFill = 0 | 0.5 | 1;

export interface IndexPattern {
  /** the export this pattern is transcribed from, if any */
  source?: string;
  axis: "rows" | "cols";
  /** three bands (top to bottom for rows, left to right for cols); each band's
      cells in reading order (left to right, top to bottom) */
  bands: readonly [readonly VoxelFill[], readonly VoxelFill[], readonly VoxelFill[]];
}

const h = 0.5;

export const INDEX_PATTERNS: Readonly<Record<string, readonly [IndexPattern, IndexPattern, IndexPattern]>> = {
  strategy: [
    /* Operational Diagnosis */
    { source: "Frame 358", axis: "rows", bands: [[1, 0], [0, h, 0], [1, h, 0, 1]] },
    /* System Architecture */
    { axis: "rows", bands: [[0, 1], [h, 0, 1, 0], [1, 0, h]] },
    /* Product Scoping */
    { axis: "rows", bands: [[h, 1], [0, 1, 0], [0, h, 1]] },
  ],
  product: [
    /* Web Applications */
    { source: "Frame 356", axis: "rows", bands: [[1, 0, h, 1], [0, h, 1, 0], [h, 0, 1]] },
    /* Internal Tools */
    { axis: "rows", bands: [[1, 0, h], [0, 1, 0, h], [h, 0, 0, 1]] },
    /* Functional Prototypes */
    { axis: "rows", bands: [[h, 1, 0, 0], [0, 1, h], [1, 0, h, 1]] },
  ],
  experience: [
    /* UX & Information Architecture: the approved SERVICES_v2 index */
    { source: "SERVICES_v2", axis: "rows", bands: [[h, 1, 0], [0, 1, h], [0, 1, 0]] },
    /* UI & Interaction Design */
    { axis: "rows", bands: [[0, 1, h], [h, 1], [0, 1, 0]] },
    /* Interface Systems */
    { axis: "rows", bands: [[h, 1, 0], [0, 1, 1, h], [0, 1, 0]] },
  ],
  "ai-rnd": [
    /* Applied AI */
    { source: "Frame 357", axis: "cols", bands: [[0, 1], [0, h, 0], [1, 0, h, 1]] },
    /* Technical Research */
    { axis: "cols", bands: [[h, 0, 1, 0], [1, 0, h], [0, 1]] },
    /* AI Prototyping */
    { axis: "cols", bands: [[1, 0, h], [h, 1], [0, 1, 0, h]] },
  ],
  automatization: [
    /* Workflow Automation: Frame 355's rows read as columns */
    { source: "Frame 355", axis: "cols", bands: [[1, 0, 0], [0, 1, h], [1, 0, h]] },
    /* Tool Integrations */
    { axis: "cols", bands: [[1, 0, 0, h], [0, 1, h, 0], [h, 0, 1, 0]] },
    /* Data Workflows */
    { axis: "cols", bands: [[1, 0, h], [0, 1, 0, h], [h, 0, 1, 0]] },
  ],
};

/* the approved SERVICES_v2 drawing, for a category/service with no pattern */
export const FALLBACK_PATTERN: IndexPattern = INDEX_PATTERNS.experience[0];

export function indexPattern(categoryId: string, serviceIndex: number): IndexPattern {
  return INDEX_PATTERNS[categoryId]?.[serviceIndex] ?? FALLBACK_PATTERN;
}
