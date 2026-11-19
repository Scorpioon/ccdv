import { Link } from "react-router";
import { ProductsPanelArt } from "./ProductsPanelArt";
import type { ProductsEntry } from "../../data/productsContent";

/* A product panel (P1b CORR03; it replaces the P1 CC.OS-only panel). The
   CC.OS panel follows PRODUCTS_v2.svg (51.2..1484.8 x 2534.93..3134.39; phone
   28..362 x 2225.65..3401.1), LS / iDS `Project LS.svg` / `Project iDS.svg`
   (1434 x 598 / 558). Desktop: copy on the left, art on the right; phones: art
   above the copy. CC.OS draws Studio's graph (decorative, OPERATOR D3); LS and
   iDS sit in the sources' dark art box. Only CC.OS has a CTA (its hub); LS and
   iDS have no product page yet (OPERATOR). */
export function ProductsPanel({ index, panel }: Pick<ProductsEntry, "index" | "panel">) {
  return (
    <article className={`pv-panel pv-panel--${panel.art}`} aria-labelledby={`pv-panel-title-${index}`}>
      <span className="pv-panel__index" aria-hidden="true">
        [ {index} ]
      </span>
      <div className="pv-panel__art">
        <ProductsPanelArt art={panel.art} />
      </div>
      <div className="pv-panel__copy">
        <h3 className="pv-panel__title" id={`pv-panel-title-${index}`}>
          {panel.title}
        </h3>
        {panel.body.map((line) => (
          <p key={line} className="pv-panel__body">
            {line}
          </p>
        ))}
        {panel.cta && (
          <Link className="pv-panel__cta" to={panel.cta.href}>
            {panel.cta.label}
          </Link>
        )}
      </div>
    </article>
  );
}
