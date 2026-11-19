import { useRef, useState } from "react";
import { SiteMasthead } from "../components/SiteMasthead";
import { SiteFooter } from "../components/SiteFooter";
import { StudioMobileMenu } from "../components/StudioMobileMenu";
import { CcosDeck, type DeckSlide } from "../components/ccos/CcosDeck";
import {
  CcosAppSlide,
  CcosExplainerSlide,
  CcosHeroSlide,
  CcosIntroSlide,
  CcosLocalSlide,
  CcosMapSlide,
  CcosModularSlide,
} from "../components/ccos/CcosSlides";
import { CCOS_DEFAULT_CORE, type CcosCoreId } from "../data/ccosContent";
import { useMotionPolicy } from "../motion/reducedMotion";

export function meta() {
  return [{ title: "CCDV — Products — CC.OS" }];
}

/* `/products/ccos` (t_20261117_products20 P2, PRODUCTS/CCOS.svg). OPERATOR:
   one page for CC.OS and its six cores, replacing the R1.1 hub and the six
   leaf pages (deleted, no redirect), built as a slideshow — the hero, the
   intro, the core map, two statements, the product explainer, the app, and
   the shared footer as the last stop. It rises out of /products and falls
   back to it (GlobalShell SCENE_PARENT). The route keeps the Products chrome
   (`r11--products`: the thin masthead with Products current, the M1 bar and
   menu on phones) and adds the deck's own rules (`r11--ccos`, global.css).

   The selected core lives here: the map (slide 3) and the explainer (slide 6)
   show the same one, CC.OS on load. */
export default function ProductsCcos() {
  const { reduced } = useMotionPolicy();
  const rootRef = useRef<HTMLDivElement>(null);
  const [core, setCore] = useState<CcosCoreId>(CCOS_DEFAULT_CORE);

  const slides: DeckSlide[] = [
    { key: "hero", label: "CC.OS", content: <CcosHeroSlide /> },
    { key: "intro", label: "Introduction", content: <CcosIntroSlide /> },
    { key: "map", label: "The cores", content: <CcosMapSlide selected={core} onSelect={setCore} /> },
    { key: "modular", label: "A modular ecosystem", content: <CcosModularSlide /> },
    { key: "local", label: "Always local", content: <CcosLocalSlide /> },
    { key: "explainer", label: "The products", content: <CcosExplainerSlide selected={core} onSelect={setCore} /> },
    { key: "app", label: "The app", content: <CcosAppSlide /> },
    { key: "footer", label: "Footer", content: <SiteFooter />, partial: true },
  ];

  return (
    <div className="r11 r11--products r11--ccos" ref={rootRef}>
      <StudioMobileMenu current="/products" />
      <SiteMasthead variant="products" compact />
      <CcosDeck slides={slides} rootRef={rootRef} reduced={reduced} label="CC.OS" />
    </div>
  );
}
