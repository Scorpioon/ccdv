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
  /** Heading of the right-hand list; defaults to "[ Roadmap ]". */
  roadmapHeading?: string;
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
  /* GF09-F: "2027" has no editorial source and is an unsupported release
     claim, so the column stays and its value is a neutral dash. */
  { heading: "[ Release ]", body: "-" },
];
const RELEASE_COLUMN: CcosDetailColumn = { heading: "[ Release ]", body: "-" };

/* GF09-F editorial copy — verbatim from
   C:\Users\TONX\DEVKIT\projects\ccdv\work_assets\copys_v2.txt, the Products /
   CC.OS block (lines ~305–440). That block is NOT labelled "Corrected
   Version"; it is the approved working source for this task. Paragraph
   boundaries are kept as "\n\n" (rendered with white-space: pre-line).
   This block covers WRKOPS, KAIA and AETHERNOS; PANOPTES, KRON and
   KAIRON come from the R2 source below. The "Description" column (source
   tagline's lead paragraphs, headed "[ What it does ]") is three paragraphs and
   is taller than the old 366 band; OPERATOR approved a taller columns band
   (leaf CSS: `.ccos-sysdetail .ccos-detail__columns`). The development-status
   passages carry the source's own stable/under-development wording; display
   version markers (strip / rail) are unchanged and are not reconciled here. */
const WRKOPS_COLUMNS: CcosDetailColumn[] = [
  {
    heading: "[ What it does ]",
    body: "WRKOPS is our work-management and execution governance system.\n\nIt provides a structured way to define tasks, control changes, record decisions and track the lifecycle of development work.\n\nThe system supports a workflow in which technical operations remain traceable and important actions require explicit human authorisation.",
  },
  {
    heading: "[ Daily use ]",
    body: "We use WRKOPS to structure software development and maintenance work, maintain clear task boundaries and review changes before accepting them.",
  },
  {
    heading: "[ Development status ]",
    body: "Operational stable baseline: 1.8.2a.\n\nVersion 1.9 is under active development, extending the system's architecture and governance model.",
  },
  RELEASE_COLUMN,
];
const KAIA_COLUMNS: CcosDetailColumn[] = [
  {
    heading: "[ What it does ]",
    body: "KAIA is the product-intelligence component of CC.OS.\n\nIt is designed to preserve project context, organise feedback and support decisions throughout the development of a product.\n\nKAIA helps maintain a structured understanding of what a project needs, what has been observed and which directions require further attention.",
  },
  {
    heading: "[ Daily use ]",
    body: "KAIA is being developed around the need to keep product knowledge available, structured and separate from the tools that execute development tasks.",
  },
  {
    heading: "[ Development status ]",
    body: "Stable baseline: 0.4.1.\n\nVersion 0.5.1 is under development, with further work on controlled project-level feedback and local product intelligence.",
  },
  RELEASE_COLUMN,
];
// AETHERNOS has no "Daily use" in the source: column 2 keeps its prior content.
const AETHERNOS_COLUMNS: CcosDetailColumn[] = [
  {
    heading: "[ What it does ]",
    body: "AETHERNOS is an evolving information and evidence-management system.\n\nIt explores how files, records and operational history can be organised, checked and preserved across a growing software environment.\n\nThe objective is to make information easier to locate, reconcile and understand over time.",
  },
  SHARED_COLUMNS[1],
  {
    heading: "[ Development status ]",
    body: "Early standalone development and incubation.\n\nInitial work centres on controlled inbox reconciliation, file classification and evidence preservation.",
  },
  RELEASE_COLUMN,
];

/* GF09-F R2 editorial copy — verbatim from
   C:\Users\TONX\DEVKIT\projects\ccdv\work_assets\copys_v2_r2.txt (PANOPTES,
   KRON, KAIRON). Column 1 is the source's unheaded lead paragraphs followed
   by the paragraphs under its own "[ Description ]" heading (two distinct
   source blocks, joined in source order). Column 2 carries the one
   system-specific section the source provides ("[ AI Blue Team ]",
   "[ Time & Work ]", "[ Business Operations ]"); the source has no "Daily
   use" heading. Column 3 uses the source's "[ Development ]" heading. */
const PANOPTES_COLUMNS: CcosDetailColumn[] = [
  {
    heading: "[ Description ]",
    body: "PANOPTES is the security and issue-management component of CC.OS.\n\nIt is being developed as an AI-assisted blue-team environment for identifying risks, investigating findings and managing issues across our projects and technical systems.\n\nIts purpose is to bring security information, technical problems and their resolution history into a structured workflow.\n\nPANOPTES connects security reviews, reported issues and technical findings with the work required to resolve them.\n\nIt is designed to help operators assess risks, establish priorities and maintain a clear record of each issue from detection to resolution.",
  },
  {
    heading: "[ AI Blue Team ]",
    body: "AI-assisted analysis supports the investigation and classification of findings, helping identify relevant patterns, potential risks and possible remediation paths.\n\nSecurity decisions and corrective actions remain under human control.",
  },
  {
    heading: "[ Development ]",
    body: "Early product development. Security workflows, issue tracking and AI-assisted analysis are being defined and evaluated.",
  },
  RELEASE_COLUMN,
];
const KRON_COLUMNS: CcosDetailColumn[] = [
  {
    heading: "[ Description ]",
    body: "KRON is the time-management component of CC.OS.\n\nIt is being designed to organise schedules, deadlines and time allocation across projects and daily operations.\n\nKRON connects planned activities with the work they belong to, providing a clearer view of how time is organised and used.\n\nKRON brings time-related information into a shared operational context.\n\nThe system is intended to support scheduling, task planning and the allocation of time across different projects and responsibilities.\n\nIt explores how working time can be planned, recorded and reviewed.",
  },
  {
    heading: "[ Time & Work ]",
    body: "Projects involve commitments, recurring activities and changing priorities.\n\nKRON is designed to connect those elements with calendars, work sessions and operational planning, helping teams understand where their time goes.",
  },
  {
    heading: "[ Development ]",
    body: "Early product development. Scheduling, time tracking and integration with existing workflows are areas of ongoing research.",
  },
  RELEASE_COLUMN,
];
const KAIRON_COLUMNS: CcosDetailColumn[] = [
  {
    heading: "[ Description ]",
    body: "KAIRON is the business-management component of CC.OS.\n\nIt is being developed to organise the administrative, financial and operational information involved in running a business.\n\nThe system aims to connect everyday management activities with a clearer understanding of business resources, commitments and performance.\n\nKAIRON explores how business information can be managed within a structured digital environment.\n\nIts intended scope includes clients, projects, budgets, expenses and administrative processes, bringing related information together to support planning and operational decisions.",
  },
  {
    heading: "[ Business Operations ]",
    body: "Running a business involves managing information across different activities and tools.\n\nKAIRON is designed to connect these records and workflows, giving operators a more complete view of their business activity and its financial context.",
  },
  {
    heading: "[ Development ]",
    body: "Early product development. Business workflows, financial records and administrative integrations are being researched and defined.",
  },
  RELEASE_COLUMN,
];

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
    overviewStatement: "Work under control.",
    overviewLines: ["Law Protocol", "Task Scoping"],
    columns: WRKOPS_COLUMNS,
    featuresHeading: "[ Current capabilities ]",
    features: [
      "Task scoping and lifecycle management",
      "Structured execution reports",
      "Operator-controlled execution",
      "Review and validation workflows",
    ],
    roadmapHeading: "[ Development direction ]",
    roadmap: [
      "Stronger integration with CC.OS",
      "Improved compatibility between tools",
      "Clearer operational interfaces",
      "Continued refinement of task governance",
    ],
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
    overviewStatement: "Project intelligence, organised.",
    overviewLines: [],
    columns: KAIA_COLUMNS,
    featuresHeading: "[ Current focus ]",
    features: [
      "Product intelligence",
      "Feedback organisation",
      "Project context",
      "Structured decision support",
    ],
    roadmapHeading: "[ Development direction ]",
    roadmap: [
      "Controlled feedback intake",
      "Improved local project records",
      "Stronger evidence and provenance",
      "Better navigation across project Information",
    ],
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
    overviewStatement: "Keep the evidence.",
    overviewLines: [],
    columns: AETHERNOS_COLUMNS,
    featuresHeading: "[ Current focus ]",
    features: [
      "Inbox reconciliation",
      "Duplicate and conflict detection",
      "File and evidence classification",
      "Provenance and traceability",
    ],
    roadmapHeading: "[ Development direction ]",
    roadmap: [
      "Improved record organisation",
      "More accessible evidence history",
      "Controlled information retrieval",
      "Future integration with CC.OS",
    ],
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
    overviewStatement: "Security & Issue Management",
    overviewLines: [],
    columns: PANOPTES_COLUMNS,
    featuresHeading: "[ Features / Planned scope ]",
    features: [
      "Security findings and issue tracking",
      "AI-assisted blue-team analysis",
      "Risk assessment and prioritisation",
      "Incident and resolution history",
      "Human-reviewed remediation workflows",
    ],
    roadmap: [
      "Unified security and issue intake",
      "Structured triage and investigation",
      "AI-assisted finding analysis",
      "Integration with CC.OS operations",
    ],
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
    overviewStatement: "Time Management",
    overviewLines: [],
    columns: KRON_COLUMNS,
    featuresHeading: "[ Features / Planned scope ]",
    features: [
      "Time allocation and tracking",
      "Scheduling and calendar management",
      "Project and task time records",
      "Deadlines and recurring activities",
      "Time reporting and review",
    ],
    roadmap: [
      "Time-management workflows",
      "Calendar and scheduling interfaces",
      "Project-level time records",
      "Integration with WRKOPS and CC.OS",
    ],
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
    overviewStatement: "Business Management",
    overviewLines: [],
    columns: KAIRON_COLUMNS,
    featuresHeading: "[ Features / Planned scope ]",
    features: [
      "Business and client records",
      "Project budgets and expenses",
      "Financial overview and reporting",
      "Administrative workflow management",
      "Business planning and operational tracking",
    ],
    roadmap: [
      "Core business-management structure",
      "Financial and administrative records",
      "Business reporting interfaces",
      "Integration with CC.OS operations",
    ],
  },
];

export function getCcosSystem(id: CcosSystemId): CcosSystemData {
  const system = CCOS_SYSTEMS.find((entry) => entry.id === id);
  if (!system) {
    throw new Error(`Unknown CCOS system id: ${id}`);
  }
  return system;
}
