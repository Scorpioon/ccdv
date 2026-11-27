import adgArcHero from "../assets/workcase/workcase_r11_source_image_0.webp";
import adgArcShowcase1 from "../assets/workcase/workcase_r11_source_image_1.webp";
import adgArcShowcase2 from "../assets/workcase/workcase_r11_source_image_2.webp";
import adgArcShowcase3 from "../assets/workcase/workcase_r11_source_image_3.webp";
/* N3 Work V3 imagery (see the WORK V3 block at the end) */
import adgLandingDesktop from "../assets/work/v3/adg-landing-desktop.webp";
import adgSheetDhub from "../assets/work/v3/adg-sheet-dhub.webp";
import adgPhoneLanding from "../assets/work/v3/adg-phone-landing.webp";
import adgPhoneMediapro from "../assets/work/v3/adg-phone-mediapro.webp";
import adgPhoneStamp from "../assets/work/v3/adg-phone-stamp.webp";
import adgPhoneRoute from "../assets/work/v3/adg-phone-route.webp";
import adgSpecimenTt from "../assets/work/v3/adg-specimen-tt.svg";

/* Shared Work / Workcase project registry (MTG02): the six registry projects
   Workcase reads (id, name, tag, canonical typeFilter, year). MTG02 CORR01:
   `year` holds the OPERATOR-approved years; AVAILABLE_YEARS (the years with a
   registry project) decides whether a case's Year is a link. The archive's
   rows, years and categories are the V3 data below. */

export interface WorkProject {
  id: string;
  name: string;
  tag: string;
  typeFilter: string;
  /** Work V2 D1: design-facing title; `name` stays the canonical record */
  displayName?: string;
  /** OPERATOR-approved release year (null = none sourced) */
  year: string | null;
}

/** the archive's years, newest first (the rail's Year list; Workcase links only those with a registry project) */
export const V3_YEARS = ["2026", "2025", "2024", "2023"];

/* Work V2 D2: the Type keys' display labels. The keys (`typeFilter`) stay
   canonical in Workcase links; the archive maps them to its categories. */
const TYPE_LABELS: Record<string, string> = {
  "CC:OS": "CC.OS",
  "DIGITAL PRODUCT": "DIGITAL.PRODUCT",
};

export function typeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type;
}

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

const PROJECTS: WorkProject[] = [
  { id: "adg-arc", name: "ADG-ARC", tag: "INTERACTIVE WEBSITE", typeFilter: "WEBSITE", year: "2026" },
  { id: "adg-ops", name: "ADG-OPS", tag: "DIGITAL PRODUCT", typeFilter: "DIGITAL PRODUCT", year: "2026" },
  { id: "ccdv-website", name: "CC.DV Website", tag: "WEBSITE", typeFilter: "WEBSITE", year: "2026" },
  { id: "htw-website", name: "HTW Website", tag: "WEBSITE", typeFilter: "WEBSITE", year: "2025" },
  { id: "htw-tool", name: "HTW Tool", tag: "TOOL", typeFilter: "TOOL", year: "2025" },
  /* D1: CC.OS 0.3 is a prospective WIP title, not the shipped version */
  { id: "ccos-01", name: "CC.OS 0.1", displayName: "CC.OS 0.3", tag: "WEBSITE", typeFilter: "WEBSITE", year: "2026" },
];

/* Years that actually have records — derived, never listed by hand. */
export const AVAILABLE_YEARS = V3_YEARS.filter((year) => PROJECTS.some((project) => project.year === year));

export function findProject(id: string): WorkProject | undefined {
  return PROJECTS.find((project) => project.id === id);
}

/* === N3 WORK V3 (t_20261124_ccdvn3work, OPERATOR) =============================
   Work V3 data, beside the registry above (which Workcase reads). N3 C1
   (OPERATOR-approved cleanup): the V2 hub / archive data (FEATURED, the
   placeholder mosaic, WORK_PREVIEWS, TYPES) is gone with its components.

   Archive rows: OPERATOR decision (N3 DECISION, "Artboard rows are the data")
   — every row is transcribed verbatim from work_assets/webdesign_work_v3/
   WORK V3 _ archive.svg, in its order, spelling and trailing glyph.
   `projectId` links a row to the registry where a project record exists. No
   URL is derived: a case study opens only where WORKCASES has one (ADG-ARC);
   a live site only where the OPERATOR gave its URL (`liveUrl`, N3 C1). */

/* N4 P-H B-19 (OPERATOR): only categories that have rows; PRODUCT (none) out,
   SERVICE (ADG Laus) in. A new category is added here by hand. */
export const V3_ARCHIVE_CATEGORIES = ["WEBSITE", "TOOL", "CC.OS", "PLATFORM", "SERVICE"];

export type ArchiveGlyph = "[+]" | "[↗]" | "[x]";

export interface ArchiveRow {
  id: string;
  year: string;
  category: string;
  responsibility: string;
  name: string;
  client: string;
  /** the artboard's trailing glyph, verbatim; `[x]` is drawn subdued */
  glyph: ArchiveGlyph;
  /** a registry project behind the row, when one exists */
  projectId?: string;
  /** N3 C1: the project's live site, only where the OPERATOR gave its URL */
  liveUrl?: string;
  /** N4: an on-site page that explains the project (the `[↗]` glyph and the preview's "See in Products"); CC.OS rows -> /products/ccos */
  explainerHref?: string;
}

const archiveRow = (
  id: string,
  year: string,
  category: string,
  responsibility: string,
  name: string,
  client: string,
  glyph: ArchiveGlyph,
  projectId?: string,
  liveUrl?: string,
  explainerHref?: string,
): ArchiveRow => ({ id, year, category, responsibility, name, client, glyph, projectId, liveUrl, explainerHref });

export const ARCHIVE_ROWS: ArchiveRow[] = [
  archiveRow("project-ls", "2027", "PLATFORM", "UX/UI & Development", "Project LS", "CCDV Product", "[x]"),
  archiveRow("project-l", "2027", "PLATFORM", "UX/UI & Development", "Project L", "# # # # #", "[x]"),
  archiveRow("panoptes", "2027", "CC.OS", "Development", "PANOPTES", "CCDV Product", "[+]"),
  archiveRow("kairon", "2027", "CC.OS", "Development", "KAIRON", "CCDV Product", "[+]"),
  archiveRow("kron", "2027", "CC.OS", "Development", "KRON", "CCDV Product", "[+]"),
  archiveRow("aethernos", "2026", "CC.OS", "Development", "AETHERNOS", "CCDV Product", "[↗]", undefined, undefined, "/products/ccos"),
  archiveRow("kaia", "2026", "CC.OS", "Development", "KAIA", "CCDV Product", "[↗]", undefined, undefined, "/products/ccos"),
  archiveRow("wrkops", "2026", "CC.OS", "Development", "WRKOPS", "CCDV Product", "[↗]", undefined, undefined, "/products/ccos"),
  archiveRow("adg-arc", "2026", "WEBSITE", "UX/UI, Code & Motion", "Arquitectura y Tipografía", "ADG-FAD", "[+]", "adg-arc", "https://www.adg-fad.org/adg-arc/"),
  archiveRow("htw-website", "2025", "WEBSITE", "UX/UI & Code", "Hacking The World", "Fran & Berta", "[+]", "htw-website"),
  archiveRow("htw-tool", "2025", "TOOL", "UX/UI & Code", "Hacking The World", "Fran & Berta", "[+]", "htw-tool"),
  archiveRow("par-banya", "2025", "WEBSITE", "UX/UI + Implement", "Par Banya Web", "Par Banya Barcelona", "[+]"),
  archiveRow("binomial", "2024", "WEBSITE", "UX/UI Responsive Only", "Binomial", "Binomial (Morillas)", "[+]"),
  archiveRow("equivalenza", "2024", "WEBSITE", "UX/UI", "Equivalenza", "Equivalenza (Morillas)", "[+]"),
  archiveRow("adg-laus-2023", "2023", "SERVICE", "Code", "ADG Laus Scripts", "ADG-FAD ET", "[x]"),
];

/** whether any archive row has this year / category (a filter value without rows is inert) */
export const hasRows = (field: "year" | "category", value: string) => ARCHIVE_ROWS.some((entry) => entry[field] === value);

/** the artboard's selected row */
export const DEFAULT_ARCHIVE_ROW = "adg-arc";

/** years in the order the archive groups them; the 2027 rows lead, subdued */
export const ARCHIVE_GROUP_YEARS = ["2027", "2026", "2025", "2024", "2023"];
export const FUTURE_YEARS = ["2027"];
/** R3 S9: the one year group open when All works first shows on phones and tablets */
export const DEFAULT_OPEN_YEAR = "2026";

/* The preview column's title: the registry name where a project exists
   (ADG-ARC, as drawn), else the row's own name. */
export function archiveTitle(entry: ArchiveRow): string {
  const project = entry.projectId ? findProject(entry.projectId) : undefined;
  return project ? project.displayName ?? project.name : entry.name;
}

/* ADG-ARC imagery (N3 DECISION). All from the OPERATOR's capture set
   work_assets/images 4 we b/wrk_adg_arc: the 1x PNG exports converted to WebP
   by the OPERATOR, and two type specimens copied as is from their SVGs. */
export interface V3Image {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** a type specimen: drawn whole, never cropped */
  specimen?: boolean;
  /** W-A1: the crop's object-position where the centre is not the subject (phone views; the desktop mosaic no longer crops) */
  focus?: string;
  /** N4 P-L: a small app icon (the Tt specimen), the first tile of the desktop mosaic's top row */
  icon?: boolean;
  /** W-A1: the ground a specimen sits on (its own colour, so the tile reads as one) */
  ground?: string;
}

const LANDING_DESKTOP: V3Image = {
  src: adgLandingDesktop,
  alt: "ADG-ARC desktop landing: “Arquitectura y tipografía en diálogo”, Barcelona 2026 Capital Mundial de l’Arquitectura, on yellow and white stripes",
  width: 1919,
  height: 870,
};
const SHEET_DHUB: V3Image = {
  src: adgSheetDhub,
  alt: "ADG-ARC phone data sheet for DHub Barcelona: author, movement, year and address",
  width: 539,
  height: 869,
};
const PHONE_LANDING: V3Image = {
  src: adgPhoneLanding,
  alt: "ADG-ARC phone landing: “Arquitectura y tipografía en diálogo” with the Explorar Barcelona button",
  width: 946,
  height: 1615,
};
const PHONE_MEDIAPRO: V3Image = {
  src: adgPhoneMediapro,
  alt: "ADG-ARC phone detail for stop 14, Edifici Mediapro: a black and white photograph with yellow windows",
  width: 946,
  height: 1615,
};
const PHONE_STAMP: V3Image = {
  src: adgPhoneStamp,
  alt: "ADG-ARC phone screen “Sello conseguido 2/20” with the next three destinations",
  width: 946,
  height: 1615,
};
const PHONE_ROUTE: V3Image = {
  src: adgPhoneRoute,
  alt: "ADG-ARC phone walking route from stop 15 to stop 18, La Escocesa, 810 m",
  width: 946,
  height: 1615,
};
const SPECIMEN_TT: V3Image = {
  src: adgSpecimenTt,
  alt: "ADG-ARC type specimen: Tt on yellow",
  width: 291,
  height: 291,
  specimen: true,
};

/* The Featured mosaic. W-A1 (OPERATOR): one composition per featured
   project and one square per project — the squares switch between featured
   projects, and for now ADG-ARC is the only one. Its composition follows the
   artboard's grammar: the Tt specimen (the project's icon, `icon`) leads the
   top row, then the landing; the bottom row is four phone captures. N4 P-L
   (OPERATOR): desktop tiles keep their natural aspect ratio (no crop) and the
   two rows scroll sideways inside the frame; the specimen is drawn whole on
   its own yellow. N3 C1: the spare captures left the bundle; their sources
   stay in work_assets/images 4 we b/wrk_adg_arc for later compositions. */
export interface FeaturedProject {
  id: string;
  /** the registry project, for its case study */
  projectId: string;
  caption: string;
  year: string;
  category: string;
  top: [V3Image, V3Image];
  bottom: V3Image[];
  /** N4 P-J: the phone / tablet Featured view's short description (OPERATOR source text, condensed) */
  description: string;
  /** N4 P-J: the phone / tablet Featured view's one image */
  poster: V3Image;
}

/** N4 P-J (WORK V3_responsive): the line over every featured project on phones / tablets */
export const WORK_INTRO =
  "Our background is in visual design and digital experiences. Today, we use that knowledge to build web applications, custom tools and software around how people actually work.";

export const FEATURED_PROJECTS: FeaturedProject[] = [
  {
    id: "adg-arc",
    projectId: "adg-arc",
    caption: "ADG ARC - INTERACTIVE WEBSITE - ADG-FAD",
    year: "2026",
    category: "WEBSITE",
    /* N4 P-L: the Tt icon leads the top row; the landing no longer needs `focus` (no crop on desktop) */
    top: [{ ...SPECIMEN_TT, ground: "#FEED01", icon: true }, LANDING_DESKTOP],
    bottom: [PHONE_MEDIAPRO, SHEET_DHUB, PHONE_STAMP, PHONE_ROUTE],
    description:
      "Arquitectura y Tipografía en diálogo — a curated route by ADG-FAD for Barcelona 2026, World Capital of Architecture. Twenty Barcelona buildings are paired with contemporary typefaces to reveal what they share: geometry, rhythm, proportion, structure. We designed and built the explorable collection — map, data sheets and Passport — ten stops on the street with QR codes, ten online.",
    poster: PHONE_LANDING,
  },
];

/** the archive's poster, by row (only ADG-ARC has one) */
export const ARCHIVE_POSTERS: Record<string, V3Image> = {
  "adg-arc": PHONE_LANDING,
};
