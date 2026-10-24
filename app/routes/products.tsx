import { SiteMasthead } from "../components/SiteMasthead";
import { SiteFooter } from "../components/SiteFooter";
import { ProductsCard } from "../components/ProductsCard";

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
        <span className="hero__watermark" aria-hidden="true">
          collapse
        </span>
      </section>

      <div className="section section--stripe" />

      <section className="section section--products-cards" aria-label="Products">
        <ProductsCard index="01" label="CC.OS" kind="ccos" href="/products/ccos" />
        <ProductsCard index="02" label="PROJECT LS" kind="triangle" />
        <ProductsCard index="03" label="PROJECT VC" kind="diamond" />
        <ProductsCard index="04" label="PROJECT L" kind="pentagon" />
      </section>

      <SiteFooter />
    </div>
  );
}
