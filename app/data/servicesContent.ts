/* Single canonical data source for /services (MTG03, FBI-023..027; MTG04 copy).

   Shape: category (5) -> services (N per category) -> paragraphs + focus.
   Every id is scoped by its parent (`${categoryId}` / `${categoryId}-${n}`), so
   a service id can never exist under two categories and the right pane can
   never show category A's child with category B's content.

   Content status (MTG04 CORR01): the 15 service titles and Focus pairs are the
   OPERATOR-supplied 2026-11-03 copy; the descriptions are the OPERATOR-approved
   EXPANDED paragraphs, transcribed verbatim from
   `CCDV_MTG04_CORR01_SERVICES_EXPANDED_COPY_20261103_v0.1.md`, which supersede
   the shorter MTG04 sentences. Each blank-line paragraph boundary of the source
   is one entry of `paragraphs`. The Services intro line is NOT covered by this
   approval and stays provisional in `routes/services.tsx`.

   Category ids are the stable MTG03 ids and are deliberately NOT renamed with
   their labels (`ai-rnd`, `automatization`), so selection memory, ordering and
   `data-category-id` are unchanged. Only displayed labels follow the latest
   OPERATOR spelling (`AI / R&D`, `Automation`).

   Counts are data, not a rule: a category's `services` array may hold any
   length. */

export interface ServiceItem {
  id: string;
  label: string;
  /* approved description, one entry per paragraph, rendered as separate <p> */
  paragraphs: readonly string[];
  /* two focus phrases, rendered `[ Focus ] · first / second` */
  focus: readonly [first: string, second: string];
  /* true only while a description is NOT operator-approved copy */
  pending: boolean;
}

export interface ServiceCategory {
  id: string;
  label: string;
  services: ServiceItem[];
}

type ServiceCopy = readonly [label: string, paragraphs: readonly string[], focus: ServiceItem["focus"]];

function approvedServices(categoryId: string, copy: readonly ServiceCopy[]): ServiceItem[] {
  return copy.map(([label, paragraphs, focus], index) => ({
    id: `${categoryId}-${index + 1}`,
    label,
    paragraphs,
    focus,
    pending: false,
  }));
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: "strategy",
    label: "Strategy",
    services: approvedServices("strategy", [
      [
        "Operational Diagnosis",
        [
          "We examine how an organisation works, looking at the tools, processes and information involved in its daily operations. Through workflow analysis and direct observation, we identify recurring problems, duplicated tasks, disconnected systems and areas where responsibilities or information become unclear.",
          "This assessment helps establish what needs attention, which processes can be improved and where a technical solution could make a practical difference.",
        ],
        ["Process mapping", "Operational analysis"],
      ],
      [
        "System Architecture",
        [
          "We design the technical structure behind digital products and operational systems. This includes defining how applications, data, interfaces and processes connect, as well as the responsibilities of individual components.",
          "We consider existing infrastructure, technical constraints and future development needs to establish an architecture that supports the intended functionality, allows for maintenance and provides a consistent foundation for further development.",
        ],
        ["System structure", "Technical planning"],
      ],
      [
        "Product Scoping",
        [
          "We turn project requirements into a defined development scope. Working from the intended users, operational context and available resources, we identify essential functionality, technical dependencies and implementation priorities.",
          "The process establishes what the product needs to accomplish, which decisions require further research and how development can be organised into manageable stages. This provides a practical reference for planning, design and implementation.",
        ],
        ["Requirements", "Product definition"],
      ],
    ]),
  },
  {
    id: "product",
    label: "Product",
    services: approvedServices("product", [
      [
        "Web Applications",
        [
          "We design and develop custom web applications for projects that require specific functionality, interaction and content management.",
          "Our work connects interface design with application logic, data structures and the technical components that support the product. Depending on the project, this may involve interactive platforms, specialised web environments or applications that connect different sources of information.",
          "We develop around the intended use, technical requirements and long-term needs of each application.",
        ],
        ["Web apps", "Digital platforms"],
      ],
      [
        "Internal Tools",
        [
          "We design and develop internal software around the daily operations of a team or organisation.",
          "From project dashboards to custom management interfaces, these tools bring information, tasks and processes into a working environment shaped around specific needs.",
          "We pay attention to how information is organised, how people interact with the system and how the software can adapt as the organisation evolves.",
        ],
        ["Dashboards", "Management tools"],
      ],
      [
        "Functional Prototypes",
        [
          "We develop working prototypes to explore product ideas, test technical assumptions and understand how a proposed system behaves in practice.",
          "Prototypes can reproduce key interactions, connect selected components or demonstrate a specific technical approach before committing to broader development.",
          "This allows us to evaluate functionality with real inputs, identify limitations and gather feedback that informs the architecture and direction of the final product.",
        ],
        ["Prototyping", "Proof of concept"],
      ],
    ]),
  },
  {
    id: "experience",
    label: "Experience",
    services: approvedServices("experience", [
      [
        "UX & Information Architecture",
        [
          "We study how people navigate digital products, access information and complete tasks within an interface.",
          "Our work involves understanding user needs, organising content and defining navigation structures that reflect the logic of the system.",
          "Through user flows, information mapping and interface analysis, we establish how different elements relate to each other and how users can move through complex functionality with greater clarity.",
        ],
        ["UX research", "Information structure"],
      ],
      [
        "UI & Interaction Design",
        [
          "We design the visual and interactive layers of digital products, defining how information appears and how the interface responds to user actions.",
          "Our work covers layouts, controls, navigation, feedback states and the behaviour of interactive components across different devices.",
          "We develop interfaces in relation to their underlying functionality, ensuring that visual decisions support the tasks, information and technical requirements of the application.",
        ],
        ["Interface design", "Interaction"],
      ],
      [
        "Interface Systems",
        [
          "We create structured interface systems that establish consistent rules for digital products.",
          "These systems define reusable components, typography, spacing, interaction states and visual behaviours across an application. They provide a shared foundation for design and development, making it easier to maintain consistency as functionality grows.",
          "We consider how components are implemented, documented and adapted to new contexts throughout the product's development.",
        ],
        ["Design systems", "UI components"],
      ],
    ]),
  },
  {
    id: "ai-rnd",
    label: "AI / R&D",
    services: approvedServices("ai-rnd", [
      [
        "Applied AI",
        [
          "We investigate how artificial intelligence can support specific tasks within existing workflows and digital products.",
          "Our work includes exploring language models, defining integration requirements and evaluating how AI-generated outputs interact with application logic and user decisions.",
          "We consider data handling, reliability, operating costs and human supervision when designing these integrations, with particular attention to where AI contributes practical value.",
        ],
        ["LLM integration", "AI workflows"],
      ],
      [
        "Technical Research",
        [
          "We research emerging technologies, development methods and software architectures to understand their capabilities and practical limitations.",
          "This work may involve testing libraries, comparing technical approaches, examining local AI models or exploring new ways to structure digital systems.",
          "Research findings are documented and evaluated against specific project requirements, helping determine which technologies deserve further development and which introduce unnecessary complexity or dependencies.",
        ],
        ["Technology assessment", "R&D"],
      ],
      [
        "AI Prototyping",
        [
          "We build experimental applications and controlled prototypes to test how AI models perform within defined technical environments.",
          "These experiments examine model behaviour, input and output handling, system integrations and the reliability of specific tasks.",
          "By working with functional prototypes, we can identify limitations, evaluate possible uses and establish the technical conditions required before considering a broader implementation within a product or workflow.",
        ],
        ["Model evaluation", "Prototyping"],
      ],
    ]),
  },
  {
    id: "automatization",
    label: "Automation",
    services: approvedServices("automatization", [
      [
        "Workflow Automation",
        [
          "We analyse recurring operational tasks and develop automated workflows that reduce unnecessary manual work.",
          "This involves identifying repeatable actions, defining the information required at each stage and establishing how tasks should move between people and systems.",
          "We design automation around the existing operation, including validation steps, exception handling and human review where necessary, so that automated processes remain understandable and manageable.",
        ],
        ["Process automation", "Task flows"],
      ],
      [
        "Tool Integrations",
        [
          "We connect digital tools and applications to improve how information moves between different parts of an operation.",
          "Depending on the technical environment, this may involve APIs, external services, databases or custom software components.",
          "We define how information is exchanged, which system is responsible for each operation and how errors or inconsistencies should be handled, reducing the need to maintain the same information across disconnected tools.",
        ],
        ["APIs", "System connections"],
      ],
      [
        "Data Workflows",
        [
          "We develop processes for collecting, organising, transforming and transferring information between digital systems.",
          "Our work considers how data enters a workflow, which transformations are required and how the resulting information is stored or made available to other tools.",
          "This can involve importing structured files, processing recurring inputs or preparing datasets for internal applications, with attention to validation, consistency and traceability.",
        ],
        ["Data processing", "Information flows"],
      ],
    ]),
  },
];

/* "Experience" is the one category R1.1 draws filled red, the only sourced
   initial-state evidence for this control. */
export const DEFAULT_SERVICE_CATEGORY_ID = "experience";
