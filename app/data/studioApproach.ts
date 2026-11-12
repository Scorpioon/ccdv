/* Studio Approach (R3): the three activable slots of the interactive editorial
   panel, and the Build cards. Copy is the existing studioPrinciples.ts meaning,
   edited for repetition and tone (R3 scope: editorial polish allowed).
   Open decisions, recorded in the R3 report: which supporting card belongs to
   which slot (A05/A07) and the final caption copy of the Build cards (A09). */

export interface ApproachToollet {
  label: string;
  body: string;
}

export interface ApproachSlot {
  key: "resolution" | "efficiency" | "creativity";
  label: string;
  title: string;
  body: readonly string[];
  toollets: readonly [ApproachToollet, ApproachToollet];
}

export const APPROACH_SLOTS: readonly ApproachSlot[] = [
  {
    key: "resolution",
    label: "Resolution",
    title: "Understand the system first.",
    body: [
      "Every project has its own structure: people, data, tools and existing ways of working.",
      "We start there. We look at how information moves, where decisions happen and what creates unnecessary work, and that becomes the basis for the product and its technical requirements.",
    ],
    toollets: [
      {
        label: "Understanding",
        body: "We study the current workflow, the people involved and the tools already in place. This gives us a practical starting point.",
      },
      {
        label: "Defining",
        body: "We establish what the system needs to do, how people will use it and which technical requirements matter.",
      },
    ],
  },
  {
    key: "efficiency",
    label: "Efficiency",
    title: "Build tools that fit the work.",
    body: [
      "We develop tools for our own work and use them every day.",
      "They help us manage projects, organise information and test new ways of working. Early prototypes keep the scope manageable, and what we learn feeds directly back into our practice.",
    ],
    toollets: [
      {
        label: "Our own toolbelt",
        body: "Project management, information and automation tools we built, and keep improving, for our own studio.",
      },
      {
        label: "Improving",
        body: "We test, document and adjust what we build. A tool should stay understandable and maintainable after its first release.",
      },
    ],
  },
  {
    key: "creativity",
    label: "Creativity",
    title: "Design and code, one process.",
    body: [
      "We started with graphic design and digital experiences, and that background still shapes how we develop software.",
      "Interface, interaction, information and technical logic are parts of the same product. How a tool looks, works and behaves belongs to one design process.",
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

export interface BuildCardCopy {
  key: "scope" | "trace" | "review";
  title: string;
  caption: string;
}

export const BUILD_INTRO = [
  "We use our own development protocols and tools to organise technical work.",
  "WrkOps helps us scope tasks, track decisions, review changes and keep a record of what happens during development.",
  "It is part of our daily process and an ongoing software project in its own right.",
] as const;

export const BUILD_CARDS: readonly BuildCardCopy[] = [
  {
    key: "scope",
    title: "Scope",
    caption: "Each task starts as a written scope: what changes, what does not, and who validates it.",
  },
  {
    key: "trace",
    title: "Trace",
    caption: "Decisions and changes are recorded as they happen, so the reasoning stays readable after the work ships.",
  },
  {
    key: "review",
    title: "Review",
    caption: "Work moves in small, reviewed steps, one handoff after another.",
  },
];

export const CCOS_COPY = [
  "We build tools for the way we work.",
  "CC.OS is the software environment we are developing behind our studio. Its parts cover work management, project intelligence, information, security and business coordination.",
  "We use these projects to explore new ways of connecting software, automation and AI with everyday work.",
] as const;
