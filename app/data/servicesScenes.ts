/* Services R1 scene copy (t_20261113_servicesr1). PROVISIONAL OPERATOR drafts,
   transcribed from CCDV_SERVICES_R1_EDITORIAL_COPY_AND_DECISIONS_20261113_v0.1.md;
   not accepted website claims. Proofread only (no change of meaning). The
   approved categories, services, descriptions and Focus pairs are NOT here:
   they stay in servicesContent.ts, the one canonical source. This file only adds
   the editorial lines around them, keyed by the stable category ids. */

/* S1 Whatis\\: three paragraphs; `strong` runs are the draft's bold runs */
export type CopyRun = string | { strong: string };

export const SERVICES_WHATIS: readonly (readonly CopyRun[])[] = [
  [
    "CCDV. services cover the full path of a digital product: from understanding how an operation works to designing, building and automating the software around it.",
  ],
  [
    "We work across ",
    { strong: "strategy, product, experience, AI research and automation." },
    " Each project combines the parts it needs, ",
    { strong: "scoped to the problem" },
    ", not to a package.",
  ],
  [
    "Every service ends in something that works: ",
    { strong: "a defined scope, a running prototype, a shipped tool" },
    " or a documented system.",
  ],
];

/* S2: one "//" lead per category, keyed by servicesContent category id */
export const SERVICE_CATEGORY_LEADS: Readonly<Record<string, string>> = {
  strategy: "Before building, we look at how the work actually happens.",
  product: "Software shaped around a specific use.",
  experience: "The interface is where a system becomes understandable.",
  "ai-rnd": "Testing what a technology can really do, before relying on it.",
  automatization: "Less repeated work, with people still in control.",
};

/* S3 Work with CCDV. (the intro stays the OPERATOR draft: the SERVICES_v2
   column repeats Studio's CC.OS text, see the report) */
export const WORK_WITH_INTRO = [
  "Every engagement follows the same sequence, sized to the project.",
  "We start with a diagnosis, agree a scope and work in short, reviewed stages. Decisions, changes and handoffs are documented as they happen, with the same protocols we use for our own tools.",
] as const;

/* R1 CORR01: the three cards and their captions are the SERVICES_v2 cards
   (Frame 348..350), proofread (see the report for before / after) */
export interface WorkWithCard {
  key: "diagnose" | "intelligence" | "modular";
  caption: string;
}

export const WORK_WITH_CARDS: readonly WorkWithCard[] = [
  { key: "diagnose", caption: "We analyse and diagnose the current situation." },
  { key: "intelligence", caption: "We provide your product intelligence so you know how to run your system." },
  { key: "modular", caption: "Bringing the pieces together: a modular approach to things makes maintenance easy." },
];

/* S4 Formation (R1 CORR01, SERVICES_v2 y2985..4160, proofread). The newsletter
   link has no route of its own yet; it points at /contact (see the report). */
export const FORMATION_COPY =
  "We form teams and promote workshops where you can learn more about LLM work and tool development. It's mainly aimed at creatives, but also at developers or administration workers. We'll build tools.";
export const FORMATION_LINK = { label: "Join the newsletter!", to: "/contact" } as const;

export interface FormationCard {
  key: "gear" | "arrow" | "network" | "toolmaking";
  caption: string;
}

/* card order = FORMATION_SHAPES order (voxelShapes.ts) */
export const FORMATION_CARDS: readonly FormationCard[] = [
  { key: "gear", caption: "Tailored formation for teams or students." },
  { key: "arrow", caption: "Keep up with advancements" },
  { key: "network", caption: "Understanding LLMs" },
  { key: "toolmaking", caption: "Toolmaking Workshops" },
];
/* the pile as drawn in SERVICES_v2 is the Toolmaking formation */
export const FORMATION_DEFAULT = 3;
/* CORR01 optional stretch: a mouse / pen can pick up and throw a pile cube.
   OPERATOR switch: set false if the frame-time check fails (see the report). */
export const FORMATION_THROW = true;
