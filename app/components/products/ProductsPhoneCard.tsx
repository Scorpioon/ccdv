import { Link } from "react-router";
import { useTransitionLink } from "../GlobalShell";
import { GearMark } from "../marks/GearMark";
import { ProductsPanelArt } from "./ProductsPanelArt";
import type { ProductsEntry } from "../../data/productsContent";

/* N6 R1 B6 (OPERATOR, phones and tablets): one product as a Work-archive-style
   card. The name bar carries the gear and the index and label ([01] CC.OS);
   then the art, the status line where the entry has one, the product's own
   copy, and the one action where the product has a CTA (CC.OS: its product
   page, through the transition coordinator like ProductsPanel). Always open,
   so nothing folds. Own .pv-pcard classes; the desktop rail (ProductsCard,
   ProductsPanel) is untouched. No copy here is new: every string comes from
   the entry (productsContent.ts) except the "Status:" label. */

export function ProductsPhoneCard({ product }: { product: ProductsEntry }) {
  const link = useTransitionLink();
  const { index, label, kind, status, panel } = product;
  const titleId = `pv-pcard-title-${index}`;

  return (
    <article className={`pv-pcard pv-pcard--${kind}`} aria-labelledby={titleId}>
      <h3 className="pv-pcard__bar" id={titleId}>
        <GearMark className="pv-pcard__gear" fill="#141414" dotFill="#5AE36F" />
        [{index}] {label}
      </h3>
      <div className="pv-pcard__art">
        <ProductsPanelArt art={panel.art} />
      </div>
      {status ? (
        <dl className="pv-pcard__facts">
          <div>
            <dt>Status:</dt>
            <dd>{status}</dd>
          </div>
        </dl>
      ) : null}
      <div className="pv-pcard__copy">
        <h4 className="pv-pcard__title">{panel.title}</h4>
        {panel.body.map((line) => (
          <p key={line} className="pv-pcard__body">
            {line}
          </p>
        ))}
      </div>
      {panel.cta ? (
        <Link className="pv-pcard__action" {...link(panel.cta.href)}>
          <GearMark className="pv-pcard__gear" fill="#141414" dotFill="#5AE36F" />
          <span>{panel.cta.label}</span>
        </Link>
      ) : null}
    </article>
  );
}
