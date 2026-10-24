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

export function CcosHeroIcon({ className }: { className?: string }) {
  return (
    <HexCube
      className={className}
      variant="solid"
      gradientFrom="#FFFFFF"
      gradientTo="#303030"
      outerFill="#D9D9D9"
      lineColor="#D9D9D9"
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

export function CcosOverviewIcon({ className }: { className?: string }) {
  return (
    <HexCube
      className={className}
      variant="ring"
      gradientFrom="#D4D4D4"
      gradientTo="#1E1E1E"
      outerFill="#D9D9D9"
      middleFill="#202020"
      lineColor="#D9D9D9"
    />
  );
}

/* One rail icon: a light hex outline with the system's own gradient cube
   inside, reusing HexCube's "interior" variant (stroked outer/middle rings,
   gradient-filled inner ring) exactly as Studio's intro placement already
   does — only the two gradient stops change per system. */
export function CcosSystemIcon({
  gradientTo,
  className,
}: {
  gradientTo: string;
  className?: string;
}) {
  return (
    <HexCube
      className={className}
      variant="interior"
      gradientFrom="#FFFFFF"
      gradientTo={gradientTo}
      lineColor="#D9D9D9"
    />
  );
}
