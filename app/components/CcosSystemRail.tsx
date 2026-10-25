import { Link } from "react-router";
import { CcosSystemIcon } from "./marks/CcosArtwork";

/* The six-subsystem icon rail (`PCC-011`, `PCC-DEC-001`). Order and colour
   are read straight off pages_products_ccos.svg's own six gradient stops
   (left to right: #545454, #8654B3, #B35464, #48A4F6, #B38B54, #5AE36F),
   which is independently the exact WRKOPS/KAIA/AETHERNOS/PANOPTES/KRON/
   KAIRON order this task specifies.

   GF08-C2: every entry is now a real `Link` to its approved public route
   (CLAUDE.md §2/§7). `activeId` is optional and unset on the hub (`CcosHub`
   passes none — "The parent hub should not acquire an active subsystem
   selection by default", CLAUDE.md §7), and set to the current leaf's own
   `id` by `CcosSystemDetail` so exactly one entry carries `aria-current`
   and the active visual treatment there. Artwork, order and spacing are
   unchanged from GF08-B2. */

export interface CcosSystem {
  id: string;
  name: string;
  color: string;
  route: string;
}

export const CCOS_SYSTEMS: CcosSystem[] = [
  { id: "wkrops", name: "WRKOPS", color: "#545454", route: "/products/ccos/wrkops" },
  { id: "kaia", name: "KAIA", color: "#8654B3", route: "/products/ccos/kaia" },
  { id: "athernos", name: "AETHERNOS", color: "#B35464", route: "/products/ccos/aethernos" },
  { id: "panoptes", name: "PANOPTES", color: "#48A4F6", route: "/products/ccos/panoptes" },
  { id: "kron", name: "KRON", color: "#B38B54", route: "/products/ccos/kron" },
  { id: "kairon", name: "KAIRON", color: "#5AE36F", route: "/products/ccos/kairon" },
];

export function CcosSystemRail({ activeId }: { activeId?: string }) {
  return (
    <ul className="ccos-rail" aria-label="CCOS subsystems">
      {CCOS_SYSTEMS.map((system) => {
        const isActive = system.id === activeId;
        return (
          <li key={system.id} className="ccos-rail__item" data-system-id={system.id} data-active={isActive}>
            <Link
              to={system.route}
              className="ccos-rail__link"
              aria-current={isActive ? "page" : undefined}
            >
              <CcosSystemIcon gradientTo={system.color} className="ccos-rail__icon" />
              <span className="ccos-rail__name">{system.name}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
