/* Products V2 content (t_20261117_products20, P1).

   Layout source: PRODUCTS_v2.svg (desktop, OPERATOR D1) and
   PRODUCTS_responsive_v2.svg (phone, OPERATOR D2). Both ship their text as
   outlined paths and much of it is designer draft (notes, jokes, misspellings,
   unsupported claims). Per D2 nothing here is invented: every string is either
   a publishable design label or sanctioned copy from
   work_assets/copys_v2.txt (the Products section), reproduced verbatim.
   Slots with no sanctioned prose show `PENDING` and are listed in the task
   report as open editorial slots. */

export const PENDING = "[ pending ]";

/* copys_v2.txt, Products › Introduction — three sentences in the design's
   three-line Whois\\ slot (the draft lines there are not published). */
export const PRODUCTS_INTRO = [
  "Alongside client work, we develop our own software.",
  "These projects grow out of practical needs, ongoing research and the tools we use to operate CCDV.",
  "Some are part of our daily workflow. Others are still being developed and tested.",
];

export interface ProductsTopic {
  key: "approach" | "target" | "offline" | "updates";
  /** the chip / tab label; `null` = withheld (shown as PENDING) */
  label: string | null;
  /** large lead line; `null` = no sanctioned prose (shown as PENDING) */
  headline: string | null;
  body: string[];
}

/* \\Our Software Code — four topics: four concurrent columns on desktop, one
   selected topic on phones; one record per topic keeps the two equivalent.
   - approach: the design repeats the sanctioned "We develop tools…" passage
     (copys_v2.txt / studioApproach.ts) under this column; its lead line is
     used as the headline, the two body sentences as the body.
   - target / updates: draft headlines and bodies only (and the same filler
     body repeated) — PENDING.
   - offline: its label "You own your software, also offline" asserts a product
     capability with no sanctioned source, so the label is withheld too. */
export const PRODUCTS_TOPICS: ProductsTopic[] = [
  {
    key: "approach",
    label: "\\\\Approach",
    headline: "We develop tools for our own work and use them every day.",
    body: [
      "They help us manage projects, organise information and test new ways of working.",
      "What we learn from building and using them feeds directly into our development practice.",
    ],
  },
  { key: "target", label: "\\\\Target", headline: null, body: [] },
  { key: "offline", label: null, headline: null, body: [] },
  { key: "updates", label: "\\\\Updates and community feedback", headline: null, body: [] },
];

export interface ProductsEntry {
  index: string;
  label: string;
  kind: "ccos" | "triangle" | "diamond" | "pentagon";
  /** only CC.OS navigates (PRD-DEC-002); the rest stay disabled (PRD-DEC-001) */
  href?: string;
}

/* Card 02 is LocalScene, 03 the historical Vault Cleaner candidate, 04 iDS
   (2026-11-17 OPERATOR rename from PROJECT L; mixed case kept). Cards 02-04
   carry the design's `[ Coming Soon ]` (OPERATOR D3). */
export const PRODUCTS: ProductsEntry[] = [
  { index: "01", label: "CC.OS", kind: "ccos", href: "/products/ccos" },
  { index: "02", label: "PROJECT LS", kind: "triangle" },
  { index: "03", label: "PROJECT VC", kind: "diamond" },
  { index: "04", label: "PROJECT iDS", kind: "pentagon" },
];

export const PRODUCTS_STATUS = "[ Coming Soon ]";

/* the desktop rail's empty frames 05-08: decoration, not products */
export const PRODUCTS_EMPTY_SLOTS = ["05", "06", "07", "08"];

/* CC.OS panel: design title and CTA label; the body is copys_v2.txt
   "Collapse Creative Operating System" (the first four paragraphs) in place of
   the design draft (misspellings, an unsourced component count and an
   unsupported release date). */
export const PRODUCTS_CCOS = {
  title: "Collapse Creative OS.",
  body: [
    "The operating environment behind our own work.",
    "CC.OS is an evolving system of tools, protocols and interfaces developed to support projects across Collapse Creative Dev. Unit.",
    "It connects different operational needs, from task management and project intelligence to information, system integrity and coordination.",
    "Each component has a defined responsibility and its own development path.",
  ],
  cta: "Visit the product page.",
  href: "/products/ccos",
};
