import { HexCube } from "./HexCube";

/* CC.OS artwork. pages_products_ccos.svg draws every cube on the page as the
   exact same three-nested-hexagon-plus-Y construction already verified and
   componentised as HexCube for Studio (same ratio family, re-confirmed here:
   the hero icon's own gradient spans y400.831-480.629, a 79.8-tall box
   matching the rail icons' 1182.29-1262.09 box to the unit). Re-walking those
   paths per instance would reproduce geometry HexCube already owns; only the
   fill, which genuinely differs per instance, is source-read from the page's
   own <linearGradient> stops and passed through.

   N4: three marks remain — the hero icon (white→#303030, the CC.OS wordmark
   and explainer), Products card 01's icon, and the cores' system icon. The
   hub's leaf-hero and overview icons and (N4 P-I) the "thin" KRON / KAIRON
   family had no caller and are gone. */

/* GF09-F: the R1.1 CCOS pages draw every cube at 132.9 wide, not the 255.87
   this file's HexCube coordinates are expressed in, so the Y strokes
   (2.65226 on screen in pages_products_ccos.svg and all six leaf SVGs)
   re-express as 2.65226 / (132.898 / 255.873) = 5.106 viewBox units. */
const CCOS_BOLD_LINE = 5.106;

/* Hub hero: light outer hexagon, and — per the hub SVG — the Y is drawn in
   ink (#202020), not the light colour it carried before GF09-F. */
export function CcosHeroIcon({ className }: { className?: string }) {
  return (
    <HexCube
      className={className}
      variant="solid"
      gradientFrom="#FFFFFF"
      gradientTo="#303030"
      outerFill="#D9D9D9"
      lineColor="#202020"
      lineWidth={CCOS_BOLD_LINE}
    />
  );
}

/* Products card 01's icon (`PRD-013`, "black-and-silver"): same construction,
   but on the card's LIGHT panel background the source shows a black outer
   hex rather than the hero icon's light one — only outerFill/lineColor
   differ from CcosHeroIcon above. */
export function ProductsCcosIcon({ className }: { className?: string }) {
  return (
    <HexCube
      className={className}
      variant="solid"
      gradientFrom="#FFFFFF"
      gradientTo="#303030"
      outerFill="#202020"
      lineColor="#D9D9D9"
    />
  );
}

/* A core's icon (GF09-F, FBI-036; P2 CORR03, OPERATOR: KAIRON and KRON match
   the suite): light #D9D9D9 outer hexagon, #202020 middle ring, gradient
   cube, light Y at 2.65226. Only the cube's gradient end changes per core. */
export function CcosSystemIcon({ gradientTo, className }: { gradientTo: string; className?: string }) {
  return (
    <HexCube
      className={className}
      variant="ring"
      gradientFrom="#FFFFFF"
      gradientTo={gradientTo}
      outerFill="#D9D9D9"
      middleFill="#202020"
      lineColor="#D9D9D9"
      lineWidth={CCOS_BOLD_LINE}
    />
  );
}
