/* CC.OS deck content (t_20261117_products20 P2, PRODUCTS/CCOS.svg).

   OPERATOR: the intro, the WRKOPS lines and the two statement slides are the
   design draft cleaned up (notes to self dropped, spelling fixed, meaning
   kept); the other cores and CC.OS itself are written from copys_v2.txt
   (Products › Collapse Creative Operating System and the per-core passages;
   PANOPTES / KRON / KAIRON from the responsibilities table) in the tone of the
   rest of the site. Paragraph length in the mock is not binding. Facts with no
   source show PENDING. DRAFT — for OPERATOR editorial review. */

export const PENDING = "[ pending ]";

export type CcosCoreId = "ccos" | "wrkops" | "kaia" | "aethernos" | "kron" | "panoptes" | "kairon";

export interface CcosCore {
  id: CcosCoreId;
  name: string;
  /** the hex map's label; the selected hex shows its cube instead */
  abbr: string;
  /** the cube's tint (the R1.1 per-core colours) */
  color: string;
  /** module 3 — what the core is for */
  keywords: string;
  problems: string;
  /** module 6 — the product itself */
  area: string;
  description: string[];
  features: string[];
  roadmap: string[];
  state: string;
  release: string;
}

/* design draft: "Collapse Creative OS is a work and management suite for
   modern work operations. / Each core responds to a pillar of our work and
   studio day to day operations. / … an ecosistem of apps powered by llm-no llm
   that allows overview over different cores/sectors of your work." */
export const CCOS_INTRO = [
  "Collapse Creative OS is a work and management suite for modern operations.",
  "Each core answers to one pillar of our work and of the studio's day-to-day operations.",
  "Together they form an ecosystem of applications, with or without an LLM, that gives you an overview across every area of your work.",
];

/* design draft, slide 4 */
export const CCOS_MODULAR =
  "CC.OS is a modular ecosystem. Work with one core, with all of them, or with the configuration you prefer. Each core is built from the ground up and updates with the others, so they work together as one system.";

/* design draft, slide 5 */
export const CCOS_LOCAL =
  "Always local, with total oversight: a history of every operation, security gates, and functions that run with a third-party LLM, with your own local LLM, or without one. You control and oversee every movement.";

/* The explainer list's order (CC.OS, then the source list: WRKOPS, KAIA,
   AETHERNOS, KAIRON, KRON, PANOPTES). On the map (CcosCoreMap) CCOS sits in
   the centre with WRKOPS (the cube), INT, ARC, TME, SEC, BIZ around it
   (OPERATOR mapping: INT KAIA, ARC AETHERNOS, TME KRON, SEC PANOPTES, BIZ
   KAIRON). */
export const CCOS_CORES: CcosCore[] = [
  {
    id: "ccos",
    name: "CC.OS",
    abbr: "CCOS",
    color: "#303030",
    keywords: "Work operations, project intelligence, information, security, time, business.",
    problems:
      "Studio work is spread across tools that do not talk to each other. CC.OS connects work management, project intelligence, information, security, time and business coordination in one environment, with each part responsible for one job.",
    area: "Operating environment",
    description: [
      "The operating environment behind our own work.",
      "CC.OS is an evolving system of tools, protocols and interfaces developed to support projects across Collapse Creative Dev. Unit. Each component has a defined responsibility and its own development path.",
    ],
    features: [
      "Work management — WRKOPS",
      "Project intelligence — KAIA",
      "Information and evidence — AETHERNOS",
      "Security — PANOPTES",
      "Time — KRON",
      "Business — KAIRON",
    ],
    roadmap: ["Closer integration between the cores", "Improved compatibility between tools", "Clearer operational interfaces"],
    state: "In development. v0.3.0",
    release: PENDING,
  },
  {
    id: "wrkops",
    name: "WRKOPS",
    abbr: "WRK",
    color: "#545454",
    keywords: "Task scoping, change control, decision records, reviews.",
    problems:
      "Development work loses track of what was asked, what changed and who approved it. WRKOPS keeps every task scoped, every change reviewed and every decision recorded, and important actions wait for explicit human authorisation.",
    area: "LLM work",
    description: [
      "Our main protocol: work management and execution governance.",
      "WRKOPS defines how tasks are opened, scoped, reviewed and closed, with reports and evidence throughout. We use it every day to structure development and maintenance work.",
    ],
    features: [
      "Task scoping and lifecycle management",
      "Structured execution reports",
      "Operator-controlled execution",
      "Review and validation workflows",
    ],
    roadmap: [
      "Stronger integration with CC.OS",
      "Improved compatibility between tools",
      "Clearer operational interfaces",
      "Continued refinement of task governance",
    ],
    state: "Internal use. v1.8.2a, 1.9 in development",
    release: "2027",
  },
  {
    id: "kaia",
    name: "KAIA",
    abbr: "INT",
    color: "#8654B3",
    keywords: "Product intelligence, feedback, project context, decisions.",
    problems:
      "Feedback, findings and priorities scatter across conversations and documents, and decisions lose their reasons. KAIA keeps a project's knowledge structured and connected to the project it came from.",
    area: "Project intelligence",
    description: [
      "KAIA is the product-intelligence component of CC.OS.",
      "It preserves project context, organises feedback and supports decisions throughout the development of a product, separate from the tools that execute the work.",
    ],
    features: ["Product intelligence", "Feedback organisation", "Project context", "Structured decision support"],
    roadmap: [
      "Controlled feedback intake",
      "Improved local project records",
      "Stronger evidence and provenance",
      "Better navigation across project information",
    ],
    state: "Internal use. v0.4.1, 0.5.1 in development",
    release: PENDING,
  },
  {
    id: "aethernos",
    name: "AETHERNOS",
    abbr: "ARC",
    color: "#B35464",
    keywords: "Evidence, files, provenance, reconciliation.",
    problems:
      "Files pile up, duplicates multiply and nobody remembers where a record came from. AETHERNOS examines incoming material, flags duplicates and conflicts, and preserves the evidence behind every record.",
    area: "Information and evidence",
    description: [
      "AETHERNOS is an evolving information and evidence-management system.",
      "It organises, checks and preserves files, records and operational history, so information stays easy to locate, reconcile and understand over time.",
    ],
    features: [
      "Inbox reconciliation",
      "Duplicate and conflict detection",
      "File and evidence classification",
      "Provenance and traceability",
    ],
    roadmap: [
      "Improved record organisation",
      "More accessible evidence history",
      "Controlled information retrieval",
      "Future integration with CC.OS",
    ],
    state: "Early standalone development",
    release: PENDING,
  },
  {
    id: "kairon",
    name: "KAIRON",
    abbr: "BIZ",
    color: "#5AE36F",
    keywords: "Business management, administration, operational oversight.",
    problems:
      "Administration lives apart from the work it depends on. KAIRON keeps business management and operational oversight next to the projects they serve.",
    area: "Business",
    description: ["KAIRON is the business component of CC.OS: business management, administration and operational oversight."],
    features: [PENDING],
    roadmap: [PENDING],
    state: PENDING,
    release: PENDING,
  },
  {
    id: "kron",
    name: "KRON",
    abbr: "TME",
    color: "#B38B54",
    keywords: "Time management, scheduling, time allocation.",
    problems:
      "Plans drift away from the time actually available. KRON brings scheduling and time allocation into the same system as the work itself.",
    area: "Time",
    description: ["KRON is the time component of CC.OS: time management, scheduling and time allocation."],
    features: [PENDING],
    roadmap: [PENDING],
    state: PENDING,
    release: PENDING,
  },
  {
    id: "panoptes",
    name: "PANOPTES",
    abbr: "SEC",
    color: "#48A4F6",
    keywords: "Security, issue management, blue-team operations.",
    problems:
      "Security issues are easy to miss and hard to follow through. PANOPTES gathers them in one place, tracks each one to its resolution and supports blue-team work with AI assistance under human control.",
    area: "Security",
    description: ["PANOPTES is the security component of CC.OS: issue management and AI-assisted blue-team operations."],
    features: [PENDING],
    roadmap: [PENDING],
    state: PENDING,
    release: PENDING,
  },
];

export const CCOS_DEFAULT_CORE: CcosCoreId = "ccos";

export function getCcosCore(id: CcosCoreId): CcosCore {
  return CCOS_CORES.find((core) => core.id === id) ?? CCOS_CORES[0];
}
