import { useId, useState } from "react";
import { SiteMasthead } from "../components/SiteMasthead";
import { SiteFooter } from "../components/SiteFooter";
import { CategorySelector } from "../components/CategorySelector";
import { ServiceDetailPanel } from "../components/ServiceDetailPanel";
import { DEFAULT_SERVICE_CATEGORY_ID, SERVICE_CATEGORIES } from "../data/servicesContent";

export function meta() {
  return [{ title: "CCDV — Services" }];
}

/* Services is a 1539-tall artboard: 268.12 masthead, 31 stripe, 177 hero,
   31 stripe, 165 intro, 707 category+detail, 160 footer — the literal rect
   heights from pages_services.svg, summing unchanged.

   Category/service content lives in `data/servicesContent.ts` (one canonical
   source; ids scoped per category, counts data-driven). The intro line is
   editorially provisional, quadruple-dot ellipsis included. */
const CATEGORY_LABELS = SERVICE_CATEGORIES.map((category) => category.label);

export default function Services() {
  const [categoryId, setCategoryId] = useState(DEFAULT_SERVICE_CATEGORY_ID);
  const panelId = useId();
  const category = SERVICE_CATEGORIES.find((candidate) => candidate.id === categoryId) ?? SERVICE_CATEGORIES[0];

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
        <CategorySelector
          categories={CATEGORY_LABELS}
          value={category.label}
          onChange={(label) => {
            const next = SERVICE_CATEGORIES.find((candidate) => candidate.label === label);
            if (next) setCategoryId(next.id);
          }}
          panelId={panelId}
        />
        <ServiceDetailPanel category={category} panelId={panelId} />
      </section>

      <SiteFooter />
    </div>
  );
}
