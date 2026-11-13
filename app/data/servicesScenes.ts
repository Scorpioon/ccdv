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

/* S3 Work with CCDV. */
export const WORK_WITH_INTRO = [
  "Every engagement follows the same sequence, sized to the project.",
  "We start with a diagnosis, agree a scope and work in short, reviewed stages. Decisions, changes and handoffs are documented as they happen, with the same protocols we use for our own tools.",
] as const;

export interface WorkWithCard {
  key: "cubes" | "panel" | "gear";
  step: string;
  caption: string;
}

export const WORK_WITH_CARDS: readonly WorkWithCard[] = [
  { key: "cubes", step: "Diagnose", caption: "We map the operation and define what needs to change." },
  { key: "panel", step: "Build", caption: "Design and code move together, in reviewed steps." },
  { key: "gear", step: "Hand over", caption: "Documented, maintainable and yours to run." },
];

/* S4 Next step */
export const NEXT_STEP_COPY =
  "Tell us how your team works today and what gets in the way. We'll tell you which services apply, and which don't.";
