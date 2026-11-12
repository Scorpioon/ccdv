/* Studio copy (R3 + OPUS CORR01). Wording follows the V2 originals
   (work_assets/webdesign_responsive_v2: FB_R4_5.svg desktop 1440 x 4060,
   STUDIO_resp3-1.svg mobile 390 x 4968) wherever they carry real copy; where an
   original holds placeholder text ("Toolbelt 1", the same caption on all three
   Build cards) the existing R3 copy is kept and the gap is an OPEN item in the
   R3 report. Spelling fixed, no new claims. */

export interface ApproachToollet {
  label: string;
  body: string;
}

export interface ApproachSlot {
  key: "resolution" | "efficiency" | "creativity";
  label: string;
  /** first paragraph, shown after the "// " lead as in the original */
  lead: string;
  body: readonly string[];
  toollets: readonly [ApproachToollet, ApproachToollet];
}

/* Slot i lights sphere layer i (upper, middle, lower) and progress bar i. */
export const APPROACH_SLOTS: readonly ApproachSlot[] = [
  {
    key: "resolution",
    label: "Resolution",
    lead: "Understand the system first.",
    body: [
      "Every project has its own structure: people, data, tools and existing ways of working.",
      "We look at how information moves, where decisions happen and what creates unnecessary work. That becomes the basis for the product and its technical requirements.",
    ],
    toollets: [
      {
        label: "Understanding",
        body: "We study the current workflow, the people involved and the tools already in place.",
      },
      {
        label: "Defining",
        body: "We establish what the system needs to do, how people will use it and which requirements matter.",
      },
    ],
  },
  {
    /* FB_R4_5 / STUDIO_resp3-1 show this slot's copy verbatim */
    key: "efficiency",
    label: "Efficiency",
    lead: "We develop tools for our own work and use them every day.",
    body: [
      "They help us manage projects, organise information and test new ways of working.",
      "What we learn from building and using them feeds directly into our development practice.",
    ],
    toollets: [
      {
        label: "Toolbelt",
        body: "Project management, information and automation tools we built, and keep improving, for our own studio.",
      },
      {
        label: "Improving",
        body: "We test, document and adjust what we build, so a tool stays understandable after its first release.",
      },
    ],
  },
  {
    key: "creativity",
    label: "Creativity",
    lead: "Design and code, one process.",
    body: [
      "We started with graphic design and digital experiences, and that background still shapes how we develop software.",
      "Interface, interaction, information and technical logic are parts of the same product.",
    ],
    toollets: [
      {
        label: "Design meets code",
        body: "Decisions made on screen have consequences behind it. We make them together.",
      },
      {
        label: "Human ownership",
        body: "Clear interfaces, visible processes and documented decisions, especially where automation or AI is involved.",
      },
    ],
  },
];

/** the slot shown on load: the one the originals draw lit (middle layer, middle bar, its copy) */
export const APPROACH_DEFAULT_SLOT = 1;

export interface BuildCardCopy {
  key: "cubes" | "panel" | "gear";
  caption: string;
}

/* Build with WrkOps™ intro: the V2 originals' copy under the joined chip */
export const BUILD_INTRO = [
  "We build tools for the way we work.",
  "CC.OS is the developing software environment behind our studio. Its components address different parts of our operations, including work management, project intelligence, information, security and business coordination.",
  "We use these projects to explore new ways of connecting software, automation and AI with everyday work.",
] as const;

/* One short caption per card, in the compact white capsule. The originals
   repeat card 1's sentence as a placeholder on all three (OPEN: A09). */
export const BUILD_CARDS: readonly BuildCardCopy[] = [
  { key: "cubes", caption: "We use our own development protocols and tools to organise technical work." },
  { key: "panel", caption: "Decisions and changes are recorded as they happen, so the reasoning stays readable." },
  { key: "gear", caption: "Work moves in small, reviewed steps, one handoff after another." },
];

export const CCOS_COPY =
  "Collapse Creative OS sits at the center of our daily operations. Together with WrkOps and other core systems we operate and create our own projects, tools and client work.";

export const CCOS_CAPTION =
  "Defining a modular suite thought for creative work, design, code, intelligence, archive, business management, security and time. Working offline. With-without LLM. Powered by you.";
