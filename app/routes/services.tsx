import { useId, useState } from "react";
import { SiteMasthead } from "../components/SiteMasthead";
import { SiteFooter } from "../components/SiteFooter";
import { CategorySelector } from "../components/CategorySelector";
import { ServiceDetailPanel, type ServiceBlockContent } from "../components/ServiceDetailPanel";

export function meta() {
  return [{ title: "CCDV — Services" }];
}

/* Services is a 1539-tall artboard: 268.12 masthead, 31 stripe, 177 hero,
   31 stripe, 165 intro, 707 category+detail, 160 footer — the literal rect
   heights from pages_services.svg, summing unchanged.

   Category names are read verbatim from pages_services.png and are
   provisional per `SVC-DEC-001` ("category names provisional"); "Experience"
   is reproduced as the default-selected category because the reference's
   own export already draws it filled red, the one piece of sourced initial-
   state evidence for this control. All copy here is editorially provisional,
   quadruple-dot ellipsis included. */
const CATEGORIES = ["Strategy", "Product", "Experience", "AI / RND", "Automatization"];
const DEFAULT_CATEGORY = "Experience";

/* Only "Experience" has a visible content state in R1.1: three identically
   worded ServiceBlock placeholders and one placeholder description
   (`SVC-DEC-005`). The other four categories have no sourced content, so
   this reuses the one approved placeholder triad for every category rather
   than inventing four distinct sets of names.

   GF08-A4R1 content model (`SVC-DEC-004`: right-pane text "keyed to BOTH the
   selected top category and selected nested block"). Every category gets
   its own three `ServiceBlockContent` records, each with a stable id
   (`${categorySlug}-${index}`) — so Strategy's block 1 and Experience's
   block 1 are distinct content-model entries that happen to render the same
   sourced placeholder text, not the same entry reused twice. This is a
   binding-mechanism fix only: no new wording was written, and no category-
   specific or block-specific editorial content has been approved or
   delivered — every entry below is the one sourced placeholder, verbatim,
   repeated per slot it now genuinely occupies. */
const PLACEHOLDER_BLOCK_LABEL = "Service block 1";
const PLACEHOLDER_BLOCK_DESCRIPTION = "Description of services mentioned in service block 1";

function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const SERVICES_CONTENT: Record<string, ServiceBlockContent[]> = Object.fromEntries(
  CATEGORIES.map((label) => {
    const categoryId = slugify(label);
    return [
      label,
      [0, 1, 2].map((index) => ({
        id: `${categoryId}-${index}`,
        label: PLACEHOLDER_BLOCK_LABEL,
        description: PLACEHOLDER_BLOCK_DESCRIPTION,
      })),
    ];
  }),
);

export default function Services() {
  const [category, setCategory] = useState(DEFAULT_CATEGORY);
  const panelId = useId();
  const categoryId = slugify(category);
  const blocks = SERVICES_CONTENT[category] ?? [];

  return (
    <div className="r11 r11--services">
      <SiteMasthead variant="services" />

      <div className="section section--stripe" />

      <section className="section section--hero" aria-labelledby="services-hero">
        <h1 className="band__label" id="services-hero">
          [Services]
        </h1>
        <span className="band__suffix" style={{ left: "calc(1180 * var(--u))" }}>
          \
        </span>
        <span className="hero__watermark" aria-hidden="true">
          collapse
        </span>
      </section>

      <div className="section section--stripe" />

      <section className="section section--intro">
        <div className="intro__copy">
          <p>We create and experiences and products that ....</p>
        </div>
      </section>

      <section className="section section--services-panel" aria-label="Services">
        <CategorySelector categories={CATEGORIES} value={category} onChange={setCategory} panelId={panelId} />
        <ServiceDetailPanel categoryId={categoryId} categoryLabel={category} blocks={blocks} panelId={panelId} />
      </section>

      <SiteFooter />
    </div>
  );
}
