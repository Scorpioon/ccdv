import { useRef } from "react";
import { SiteMasthead } from "../components/SiteMasthead";
import { SiteFooter } from "../components/SiteFooter";
import { StudioMobileMenu } from "../components/StudioMobileMenu";
import { ProductsCard, ProductsEmptySlot } from "../components/ProductsCard";
import { ProductsCover } from "../components/products/ProductsCover";
import { ProductsSoftwareCode } from "../components/products/ProductsSoftwareCode";
import { ProductsCcosPanel } from "../components/products/ProductsCcosPanel";
import { PRODUCTS, PRODUCTS_EMPTY_SLOTS } from "../data/productsContent";
import { useBoundaryNav, useNavIdle } from "../motion/routeNav";

export function meta() {
  return [{ title: "CCDV — Products" }];
}

/* Products V2 (t_20261117_products20, P1). Desktop follows PRODUCTS_v2.svg
   (1536 x 3354, OPERATOR D1: the four-column main design), phones
   PRODUCTS_responsive_v2.svg (390 x 3430, D2); tablets take the phone
   composition. Cover, \\Our Software Code, the Products rail, the CC.OS panel,
   then the shared footer.

   Navigation follows the global V2 routes (Studio / Services / Work): the thin
   masthead appears once the cover lockup has scrolled past and idles away
   (motion/routeNav.ts); phones get the M1 bar and menu instead.

   Card 01 opens CC.OS (`PRD-DEC-002`); 02-04 stay visible, disabled and
   non-navigable (`PRD-DEC-001`); 05-08 are empty decoration (D3). */
export default function Products() {
  const rootRef = useRef<HTMLDivElement>(null);
  const edgeRef = useRef<HTMLDivElement>(null);

  useBoundaryNav(rootRef, edgeRef, ".masthead--products", ".pv-cover__lockup");
  useNavIdle(rootRef);

  return (
    <div className="r11 r11--products" ref={rootRef}>
      <StudioMobileMenu current="/products" />
      <SiteMasthead variant="products" compact />

      <div className="pv">
        <h1 className="pv-visually-hidden">Products</h1>
        <ProductsCover />

        <div ref={edgeRef}>
          <ProductsSoftwareCode />
        </div>

        <section className="pv-products" aria-labelledby="pv-products-title">
          <h2 className="pv-products__title" id="pv-products-title">
            Products
          </h2>
          <ul className="pv-rail">
            {PRODUCTS.map((product) => (
              <li key={product.index}>
                <ProductsCard {...product} />
              </li>
            ))}
            {PRODUCTS_EMPTY_SLOTS.map((index) => (
              <li key={index} className="pv-rail__empty" aria-hidden="true">
                <ProductsEmptySlot index={index} />
              </li>
            ))}
          </ul>
        </section>

        <hr className="pv-rule" />

        <ProductsCcosPanel />
      </div>

      <SiteFooter />
    </div>
  );
}
