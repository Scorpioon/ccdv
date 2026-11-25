import { useState } from "react";
import { SiteFooter } from "../components/SiteFooter";
import { CcosWordmark } from "../components/marks/CcosWordmark";
import { CcosDeck, type DeckSlide } from "../components/ccos/CcosDeck";
import {
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
  return [
    { title: "CCDV — Products — CC.OS" },
    { name: "description", content: "CC.OS — the CCDV operating system for creative development work." },
  ];
}

/* `/products/ccos` (t_20261117_products20 P2, PRODUCTS/CCOS.svg). OPERATOR:
   one page for CC.OS and its six cores, replacing the R1.1 hub and the six
   leaf pages (deleted, no redirect), built as a slideshow — the hero, the
   intro, the core map, two statements, the product explainer, and the shared
   footer as the last stop. N4 H6: entering and leaving use the shell's single
   page fade (GlobalShell); a move back to /products is a "back" direction there
   (routeDir).

   P2 CORR01 (OPERATOR): no masthead and no M1 bar here — the deck carries
   one "Back" link; no grid; the app slide is gone. The root keeps
   `r11--products` for the Products tokens (ease, small type, ink) and adds
   the deck's own rules (`r11--ccos`, global.css).

   The selected core lives here: the map (slide 3) and the explainer (slide 6)
   show the same one, CC.OS on load.

   P2 CORR03 (OPERATOR): the CC.OS lockup stays top-centre from slide 2 on
   (the deck's `mark`); slides 3-6 know whether they are current (the map's
   walk, the cards and the animations run only then). */
export default function ProductsCcos() {
  const { reduced } = useMotionPolicy();
  const [core, setCore] = useState<CcosCoreId>(CCOS_DEFAULT_CORE);

  const slides: DeckSlide[] = [
    { key: "hero", label: "CC.OS", content: (current) => <CcosHeroSlide current={current} /> },
    { key: "intro", label: "Introduction", content: <CcosIntroSlide /> },
    {
      key: "map",
      label: "The cores",
      content: (current) => <CcosMapSlide current={current} reduced={reduced} selected={core} onSelect={setCore} />,
    },
    {
      key: "modular",
      label: "A modular ecosystem",
      content: (current) => <CcosModularSlide current={current} reduced={reduced} />,
    },
    { key: "local", label: "Always local", content: (current) => <CcosLocalSlide current={current} reduced={reduced} /> },
    {
      key: "explainer",
      label: "The products",
      unmarked: true,
      content: (current) => <CcosExplainerSlide current={current} selected={core} onSelect={setCore} />,
    },
    { key: "footer", label: "Footer", content: <SiteFooter />, partial: true },
  ];

  return (
    /* N4 P-H A-14: the deck is the main landmark; its footer is a slide, so it stays inside */
    <main className="r11 r11--products r11--ccos">
      <CcosDeck slides={slides} reduced={reduced} label="CC.OS" mark={<CcosWordmark />} />
    </main>
  );
}
