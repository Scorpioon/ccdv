/* Products V2 content (t_20261117_products20, P1 / P1b).

   Layout source: PRODUCTS_v2.svg (desktop, OPERATOR D1; \\Our Software Code
   from the single-midpanel variant since P1b) and
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

/* \\Our Software Code — four topics, one selected at a time at every width
   (P1b, OPERATOR: the single-midpanel variant on desktop).

   P1b CORR02 copy (OPERATOR: "the first paragraphs give a rough idea"):
   written from the design draft's lead paragraphs (PRODUCTS_v2.svg columns),
   with the designer notes left out ("dont use 'inteligence managers'", the
   "explain ableton…" note) and the repeated filler body replaced by
   topic-specific lines. Approach keeps the sanctioned copys_v2.txt passage
   ("We develop tools…") as its body and the draft's "We aim to develop
   software that…" (truncated in the design) completed as its headline with the
   draft's own closing line ("they do specific jobs"). DRAFT — for OPERATOR
   editorial review. */
export const PRODUCTS_TOPICS: ProductsTopic[] = [
  {
    key: "approach",
    label: "\\\\Approach",
    headline: "We aim to develop software that does a specific job, and does it well.",
    body: [
      "We develop tools for our own work and use them every day.",
      "They help us manage projects, organise information and test new ways of working.",
      "What we learn from building and using them feeds directly into our development practice.",
    ],
  },
  {
    key: "target",
    label: "\\\\Target",
    headline: "Our target is mainly the creative industry: freelancers, design studios and the teams around them.",
    body: [
      "We build for people who run their own projects and need tools that fit the way creative work actually happens.",
      "Each product starts from a problem we have met in our own studio work.",
    ],
  },
  {
    key: "offline",
    label: "\\\\You own your software, also offline",
    headline: "You can use your software forever, also offline. With or without an LLM.",
    body: [
      "What you get is yours to keep: it keeps working without a connection or an account.",
      "AI features are an option, never a requirement — every tool stays fully usable without them.",
    ],
  },
  {
    key: "updates",
    label: "\\\\Updates and community feedback",
    headline: "We review all feedback and update our products constantly.",
    body: [
      "Regular updates are included. Major versions are offered to existing users at a reduced price, so you decide when to upgrade.",
      "No recurring subscriptions.",
    ],
  },
];

export interface ProductsPanel {
  title: string;
  body: string[];
  /** CC.OS only: LS and iDS have no product page yet (OPERATOR) */
  cta?: { label: string; href: string };
  art: "ccos" | "ls" | "ids";
}

export interface ProductsEntry {
  index: string;
  label: string;
  kind: "ccos" | "triangle" | "pentagon";
  /** the card's status line (02 / 04) */
  status?: string;
  /** what drops below the rail when the slot is opened */
  panel: ProductsPanel;
}

export const PRODUCTS_STATUS = "[ Coming Soon ]";

/* The rail's eight slots (P1b CORR03, OPERATOR): a product slot opens its
   panel below the rail (phones: under its row); 01 is open on load. Card 02 is
   LocalScene, 04 iDS (2026-11-17 OPERATOR rename from PROJECT L; mixed case
   kept). The former 03 (PROJECT VC) is removed with all its text (OPERATOR):
   03 is an empty frame now, as 05-08.

   CC.OS: design title and CTA label; the body is copys_v2.txt "Collapse
   Creative Operating System" (the first four paragraphs) in place of the
   design draft. LS / iDS: `Project LS.svg` / `Project iDS.svg` (2026-11-19),
   reworded without changing the meaning (OPERATOR); "next year" written as
   2027. No CTA for either (OPERATOR). */
export const PRODUCTS: ProductsEntry[] = [
  {
    index: "01",
    label: "CC.OS",
    kind: "ccos",
    panel: {
      title: "Collapse Creative OS.",
      body: [
        "The operating environment behind our own work.",
        "CC.OS is an evolving system of tools, protocols and interfaces developed to support projects across Collapse Creative Dev. Unit.",
        "It connects different operational needs, from task management and project intelligence to information, system integrity and coordination.",
        "Each component has a defined responsibility and its own development path.",
      ],
      cta: { label: "Visit the product page.", href: "/products/ccos" },
      art: "ccos",
    },
  },
  {
    index: "02",
    label: "PROJECT LS",
    kind: "triangle",
    status: PRODUCTS_STATUS,
    panel: {
      title: "Project LS.",
      body: [
        "Project LS is not meant to be a paid product as such, but rather a community service for Barcelona.",
        "Having passed its first concept and design rounds, Project LS will reveal more about itself in 2027.",
      ],
      art: "ls",
    },
  },
  {
    index: "04",
    label: "PROJECT iDS",
    kind: "pentagon",
    status: PRODUCTS_STATUS,
    panel: {
      title: "Project iDS.",
      body: [
        "Project iDS is a new tool for studio and management organisation.",
        "More about iDS will be revealed in late 2027.",
      ],
      art: "ids",
    },
  },
];

export const PRODUCTS_SLOTS = ["01", "02", "03", "04", "05", "06", "07", "08"];
export const PRODUCTS_DEFAULT_OPEN = "01";
