import { useCallback, useEffect, useRef, useState } from "react";
import { SiteFooter } from "../components/SiteFooter";
import { ProductsCover } from "../components/products/ProductsCover";
import { ProductsSoftwareCode } from "../components/products/ProductsSoftwareCode";
import { ProductsRail } from "../components/products/ProductsRail";
import { DEFAULT_LIT, randomLit } from "../components/products/LitCube";
import { FloatingCube, tiltFloatingCube } from "../components/products/FloatingCube";
import { useMotionPolicy } from "../motion/reducedMotion";
import { useSceneReveal } from "../motion/studioMotion";
import { useBoundaryNav, useNavIdle, usePinTop } from "../motion/routeNav";
import { useStepScroll } from "../motion/stepScroll";

export function meta() {
  return [
    { title: "CCDV — Products" },
    { name: "description", content: "Software and tools built by CCDV, including CC.OS." },
  ];
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
   with the page stepped by motion/stepScroll.ts (A3/A4: one gesture, one
   rise; the cover rises straight into the module). Phones scroll as one
   column, as on Studio.

   Navigation follows the global V2 routes: the thin masthead appears once the
   cover lockup has scrolled past and, A9, only on a step up (motion/routeNav.ts); phones
   get the M1 bar and menu instead. P1b: Products is a scene route (it rises
   out of Home, falls back on `collapse`) and its cover spawns like Studio's
   (useSceneReveal, armed before the first paint).

   The lit pattern lives here: one cube shows it — the hero cube on desktop,
   the cube behind the topic rows on phones (where the cover is not shown).
   The server renders DEFAULT_LIT; the client rolls a random one once mounted
   and a new one on every topic selection.

   A5 (OPERATOR): on desktop the hero cube is one persistent cube, fixed on
   the screen, smaller, above the grid and behind the panels. Each scene
   (cover, module, rail) carries its own copy (`pv-float`), clipped to the
   scene, so as a scene rises its copy covers the last one exactly and the
   cube seems to stay. A6.1 (OPERATOR): the copies are FloatingCube, the
   phone cube in 3D on the Studio sphere system, and share the one lit
   pattern; every step landing (useStepScroll `onArrive`, desktop only) rolls
   a new one and kicks the cube — the phone's per-selection lighting change,
   applied to the steps. Phones are unchanged. A10 (OPERATOR): no kick on
   landing; the cube tilts during the step (`onStep`) and the faces change
   half-way. */
export default function Products() {
  const { reduced } = useMotionPolicy();
  const rootRef = useRef<HTMLDivElement>(null);
  const moduleRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLDivElement>(null);
  const [pattern, setPattern] = useState(DEFAULT_LIT);
  const reroll = useCallback(() => setPattern((current) => randomLit(current)), []);
  // A10: the cube tilts during the step and its faces change half-way
  const onStep = useCallback(
    (direction: 1 | -1, durationMs: number) => tiltFloatingCube(direction, durationMs, reroll),
    [reroll],
  );

  useSceneReveal(rootRef, reduced);
  useBoundaryNav(rootRef, moduleRef, ".masthead--products", ".cmh"); // A8: the V3 card
  useNavIdle(rootRef);
  usePinTop(moduleRef, nextRef);
  // A3: one gesture, one rise; A4: the cover rises straight into the module
  useStepScroll(rootRef, ".pin-snap", reduced, { coverPages: false, onStep });
  useEffect(reroll, [reroll]);

  return (
    <div className="r11 r11--products" ref={rootRef}>
      {/* N4 P-H A-14: the page body is the main landmark; the footer is its contentinfo */}
      <main className="pv">
        <h1 className="pv-visually-hidden">Products</h1>

        <div className="scene-curtain">
          <ProductsCover pattern={pattern} reduced={reduced} />

          <span className="pin-snap" aria-hidden="true" />
          <div className="pv-scene" ref={moduleRef}>
            <FloatingCube className="pv-float" pattern={pattern} reduced={reduced} />
            <ProductsSoftwareCode pattern={pattern} onSelect={reroll} reduced={reduced} />
          </div>

          <span className="pin-snap" aria-hidden="true" />
          <div className="pv-next" ref={nextRef}>
            <FloatingCube className="pv-float" pattern={pattern} reduced={reduced} />
            <section className="pv-products" aria-labelledby="pv-products-title">
              <h2 className="pv-products__title" id="pv-products-title">
                Products
              </h2>
              <ProductsRail />
            </section>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
