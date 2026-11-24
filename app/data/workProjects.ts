import adgArcHero from "../assets/workcase/workcase_r11_source_image_0.webp";
import adgArcShowcase1 from "../assets/workcase/workcase_r11_source_image_1.webp";
import adgArcShowcase2 from "../assets/workcase/workcase_r11_source_image_2.webp";
import adgArcShowcase3 from "../assets/workcase/workcase_r11_source_image_3.webp";
import adgArcDetailMobile from "../assets/work/work_v2_adg_arc_detail_mobile.webp";
/* N3 Work V3 imagery (see the WORK V3 block at the end) */
import adgLandingDesktop from "../assets/work/v3/adg-landing-desktop.webp";
import adgMapCity from "../assets/work/v3/adg-map-city.webp";
import adgMapDhub from "../assets/work/v3/adg-map-dhub.webp";
import adgPassportDesktop from "../assets/work/v3/adg-passport-desktop.webp";
import adgSheetDhub from "../assets/work/v3/adg-sheet-dhub.webp";
import adgSpecimenLores from "../assets/work/v3/adg-specimen-lores.webp";
import adgPhoneLanding from "../assets/work/v3/adg-phone-landing.webp";
import adgPhoneMapHint from "../assets/work/v3/adg-phone-map-hint.webp";
import adgPhonePassport from "../assets/work/v3/adg-phone-passport.webp";
import adgPhoneMediapro from "../assets/work/v3/adg-phone-mediapro.webp";
import adgPhoneStamp from "../assets/work/v3/adg-phone-stamp.webp";
import adgPhoneRoute from "../assets/work/v3/adg-phone-route.webp";
import adgSpecimenTt from "../assets/work/v3/adg-specimen-tt.svg";
import adgSpecimenGg from "../assets/work/v3/adg-specimen-gg.svg";

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
  /** Work V2 D1: design-facing title; `name` stays the canonical record */
  displayName?: string;
  /** OPERATOR-approved release year (null = none sourced) */
  year: string | null;
  wip: boolean;
  leading?: boolean;
  /** set only when authentic Workcase data exists for this project */
  href?: string;
}

export const YEARS = ["2026", "2025", "2024", "2023"];
export const TYPES = ["WEBSITE", "TOOL", "CC:OS", "DIGITAL PRODUCT"];

/* Work V2 D2: the artboard's Type labels. Presentation only — TYPES above stay
   the canonical filter keys (stored state, Workcase links). */
export const TYPE_LABELS: Record<string, string> = {
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

const BASE_PROJECTS: Omit<WorkProject, "href">[] = [
  { id: "adg-arc", name: "ADG-ARC", tag: "INTERACTIVE WEBSITE", typeFilter: "WEBSITE", year: "2026", wip: false, leading: true },
  { id: "adg-ops", name: "ADG-OPS", tag: "DIGITAL PRODUCT", typeFilter: "DIGITAL PRODUCT", year: "2026", wip: true },
  { id: "ccdv-website", name: "CC.DV Website", tag: "WEBSITE", typeFilter: "WEBSITE", year: "2026", wip: false },
  { id: "htw-website", name: "HTW Website", tag: "WEBSITE", typeFilter: "WEBSITE", year: "2025", wip: true },
  { id: "htw-tool", name: "HTW Tool", tag: "TOOL", typeFilter: "TOOL", year: "2025", wip: true },
  /* D1: CC.OS 0.3 is a prospective WIP title, not the shipped version */
  { id: "ccos-01", name: "CC.OS 0.1", displayName: "CC.OS 0.3", tag: "WEBSITE", typeFilter: "WEBSITE", year: "2026", wip: true },
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

/* Work imagery (D5/D6). Every src is a real ADG-ARC capture already in the
   repo (WebP since WORK-T2). OPERATOR (WORK-T2): the hub and archive images
   are PLACEHOLDERS until final project imagery is supplied — tiles repeat
   those captures; nothing is synthesised. `alt` is empty on a repeat, so each
   image is announced once. */
const ADG_PASSPORT = WORKCASES["adg-arc"].showcase[0];
const ADG_MAP_DETAIL = WORKCASES["adg-arc"].showcase[1];
const ADG_MAP_CITY = WORKCASES["adg-arc"].showcase[2];

export interface WorkImage {
  src: string;
  alt: string;
}

/** a placed image whose intrinsic size reserves its box before it loads */
export interface WorkTile extends WorkImage {
  width: number;
  height: number;
}

const DETAIL_MOBILE: WorkTile = {
  src: adgArcDetailMobile,
  alt: "Phone screenshot of a yellow detail panel for the building “Illa Glòries, Bloc A”, listing its author, movement, year and address",
  width: 946,
  height: 2048,
};
const repeat = (tile: WorkTile): WorkTile => ({ ...tile, alt: "" });

/* WORK-T4 (OPERATOR to-be): the hub collage is a fixed five-slot mosaic that
   fits one screen: a wide image and a tall card on top, three tall images
   below, in reading order. Each image is cropped to its slot (cover);
   `focus` is the crop's object-position where the centre is not the subject. */
export interface MosaicTile extends WorkTile {
  focus?: string;
}

const ADG_MOSAIC: MosaicTile[] = [
  ADG_PASSPORT,
  { ...DETAIL_MOBILE, focus: "50% 45%" },
  ADG_MAP_DETAIL,
  ADG_MAP_CITY,
  repeat(ADG_PASSPORT),
];

/* WORK-T3 (OPERATOR): the hub's five squares switch the viewer between five
   projects. Only ADG-ARC has sourced imagery; the other four show its
   captures as PLACEHOLDERS (`placeholder: true`, every alt empty, so no
   ADG-ARC description is announced under another project's name) until the
   OPERATOR supplies their own. CC.OS 0.3 is not featured. */
export interface FeaturedProject {
  projectId: string;
  placeholder: boolean;
  tiles: MosaicTile[];
}

const placeholderTiles = ADG_MOSAIC.map((tile) => ({ ...tile, alt: "" }));

export const FEATURED: FeaturedProject[] = [
  { projectId: "adg-arc", placeholder: false, tiles: ADG_MOSAIC },
  { projectId: "adg-ops", placeholder: true, tiles: placeholderTiles },
  { projectId: "ccdv-website", placeholder: true, tiles: placeholderTiles },
  { projectId: "htw-website", placeholder: true, tiles: placeholderTiles },
  { projectId: "htw-tool", placeholder: true, tiles: placeholderTiles },
];

/* WORK-T4: the hub's archive links. A Year or Type without a project is drawn
   but inert, as in the archive (D3). */
export const AVAILABLE_TYPES = TYPES.filter((type) => PROJECTS.some((project) => project.typeFilter === type));

/* Archive preview for a project that has imagery (WORK-T3, OPERATOR retouch):
   one wide lead image over three cards. `caption` is the artboard's own
   label; projects without an entry show the honest no-preview state. */
export interface WorkPreview {
  lead: WorkImage;
  cards: [WorkImage, WorkImage, WorkImage];
  caption: string;
}

export const WORK_PREVIEWS: Record<string, WorkPreview> = {
  "adg-arc": {
    lead: { src: ADG_PASSPORT.src, alt: ADG_PASSPORT.alt },
    cards: [
      { src: ADG_PASSPORT.src, alt: "" },
      { src: ADG_PASSPORT.src, alt: "" },
      { src: ADG_PASSPORT.src, alt: "" },
    ],
    caption: "passport_menu.png",
  },
};

/* === N3 WORK V3 (t_20261124_ccdvn3work, OPERATOR) =============================
   Work V3 data. Kept apart from the registry above, which Workcase, the
   unused V2 hub and the old archive components still read.

   Archive rows: OPERATOR decision (N3 DECISION, "Artboard rows are the data")
   — every row is transcribed verbatim from work_assets/webdesign_work_v3/
   WORK V3 _ archive.svg, in its order, spelling and trailing glyph.
   `projectId` links a row to the registry where a project record exists. No
   URL is derived: a case study opens only where WORKCASES has one (ADG-ARC),
   and no live-site URL is known, so none is listed. */

/** sidebar lists, as each artboard draws them */
export const V3_YEARS = ["2026", "2025", "2024", "2023"];
export const V3_FEATURED_CATEGORIES = ["WEBSITE", "TOOL", "CC.OS", "PRODUCT"];
export const V3_ARCHIVE_CATEGORIES = ["WEBSITE", "TOOL", "CC.OS", "PLATFORM", "PRODUCT"];

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
): ArchiveRow => ({ id, year, category, responsibility, name, client, glyph, projectId });

export const ARCHIVE_ROWS: ArchiveRow[] = [
  archiveRow("project-ls", "2027", "PLATFORM", "UX/UI & Development", "Project LS", "CCDV Product", "[x]"),
  archiveRow("project-l", "2027", "PLATFORM", "UX/UI & Development", "Project L", "# # # # #", "[x]"),
  archiveRow("panoptes", "2027", "CC.OS", "Development", "PANOPTES", "CCDV Product", "[+]"),
  archiveRow("kairon", "2027", "CC.OS", "Development", "KAIRON", "CCDV Product", "[+]"),
  archiveRow("kron", "2027", "CC.OS", "Development", "KRON", "CCDV Product", "[+]"),
  archiveRow("aethernos", "2026", "CC.OS", "Development", "AETHERNOS", "CCDV Product", "[↗]"),
  archiveRow("kaia", "2026", "CC.OS", "Development", "KAIA", "CCDV Product", "[↗]"),
  archiveRow("wrkops", "2026", "CC.OS", "Development", "WRKOPS", "CCDV Product", "[↗]"),
  archiveRow("adg-arc", "2026", "WEBSITE", "UX/UI, Code & Motion", "Arquitectura y Tipografía", "ADG-FAD", "[+]", "adg-arc"),
  archiveRow("adg-laus-2026", "2026", "SERVICE", "Code", "ADG Laus Scripts", "ADG-FAD ET", "[x]"),
  archiveRow("htw-website", "2025", "WEBSITE", "UX/UI & Code", "Hacking The World", "Fran & Berta", "[+]", "htw-website"),
  archiveRow("htw-tool", "2025", "TOOL", "UX/UI & Code", "Hacking The World", "Fran & Berta", "[+]", "htw-tool"),
  archiveRow("par-banya", "2025", "WEBSITE", "UX/UI + Implement", "Par Banya Web", "Par Banya Barcelona", "[+]"),
  archiveRow("adg-laus-2025", "2025", "SERVICE", "Code", "ADG Laus Scripts", "ADG-FAD ET", "[x]"),
  archiveRow("binomial", "2024", "WEBSITE", "UX/UI Responsive Only", "Binomial", "Binomial (Morillas)", "[+]"),
  archiveRow("equivalenza", "2024", "WEBSITE", "UX/UI", "Equivalenza", "Equivalenza (Morillas)", "[+]"),
  archiveRow("adg-laus-2024", "2024", "SERVICE", "Code", "ADG Laus Scripts", "ADG-FAD ET", "[x]"),
  archiveRow("adg-laus-2023", "2023", "SERVICE", "Code", "ADG Laus Scripts", "ADG-FAD ET", "[x]"),
];

/** the artboard's selected row */
export const DEFAULT_ARCHIVE_ROW = "adg-arc";

/** years in the order the archive groups them; the 2027 rows lead, subdued */
export const ARCHIVE_GROUP_YEARS = ["2027", "2026", "2025", "2024", "2023"];
export const FUTURE_YEARS = ["2027"];

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
  /** a type specimen: drawn whole on the light ground, never cropped */
  specimen?: boolean;
}

const LANDING_DESKTOP: V3Image = {
  src: adgLandingDesktop,
  alt: "ADG-ARC desktop landing: “Arquitectura y tipografía en diálogo”, Barcelona 2026 Capital Mundial de l’Arquitectura, on yellow and white stripes",
  width: 1919,
  height: 870,
};
const MAP_CITY: V3Image = {
  src: adgMapCity,
  alt: "ADG-ARC city map of Barcelona with twenty numbered stops and the sea in yellow",
  width: 1919,
  height: 871,
};
const MAP_DHUB: V3Image = {
  src: adgMapDhub,
  alt: "ADG-ARC 3D map around Plaça de les Glòries with the yellow detail panel for stop 7, DHub Barcelona",
  width: 1919,
  height: 870,
};
const PASSPORT_DESKTOP: V3Image = {
  src: adgPassportDesktop,
  alt: "ADG-ARC desktop passport: numbered buildings in black and white, the first five named",
  width: 1176,
  height: 767,
};
const SHEET_DHUB: V3Image = {
  src: adgSheetDhub,
  alt: "ADG-ARC phone data sheet for DHub Barcelona: author, movement, year and address",
  width: 539,
  height: 869,
};
const SPECIMEN_LORES: V3Image = {
  src: adgSpecimenLores,
  alt: "ADG-ARC phone specimen panel for the Lo-Res typeface at Edifici Mediapro",
  width: 539,
  height: 869,
};
const PHONE_LANDING: V3Image = {
  src: adgPhoneLanding,
  alt: "ADG-ARC phone landing: “Arquitectura y tipografía en diálogo” with the Explorar Barcelona button",
  width: 946,
  height: 1615,
};
const PHONE_MAP_HINT: V3Image = {
  src: adgPhoneMapHint,
  alt: "ADG-ARC phone map with the hint “Arrastra para explorar · Pellizca para acercar”",
  width: 946,
  height: 1615,
};
const PHONE_PASSPORT: V3Image = {
  src: adgPhonePassport,
  alt: "ADG-ARC phone passport carousel at stop 14, Edifici Mediapro",
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
const SPECIMEN_GG: V3Image = {
  src: adgSpecimenGg,
  alt: "ADG-ARC type specimen: Gg",
  width: 327,
  height: 283,
  specimen: true,
};

/* The Featured mosaic (N3 DECISION, "Pages of ADG-ARC"): three pages, one
   per indicator square, each a wide capture over a bottom row, sized from the
   images' own ratios — the 2.2 : 1 captures span the canvas; four 0.586 phone
   captures share the row below (page 3: the 1.53 : 1 passport and the two
   specimens). */
export type MosaicLayout = "wide-four" | "wide-passport";

export interface FeaturedPage {
  id: string;
  layout: MosaicLayout;
  top: V3Image;
  bottom: V3Image[];
}

export const FEATURED_PAGES: FeaturedPage[] = [
  { id: "adg-1", layout: "wide-four", top: LANDING_DESKTOP, bottom: [PHONE_MEDIAPRO, SHEET_DHUB, PHONE_STAMP, PHONE_ROUTE] },
  { id: "adg-2", layout: "wide-four", top: MAP_CITY, bottom: [PHONE_MAP_HINT, PHONE_PASSPORT, SPECIMEN_LORES, PHONE_LANDING] },
  { id: "adg-3", layout: "wide-passport", top: MAP_DHUB, bottom: [PASSPORT_DESKTOP, SPECIMEN_TT, SPECIMEN_GG] },
];

/** the Featured caption and the project's year / category, as WORK V3.svg draws them */
export const FEATURED_CAPTION = "ADG ARC - INTERACTIVE WEBSITE - ADG-FAD";
export const FEATURED_YEAR = "2026";
export const FEATURED_CATEGORY = "WEBSITE";

/** the archive's poster, by row (only ADG-ARC has one) */
export const ARCHIVE_POSTERS: Record<string, V3Image> = {
  "adg-arc": PHONE_LANDING,
};
