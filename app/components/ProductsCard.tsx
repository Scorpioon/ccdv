import { Link } from "react-router";
import { ProductsCardIcon } from "./products/ProductsArtwork";
import { PRODUCTS_STATUS, type ProductsEntry } from "../data/productsContent";

/* Products V2 card (PRODUCTS_v2.svg rail / PRODUCTS_responsive_v2.svg rows,
   `PRD-011`-`017`). Card 01 is a real link to CC.OS (`PRD-DEC-002`); cards
   02-04 stay visible, dimmed and non-navigable (`PRD-DEC-001`) with the
   design's `[ Coming Soon ]` (OPERATOR D3) — a plain non-interactive element,
   as before, since there is no destination to point a disabled control at.
   The empty frames 05-08 are ProductsEmptySlot. Desktop stacks index / label /
   icon / status down the card; phones lay the same nodes out as a row (CSS). */
export function ProductsCard({ index, label, kind, href }: ProductsEntry) {
  const content = (
    <>
      <span className="pv-card__index">[ {index} ]</span>
      <span className="pv-card__label">[ {label} ]</span>
      <ProductsCardIcon kind={kind} />
      {!href && <span className="pv-card__status">{PRODUCTS_STATUS}</span>}
    </>
  );

  if (href) {
    return (
      <Link to={href} className="pv-card pv-card--active">
        {content}
      </Link>
    );
  }

  return (
    <span className="pv-card" aria-disabled="true">
      {content}
    </span>
  );
}

export function ProductsEmptySlot({ index }: { index: string }) {
  return (
    <span className="pv-card pv-card--empty" aria-hidden="true">
      <span className="pv-card__index">[ {index} ]</span>
    </span>
  );
}
