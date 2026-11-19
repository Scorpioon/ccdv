import { ProductsCardIcon } from "./products/ProductsArtwork";
import type { ProductsEntry } from "../data/productsContent";

/* Products V2 card (PRODUCTS_v2.svg rail / PRODUCTS_responsive_v2.svg rows,
   `PRD-011`-`017`). P1b CORR03 (OPERATOR): every product card is a slot — a
   disclosure button that drops its panel below the rail (phones: under the
   row; ProductsRail). The open slot takes the green look, the closed ones the
   source's dimmed look. CC.OS no longer links straight to its hub: its panel's
   CTA does. CORR04: the empty frames are gone (three cards only). Desktop stacks
   index / label / icon / status down the card; phones lay the same nodes out
   as a row (CSS). */
export function ProductsCard({
  index,
  label,
  kind,
  status,
  open,
  panelId,
  onToggle,
}: Pick<ProductsEntry, "index" | "label" | "kind" | "status"> & {
  open: boolean;
  panelId: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className={`pv-card pv-card--${kind}`}
      id={`pv-card-${index}`}
      aria-expanded={open}
      aria-controls={panelId}
      data-open={open}
      onClick={onToggle}
    >
      <span className="pv-card__index">[ {index} ]</span>
      <span className="pv-card__label">[ {label} ]</span>
      <ProductsCardIcon kind={kind} />
      {status && <span className="pv-card__status">{status}</span>}
    </button>
  );
}
