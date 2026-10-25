/* CCOS subsystem data (GF08-C2). One record per system, feeding the shared
   `CcosSystemDetail` template and the six thin route files.

   Content is transcribed from the six R1.1 reference exports
   (work_assets/webdesign_r1_1/page_products_ccos_{wkrops,kaia,athernos,
   panoptes,kron,kairon}.png/.svg), read directly (the SVGs' text is
   outlined to paths, not live text, so the PNGs were read visually).
   Per CCSYS-F-007 / CLAUDE.md §9, none of this is a verified release fact:
   version numbers, the four detail-column bodies and both Features/Roadmap
   lists are editorial placeholders, several of them literally copy-pasted
   across systems in the source exports (see the per-field notes below) —
   transcribed faithfully, not corrected or invented.

   Internal `id`s are the stable legacy spellings already established on
   `CcosSystemRail` (`wkrops`, `athernos`) and must not change. `name` is the
   corrected public spelling CLAUDE.md §2/§4 authorizes (the AETHERNOS source
   wordmark itself reads "ATHERNOS", missing the first E — same typo as the
   `athernos` id/basename, carried one level further into the rendered page
   than the handoff's own note called out); `route` is the corresponding
   corrected public path. */

export type CcosSystemId = "wkrops" | "kaia" | "athernos" | "panoptes" | "kron" | "kairon";

export interface CcosDetailColumn {
  heading: string;
  body: string;
}

export interface CcosSystemData {
  id: CcosSystemId;
  name: string;
  route: string;
  railIndex: number;

  /** CSS `var(--ccdv-*)` reference — one of the six tokens CLAUDE.md §4 assigns. */
  themeColor: string;
  /** Foreground text color for the header/hero chrome once it's tinted by `themeColor`. */
  heroTextColor: string;
  /** Whether the inter-section stripe and the Features/Roadmap panel pick up
   *  `themeColor` (observed on 5 of 6 systems) or stay neutral (WRKOPS only —
   *  its own stripe/list rects use the plain #D9D9D9/#CACAC8 neutrals, not
   *  its own grey token; see GF08-C2 report §findings). */
  accentPanels: boolean;

  /** `.ccos-sysdetail__body` height, in `--u` units — derived from each SVG's
   *  own rect stack: overviewHeightUnits + 31 + 366 + 31 + 366. */
  bodyHeightUnits: number;
  /** `.ccos-sysdetail__overview` height, in `--u` units. */
  overviewHeightUnits: number;

  /** Large title-strip number next to the wordmark (e.g. "0.3.0", "0.1"). */
  stripVersion: string;
  /** The version fragment shown under the hero rail, exactly as sourced —
   *  WRKOPS/KAIA bracket it ("[1.9]"), the other four don't ("0.1"). */
  railVersionDisplay: string;

  overviewStatement: string;
  overviewLines: string[];

  columns: CcosDetailColumn[];

  featuresHeading: string;
  features: string[];
  roadmap: string[];
}

/* Detail columns, Features list and Roadmap list are byte-identical across
   all six exports (same four headings/bodies, same four "-" placeholder
   rows) — CCSYS-F-007's "repeated placeholder text" observation confirmed
   directly against every PNG. One shared constant, not six copies. */
const SHARED_COLUMNS: CcosDetailColumn[] = [
  {
    heading: "[ Wrkops Description ]",
    body: "We build our own tools and develop project specific tools. We take special care with UX/UI design",
  },
  {
    heading: "[ Use block 2 ]",
    body: "We put care into creating systems that gives ownership over automated tasks, leverages cognitive fatigue of repeating tasks.",
  },
  { heading: "[ Version details ]", body: "v. 1.9.0" },
  { heading: "[ Release ]", body: "2027" },
];
const PLACEHOLDER_ROWS = ["-", "-", "-", "-"];

/* The generic "Kaia is our product intelligence. / One or two liner" overview
   copy appears verbatim on KAIA's own page and on all four of
   PANOPTES/KRON/KAIRON/AETHERNOS — only WRKOPS carries its own distinct
   overview statement + a real two-item list. Transcribed as observed, not
   written per-system to paper over the leak. */
const GENERIC_OVERVIEW_STATEMENT = "Kaia is our product intelligence.";
const GENERIC_OVERVIEW_LINES = ["One or two liner"];

/* Likewise the Features-panel heading: WRKOPS/KAIA carry their own system
   name, but AETHERNOS/PANOPTES/KRON/KAIRON all reuse "[ Athernos Features
   Actual ]" verbatim (confirmed on each of the four PNGs individually). */
const LEAKED_FEATURES_HEADING = "[ Athernos Features Actual ]";

export const CCOS_SYSTEMS: CcosSystemData[] = [
  {
    id: "wkrops",
    name: "WRKOPS",
    route: "/products/ccos/wrkops",
    railIndex: 0,
    themeColor: "var(--ccdv-ccos-grey)",
    heroTextColor: "var(--ccdv-bg)",
    accentPanels: false,
    bodyHeightUnits: 1057, // 263 + 31 + 366 + 31 + 366
    overviewHeightUnits: 263,
    stripVersion: "0.3.0",
    railVersionDisplay: "[1.9]",
    overviewStatement: "Wrkops is:",
    overviewLines: ["Law Protocol", "Task Scoping"],
    columns: SHARED_COLUMNS,
    featuresHeading: "[ Wrkops Features Actual ]",
    features: PLACEHOLDER_ROWS,
    roadmap: PLACEHOLDER_ROWS,
  },
  {
    id: "kaia",
    name: "KAIA",
    route: "/products/ccos/kaia",
    railIndex: 1,
    themeColor: "var(--ccdv-purple)",
    heroTextColor: "var(--ccdv-ink)",
    accentPanels: true,
    bodyHeightUnits: 1014, // 220 + 31 + 366 + 31 + 366
    overviewHeightUnits: 220,
    stripVersion: "1.9",
    railVersionDisplay: "[0.5.1]",
    overviewStatement: GENERIC_OVERVIEW_STATEMENT,
    overviewLines: GENERIC_OVERVIEW_LINES,
    columns: SHARED_COLUMNS,
    featuresHeading: "[ KAIA Features Actual ]",
    features: PLACEHOLDER_ROWS,
    roadmap: PLACEHOLDER_ROWS,
  },
  {
    id: "athernos",
    name: "AETHERNOS",
    route: "/products/ccos/aethernos",
    railIndex: 2,
    themeColor: "var(--ccdv-rose)",
    heroTextColor: "var(--ccdv-ink)",
    accentPanels: true,
    bodyHeightUnits: 1014,
    overviewHeightUnits: 220,
    stripVersion: "0.1",
    railVersionDisplay: "0.1",
    overviewStatement: GENERIC_OVERVIEW_STATEMENT,
    overviewLines: GENERIC_OVERVIEW_LINES,
    columns: SHARED_COLUMNS,
    featuresHeading: "[ Athernos Features Actual ]",
    features: PLACEHOLDER_ROWS,
    roadmap: PLACEHOLDER_ROWS,
  },
  {
    id: "panoptes",
    name: "PANOPTES",
    route: "/products/ccos/panoptes",
    railIndex: 3,
    themeColor: "var(--ccdv-blue)",
    heroTextColor: "var(--ccdv-ink)",
    accentPanels: true,
    bodyHeightUnits: 1014,
    overviewHeightUnits: 220,
    stripVersion: "0.1",
    railVersionDisplay: "0.1",
    overviewStatement: GENERIC_OVERVIEW_STATEMENT,
    overviewLines: GENERIC_OVERVIEW_LINES,
    columns: SHARED_COLUMNS,
    featuresHeading: LEAKED_FEATURES_HEADING,
    features: PLACEHOLDER_ROWS,
    roadmap: PLACEHOLDER_ROWS,
  },
  {
    id: "kron",
    name: "KRON",
    route: "/products/ccos/kron",
    railIndex: 4,
    themeColor: "var(--ccdv-ochre)",
    heroTextColor: "var(--ccdv-ink)",
    accentPanels: true,
    bodyHeightUnits: 1014,
    overviewHeightUnits: 220,
    stripVersion: "0.1",
    railVersionDisplay: "0.1",
    overviewStatement: GENERIC_OVERVIEW_STATEMENT,
    overviewLines: GENERIC_OVERVIEW_LINES,
    columns: SHARED_COLUMNS,
    featuresHeading: LEAKED_FEATURES_HEADING,
    features: PLACEHOLDER_ROWS,
    roadmap: PLACEHOLDER_ROWS,
  },
  {
    id: "kairon",
    name: "KAIRON",
    route: "/products/ccos/kairon",
    railIndex: 5,
    themeColor: "var(--ccdv-green)",
    heroTextColor: "var(--ccdv-ink)",
    accentPanels: true,
    bodyHeightUnits: 1014,
    overviewHeightUnits: 220,
    stripVersion: "0.1",
    railVersionDisplay: "0.1",
    overviewStatement: GENERIC_OVERVIEW_STATEMENT,
    overviewLines: GENERIC_OVERVIEW_LINES,
    columns: SHARED_COLUMNS,
    featuresHeading: LEAKED_FEATURES_HEADING,
    features: PLACEHOLDER_ROWS,
    roadmap: PLACEHOLDER_ROWS,
  },
];

export function getCcosSystem(id: CcosSystemId): CcosSystemData {
  const system = CCOS_SYSTEMS.find((entry) => entry.id === id);
  if (!system) {
    throw new Error(`Unknown CCOS system id: ${id}`);
  }
  return system;
}
