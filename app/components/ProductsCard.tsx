import { Link } from "react-router";
import { ProductsCcosIcon } from "./marks/CcosArtwork";

/* The four Products cards (`PRD-011`–`PRD-017`, `PRD-DEC-001/002`). Card 01
   is a real link to CCOS (`PRD-DEC-002`); cards 02-04 stay visible, reduced-
   contrast and non-navigable (`PRD-DEC-001`) — rendered as a plain
   non-interactive group rather than a disabled <button>/<a>, since there is
   no destination to point a disabled control at.

   Card art (triangle/diamond/pentagon, `PRD-014`-`016`) is transcribed
   directly from pages_products.svg's own card-icon paths, each viewBox set
   to that icon's own source bounding box — the same "paste the source
   coordinates as the viewBox" approach WorkGearTile/ServicesArrowTile use,
   so no coordinate translation was needed. Card 01's icon reuses CcosArtwork
   (HexCube) rather than re-transcribing the same hex-cube construction a
   third time on this one page. */

export interface ProductsCardProps {
  index: string;
  label: string;
  kind: "ccos" | "triangle" | "diamond" | "pentagon";
  href?: string;
}

function CardArt({ kind }: { kind: ProductsCardProps["kind"] }) {
  if (kind === "ccos") {
    return <ProductsCcosIcon className="product-card__art" />;
  }
  if (kind === "triangle") {
    return (
      <svg className="product-card__art" viewBox="479.551 757.893 132.898 138.112" aria-hidden="true" focusable="false">
        <path d="M546 757.893L612.449 872.986H479.551L546 757.893Z" fill="#202020" />
        <path d="M545.999 773.238L599.159 865.313H492.84L545.999 773.238Z" fill="#202020" />
        <path d="M546.001 794.723L580.554 854.571H511.447L546.001 794.723Z" fill="#D9D9D9" />
        <path d="M492.29 803.93L546 834.621L599.71 803.93" stroke="#D9D9D9" strokeWidth="2.65" fill="none" />
        <path d="M546.001 834.622V896.005" stroke="#D9D9D9" strokeWidth="2.65" />
      </svg>
    );
  }
  if (kind === "diamond") {
    return (
      <svg className="product-card__art" viewBox="817.271 757.893 153.458 153.457" aria-hidden="true" focusable="false">
        <path d="M894 757.893L970.729 834.621L894 911.35L817.271 834.621L894 757.893Z" fill="#202020" />
        <path d="M893.999 773.238L955.382 834.621L893.999 896.004L832.616 834.621L893.999 773.238Z" fill="#202020" />
        <path d="M894.001 794.723L933.9 834.622L894.001 874.521L854.102 834.622L894.001 794.723Z" fill="#D9D9D9" />
        <path d="M840.29 803.93L894 834.621L947.71 803.93" stroke="#D9D9D9" strokeWidth="2.65" fill="none" />
        <path d="M894.001 834.622V896.005" stroke="#D9D9D9" strokeWidth="2.65" />
      </svg>
    );
  }
  return (
    <svg className="product-card__art" viewBox="1169.03 757.893 145.94 138.803" aria-hidden="true" focusable="false">
      <path d="M1242 757.893L1314.97 810.911L1287.1 896.696H1196.9L1169.03 810.911L1242 757.893Z" fill="#202020" />
      <path d="M1242 773.238L1300.38 815.653L1278.08 884.281H1205.92L1183.62 815.653L1242 773.238Z" fill="#202020" />
      <path d="M1242 794.723L1279.95 822.292L1265.45 866.901H1218.55L1204.05 822.292L1242 794.723Z" fill="#D9D9D9" />
      <path d="M1188.29 803.93L1242 834.621L1295.71 803.93" stroke="#D9D9D9" strokeWidth="2.65" fill="none" />
      <path d="M1242 834.622V896.005" stroke="#D9D9D9" strokeWidth="2.65" />
    </svg>
  );
}

export function ProductsCard({ index, label, kind, href }: ProductsCardProps) {
  const content = (
    <>
      <span className="product-card__index">[ {index} ]</span>
      <CardArt kind={kind} />
      <span className="product-card__label">[ {label} ]</span>
    </>
  );

  if (href) {
    return (
      <Link to={href} className="product-card product-card--active">
        {content}
      </Link>
    );
  }

  return (
    <span className="product-card" aria-disabled="true">
      {content}
    </span>
  );
}
