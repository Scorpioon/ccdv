import { CcosSystemIcon } from "./marks/CcosArtwork";

/* The six-subsystem icon rail (`PCC-011`, `PCC-DEC-001`). Order and colour
   are read straight off pages_products_ccos.svg's own six gradient stops
   (left to right: #545454, #8654B3, #B35464, #48A4F6, #B38B54, #5AE36F),
   which is independently the exact WRKOPS/KAIA/AETHERNOS/PANOPTES/KRON/
   KAIRON order this task specifies.

   `PCC-DEC-001` approves these as six navigation entry points, but the six
   leaf pages are GF08-C's, not this task's (CLAUDE.md §0). Stable `id`s are
   kept on each entry so GF08-C can wire a real `to` in without touching this
   rail's structure; until then every entry renders as an inert, clearly
   non-interactive item — no route, no placeholder "coming soon" copy. */

export interface CcosSystem {
  id: string;
  name: string;
  color: string;
}

export const CCOS_SYSTEMS: CcosSystem[] = [
  { id: "wkrops", name: "WRKOPS", color: "#545454" },
  { id: "kaia", name: "KAIA", color: "#8654B3" },
  { id: "athernos", name: "AETHERNOS", color: "#B35464" },
  { id: "panoptes", name: "PANOPTES", color: "#48A4F6" },
  { id: "kron", name: "KRON", color: "#B38B54" },
  { id: "kairon", name: "KAIRON", color: "#5AE36F" },
];

export function CcosSystemRail() {
  return (
    <ul className="ccos-rail" aria-label="CCOS subsystems">
      {CCOS_SYSTEMS.map((system) => (
        <li key={system.id} className="ccos-rail__item" data-system-id={system.id} aria-disabled="true">
          <CcosSystemIcon gradientTo={system.color} className="ccos-rail__icon" />
          <span className="ccos-rail__name">{system.name}</span>
        </li>
      ))}
    </ul>
  );
}
