import { useCallback, useEffect, useRef, useState } from "react";
import { SiteMasthead } from "../components/SiteMasthead";
import { SiteFooter } from "../components/SiteFooter";
import { StudioMobileMenu } from "../components/StudioMobileMenu";
import { ProductsCover } from "../components/products/ProductsCover";
import { ProductsSoftwareCode } from "../components/products/ProductsSoftwareCode";
import { ProductsRail } from "../components/products/ProductsRail";
import { DEFAULT_LIT, randomLit } from "../components/products/LitCube";
import { useMotionPolicy } from "../motion/reducedMotion";
import { useSceneReveal } from "../motion/studioMotion";
import { useBoundaryNav, useNavIdle, usePinTop } from "../motion/routeNav";

export function meta() {
  return [{ title: "CCDV — Products" }];
}

/* Products V2 (t_20261117_products20). Desktop follows PRODUCTS_v2.svg
   (1536 x 3354) with \\Our Software Code from
   PRODUCTS_v2_singlemidpanel_variant.svg (P1b, OPERATOR: replaces D1's four
   columns), phones PRODUCTS_responsive_v2.svg (390 x 3430, D2); tablets take
   the phone composition. Cover, \\Our Software Code, the Products rail with
   its drop-down panels, then the shared footer.

   P1b CORR03 (OPERATOR): the Studio / Services scene flow, with the page's
   own ink + grid ground instead of a black container (desktop, global.css):
     cover      fits the screen and sticks once its lower edge meets the
                screen's (NAV-T3 curtain)
     module     \\Our Software Code rises over it, fits the screen and pins,
                one screen tall (PIN-T1, usePinTop)
     next       the Products rail rises over the pinned module
   with proximity snap at the two in-flow markers (a sticky element's own
   snap position moves with it). Phones scroll as one column, as on Studio.

   Navigation follows the global V2 routes: the thin masthead appears once the
   cover lockup has scrolled past and idles away (motion/routeNav.ts); phones
   get the M1 bar and menu instead. P1b: Products is a scene route (it rises
   out of Home, falls back on `collapse`) and its cover spawns like Studio's
   (useSceneReveal, armed before the first paint).

   The lit pattern lives here: one cube shows it — the hero cube on desktop,
   the cube behind the topic rows on phones (where the cover is not shown).
   The server renders DEFAULT_LIT; the client rolls a random one once mounted
   and a new one on every topic selection. */
export default function Products() {
  const { reduced } = useMotionPolicy();
  const rootRef = useRef<HTMLDivElement>(null);
  const moduleRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLDivElement>(null);
  const [pattern, setPattern] = useState(DEFAULT_LIT);
  const reroll = useCallback(() => setPattern((current) => randomLit(current)), []);

  useSceneReveal(rootRef, reduced);
  useBoundaryNav(rootRef, moduleRef, ".masthead--products", ".pv-cover__lockup");
  useNavIdle(rootRef);
  usePinTop(moduleRef, nextRef);
  useEffect(reroll, [reroll]);

  return (
    <div className="r11 r11--products" ref={rootRef}>
      <StudioMobileMenu current="/products" />
      <SiteMasthead variant="products" compact />

      <div className="pv">
        <h1 className="pv-visually-hidden">Products</h1>

        <div className="scene-curtain">
          <ProductsCover pattern={pattern} />

          <span className="pin-snap" aria-hidden="true" />
          <div className="pv-scene" ref={moduleRef}>
            <ProductsSoftwareCode pattern={pattern} onSelect={reroll} reduced={reduced} />
          </div>

          <span className="pin-snap" aria-hidden="true" />
          <div className="pv-next" ref={nextRef}>
            <section className="pv-products" aria-labelledby="pv-products-title">
              <h2 className="pv-products__title" id="pv-products-title">
                Products
              </h2>
              <ProductsRail />
            </section>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
