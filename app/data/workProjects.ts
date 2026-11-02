import adgArcHero from "../assets/workcase/workcase_r11_source_image_0.png";
import adgArcShowcase1 from "../assets/workcase/workcase_r11_source_image_1.png";
import adgArcShowcase2 from "../assets/workcase/workcase_r11_source_image_2.png";
import adgArcShowcase3 from "../assets/workcase/workcase_r11_source_image_3.png";

/* Shared Work / Workcase project registry (MTG02). Moved verbatim out of
   work.tsx so Work and Workcase read ONE collection: same six projects, same
   order, same `typeFilter` (the canonical Type filter key). Names/tags/WIP
   status are verbatim from pages_work.png (`WPG-016`–`WPG-021`).

   MTG02 CORR01 (FB002): `year` now holds the OPERATOR-approved factual years
   (2026: ADG-ARC, ADG-OPS, CC.DV Website, CC.OS 0.1; 2025: HTW Website, HTW
   Tool). 2024/2023 have no records, so they stay inert in Work's Year filter. */

export interface WorkProject {
  id: string;
  name: string;
  tag: string;
  typeFilter: string;
  /** OPERATOR-approved release year (null = none sourced) */
  year: string | null;
  wip: boolean;
  leading?: boolean;
  /** set only when authentic Workcase data exists for this project */
  href?: string;
}

export const YEARS = ["2026", "2025", "2024", "2023"];
export const TYPES = ["WEBSITE", "TOOL", "CC:OS", "DIGITAL PRODUCT"];

/* A Workcase exists ONLY for a project listed here. Every field except `slug`
   and `hero`/`showcase` is optional: absent client / year / description /
   details are simply not rendered. Nothing here is invented — the R1.1 sample
   values (`ADG-FAD.ORG`, `2026`, the lorem-like copy, `(live site)`) are
   design reference, not verified editorial, and are deliberately NOT carried. */
export interface WorkcaseMedia {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface WorkcaseData {
  slug: string;
  client?: string;
  description?: string;
  /** approved copy for the `Indetail 0N:` slots, by index; the two slots always
      render, with a neutral pending state when a body is absent */
  details?: string[];
  hero?: WorkcaseMedia;
  showcase: WorkcaseMedia[];
}

export const WORKCASES: Record<string, WorkcaseData> = {
  "adg-arc": {
    slug: "adg-arc",
    hero: {
      src: adgArcHero,
      alt: "Architectural photograph of a modern building with striped facades, in black and white against a yellow sky",
      width: 1080,
      height: 1350,
    },
    showcase: [
      {
        src: adgArcShowcase1,
        alt: "Screenshot of a dialog titled “Arquitectura i tipografia en diàleg”, showing the “Passaport” list of numbered buildings over a blurred map",
        width: 1919,
        height: 868,
      },
      {
        src: adgArcShowcase2,
        alt: "Screenshot of a map with a yellow detail panel for the building “Cotxeres de Sarrià”",
        width: 1919,
        height: 868,
      },
      {
        src: adgArcShowcase3,
        alt: "Screenshot of a city-wide map with a yellow panel for “La Pedrera / Casa Milà”",
        width: 1919,
        height: 869,
      },
    ],
  },
};

export function workcaseHref(id: string): string | undefined {
  return Object.prototype.hasOwnProperty.call(WORKCASES, id) ? `/work/${id}` : undefined;
}

const BASE_PROJECTS: Omit<WorkProject, "href">[] = [
  { id: "adg-arc", name: "ADG-ARC", tag: "INTERACTIVE WEBSITE", typeFilter: "WEBSITE", year: "2026", wip: false, leading: true },
  { id: "adg-ops", name: "ADG-OPS", tag: "DIGITAL PRODUCT", typeFilter: "DIGITAL PRODUCT", year: "2026", wip: true },
  { id: "ccdv-website", name: "CC.DV Website", tag: "WEBSITE", typeFilter: "WEBSITE", year: "2026", wip: false },
  { id: "htw-website", name: "HTW Website", tag: "WEBSITE", typeFilter: "WEBSITE", year: "2025", wip: true },
  { id: "htw-tool", name: "HTW Tool", tag: "TOOL", typeFilter: "TOOL", year: "2025", wip: true },
  { id: "ccos-01", name: "CC.OS 0.1", tag: "WEBSITE", typeFilter: "WEBSITE", year: "2026", wip: true },
];

export const PROJECTS: WorkProject[] = BASE_PROJECTS.map((project) => ({
  ...project,
  href: workcaseHref(project.id),
}));

/* Years that actually have records — derived, never listed by hand. */
export const AVAILABLE_YEARS = YEARS.filter((year) => PROJECTS.some((project) => project.year === year));

export const DEFAULT_PREVIEW_ID = PROJECTS[0].id;

export function findProject(id: string): WorkProject | undefined {
  return PROJECTS.find((project) => project.id === id);
}
