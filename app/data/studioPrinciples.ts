/* Studio Core Principles: the four CP cards and the four FAN accordion rows
   they control, paired by position (STD-DEC-013): CP01..04 left to right <->
   FAN01..04 top to bottom. The order of this array IS the pairing; nothing
   else maps one to the other.

   Copy is the "Corrected Version of Studio" block of
   work_assets/copys_v2.txt, reproduced verbatim. Only the bracket spacing of
   the labels follows the R1.1 convention already used by the site: card
   labels keep their inner spaces, the oversized fan row labels drop them.
   Which fan holds which block is a layout decision recorded in the GF09-E
   report, not something the copy file states. */

export interface StudioStep {
  label: string;
  body: readonly string[];
}

export interface StudioPrinciple {
  key: "CP01" | "CP02" | "CP03" | "CP04";
  fanKey: "FAN01" | "FAN02" | "FAN03" | "FAN04";
  /* card (CP) */
  label: string;
  summary: readonly string[];
  /* fan row (FAN) and its panel */
  fanLabel: string;
  fanBody: readonly string[];
  fanSteps?: readonly StudioStep[];
  fanTone: "panel" | "ink";
}

export const STUDIO_PRINCIPLES: readonly StudioPrinciple[] = [
  {
    key: "CP01",
    fanKey: "FAN01",
    label: "[ Our own toolbelt ]",
    summary: [
      "We develop tools for our own work and use them every day.",
      "They help us manage projects, organise information and test new ways of working. What we learn from building and using them feeds directly into our development practice.",
    ],
    fanLabel: "[From design to development]",
    fanBody: [
      "We started with graphic design, digital experiences and interface design.",
      "Working on increasingly complex digital projects brought us closer to the software behind them. Today, we combine that visual background with product thinking, development and technical research.",
      "The way a tool looks, works and behaves belongs to the same design process.",
    ],
    fanTone: "panel",
  },
  {
    key: "CP02",
    fanKey: "FAN02",
    label: "[ Design meets code ]",
    summary: [
      "Our background in design shapes how we develop software.",
      "We work with interfaces, interaction, information and technical logic as connected parts of the same product. Decisions made on screen have consequences behind it.",
    ],
    fanLabel: "[Understanding the system]",
    fanBody: [
      "Every project has its own structure: people, data, tools, responsibilities and existing ways of working.",
      "We begin by understanding that environment. We look at how information moves, where decisions happen and what creates unnecessary work.",
      "This becomes the basis for defining the product and its technical requirements.",
    ],
    fanTone: "panel",
  },
  {
    key: "CP03",
    fanKey: "FAN03",
    label: "[ Human ownership ]",
    summary: [
      "We want people to understand and control the systems they use.",
      "That means clear interfaces, visible processes, documented decisions and defined responsibilities. We pay particular attention to this when automation or AI is involved.",
    ],
    fanLabel: "[A collaborative approach]",
    fanBody: [
      "We work directly with the people who understand the project.",
      "Early prototypes allow us to test assumptions and identify problems while the scope is still manageable. Design and technical decisions are reviewed together, with specialist collaborators joining when a project requires them.",
    ],
    fanSteps: [
      {
        label: "[ Understanding ]",
        body: [
          "We study the current workflow, the people involved and the tools already in place. This gives us a practical starting point.",
        ],
      },
      {
        label: "[ Defining ]",
        body: [
          "We establish what the system needs to do, how people will use it and which technical requirements matter.",
        ],
      },
      {
        label: "[ Building ]",
        body: [
          "We move from prototypes to working software, reviewing functionality, interaction and technical decisions throughout development.",
        ],
      },
      {
        label: "[ Improving ]",
        body: [
          "We test, document and adjust what we build. A tool should remain understandable and maintainable after its first release.",
        ],
      },
    ],
    fanTone: "panel",
  },
  {
    key: "CP04",
    fanKey: "FAN04",
    label: "[ Built to evolve ]",
    summary: [
      "Software changes with the people and organisations using it.",
      "We work with modular structures, practical documentation and development processes that allow tools to be reviewed, maintained and improved over time.",
    ],
    fanLabel: "[Build with WrkOps™]",
    fanBody: [
      "We use our own development protocols and tools to organise technical work.",
      "WRKOPS helps us scope tasks, track decisions, review changes and keep a record of what happens during development.",
      "It is part of our daily process and an ongoing software project in its own right.",
    ],
    fanTone: "ink",
  },
];
