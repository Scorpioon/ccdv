import { Link } from "react-router";
import { CcosGraph } from "../studio/CcosScene";
import { PRODUCTS_CCOS } from "../../data/productsContent";

/* CC.OS feature panel (PRODUCTS_v2.svg 51.2..1484.8 x 2534.93..3134.39; phone
   28..362 x 2225.65..3401.1, after all four product rows — OPERATOR D2).
   Desktop: copy on the left, the graph on the right; phones: graph above the
   copy. The graph is Studio's CcosGraph — the source draws the identical
   seven-node figure, only scaled — rendered decorative (OPERATOR D3: its
   INT/WRK/ARC/BIZ/SEC/TME nodes are artwork, not the six CC.OS systems, and
   link nowhere). The CTA opens the CC.OS hub, as card 01 does. */
export function ProductsCcosPanel() {
  return (
    <section className="pv-ccos" aria-labelledby="pv-ccos-title">
      <span className="pv-ccos__index" aria-hidden="true">
        [ 01 ]
      </span>
      <div className="pv-ccos__art">
        <CcosGraph decorative />
      </div>
      <div className="pv-ccos__copy">
        <h2 className="pv-ccos__title" id="pv-ccos-title">
          {PRODUCTS_CCOS.title}
        </h2>
        {PRODUCTS_CCOS.body.map((line) => (
          <p key={line} className="pv-ccos__body">
            {line}
          </p>
        ))}
        <Link className="pv-ccos__cta" to={PRODUCTS_CCOS.href}>
          {PRODUCTS_CCOS.cta}
        </Link>
      </div>
    </section>
  );
}
