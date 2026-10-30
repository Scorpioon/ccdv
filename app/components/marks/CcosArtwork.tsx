import { HexCube } from "./HexCube";

/* CCOS hub artwork. pages_products_ccos.svg draws every cube on this page —
   the centred hero icon, the six system-rail icons and the overview-panel
   icon — as the exact same three-nested-hexagon-plus-Y construction already
   verified and componentised as HexCube for Studio (same ratio family, re-
   confirmed here: the hero icon's own gradient spans y400.831-480.629, a
   79.8-tall box matching the rail icons' 1182.29-1262.09 box to the unit).
   Re-walking those paths per instance would reproduce geometry HexCube
   already owns; only the fill, which genuinely differs per instance, is
   source-read from the page's own <linearGradient> stops and passed through.

   Hero and overview icons are both grey, sourced from the page's own two
   grey gradients: hero white→#303030, overview #D4D4D4→#1E1E1E. */

/* GF09-F: the R1.1 CCOS pages draw every cube at 132.9 wide, not the 255.87
   this file's HexCube coordinates are expressed in, so the Y strokes
   (2.65226 on screen in pages_products_ccos.svg and all six leaf SVGs)
   re-express as 2.65226 / (132.898 / 255.873) = 5.106 viewBox units, and the
   KRON/KAIRON fine strokes (0.759691 ring, 0.5 Y) as 1.463 and 0.963. */
const CCOS_BOLD_LINE = 5.106;
const CCOS_THIN_RING = 1.463;
const CCOS_THIN_LINE = 0.963;

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

/* Leaf hero: ink outer hexagon, light Y, gradient tinted to the page's own
   theme colour (all six leaf SVGs, paint0). */
export function CcosLeafHeroIcon({
  gradientTo,
  className,
}: {
  gradientTo: string;
  className?: string;
}) {
  return (
    <HexCube
      className={className}
      variant="solid"
      gradientFrom="#FFFFFF"
      gradientTo={gradientTo}
      outerFill="#202020"
      lineColor="#D9D9D9"
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

/* GF09-F (FBI-039): the hub SVG draws the overview icon as the thin-outline
   construction (stroked outer/middle rings and Y in #CACAC8 at 0.5325, the
   scale-1 HexCube geometry itself: outer 960.257..1216.13), not the filled
   white ring it used before. */
export function CcosOverviewIcon({ className }: { className?: string }) {
  return (
    <HexCube
      className={className}
      variant="interior"
      gradientFrom="#D4D4D4"
      gradientTo="#1E1E1E"
      lineColor="#CACAC8"
      lineWidth={0.5325}
    />
  );
}

/* Two rail-icon families, both in every CCOS SVG (GF09-F, FBI-036):
   - bold (WRKOPS, KAIA, AETHERNOS, PANOPTES): light #D9D9D9 outer hexagon,
     #202020 middle ring, gradient cube, light Y at 2.65226;
   - thin (KRON, KAIRON): light outer hexagon, a fine #202020 stroked middle
     ring (0.759691), gradient cube and a #202020 Y at 0.5.
   Only the cube's gradient end changes per system / per state. */
export type CcosIconFamily = "bold" | "thin";

export function CcosSystemIcon({
  family,
  gradientTo,
  className,
}: {
  family: CcosIconFamily;
  gradientTo: string;
  className?: string;
}) {
  if (family === "thin") {
    return (
      <HexCube
        className={className}
        variant="thin"
        gradientFrom="#FFFFFF"
        gradientTo={gradientTo}
        outerFill="#D9D9D9"
        lineColor="#202020"
        lineWidth={CCOS_THIN_LINE}
        ringWidth={CCOS_THIN_RING}
      />
    );
  }
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
