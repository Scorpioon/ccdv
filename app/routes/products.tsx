import { Link } from "react-router";
import { SiteMasthead } from "../components/SiteMasthead";
import { SiteFooter } from "../components/SiteFooter";
import { ProductsCard } from "../components/ProductsCard";
import { useTransitionLink } from "../components/GlobalShell";

export function meta() {
  return [{ title: "CCDV — Products" }];
}

/* Products is a 1237-tall artboard: 268.12 masthead, 31 stripe, 177 hero,
   31 stripe, 569 card rail, 160 footer — the literal rect heights from
   pages_products.svg, summing unchanged.

   Card 01 opens CCOS (`PRD-DEC-002`); cards 02-04 stay visible, disabled,
   non-navigable (`PRD-DEC-001`) — see ProductsCard for the per-card art
   provenance. Labels/indices are transcribed verbatim draft placeholders. */
export default function Products() {
  const link = useTransitionLink();
  return (
    <div className="r11 r11--products">
      <SiteMasthead variant="products" />

      <div className="section section--stripe" />

      <section className="section section--hero" aria-labelledby="products-hero">
        <h1 className="band__label" id="products-hero">
          [Products]
        </h1>
        <span className="band__suffix" style={{ left: "calc(1180 * var(--u))" }}>
          :o
        </span>
        {/* NAV-T3 (OPERATOR): `collapse` goes Home everywhere */}
        <Link className="hero__watermark" aria-label="collapse — back to Home" {...link("/")}>
          collapse
        </Link>
      </section>

      <div className="section section--stripe" />

      <section className="section section--products-cards" aria-label="Products">
        <ProductsCard index="01" label="CC.OS" kind="ccos" href="/products/ccos" />
        <ProductsCard index="02" label="PROJECT LS" kind="triangle" />
        <ProductsCard index="03" label="PROJECT VC" kind="diamond" />
        {/* 2026-11-17 (OPERATOR): card 04 renamed PROJECT L -> PROJECT iDS;
            still a disabled placeholder (PRD-016 / PRD-DEC-001) */}
        <ProductsCard index="04" label="PROJECT iDS" kind="pentagon" />
      </section>

      <SiteFooter />
    </div>
  );
}
