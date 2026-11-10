import { Link } from "react-router";
import { CcosSystemIcon, type CcosIconFamily } from "./marks/CcosArtwork";

/* GF09-F CORR03 — camera Y across the rail. The earlier one-shot scroll
   remember/restore hook (correction B) is removed: it was a second scroll
   writer racing the router's, and it treated a symptom. The cause was the
   per-path exit/enter in GlobalShell; CCOS-to-CCOS now swaps the route inside
   one stable stage (see CCOS_ROOT there), so the document never shrinks and
   the browser simply keeps scrollY. The only scroll policy left here is
   `preventScrollReset` on the links, which tells the root <ScrollRestoration />
   not to scroll to the top on a rail PUSH. Back / Forward and deep links are
   untouched and keep the root behaviour. */

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
   and the active visual treatment there.

   GF09-F (FBI-035/036/037):
   - hub (no `activeId`): all six icons at full colour, no inactive state;
   - `family`: WRKOPS/KAIA/AETHERNOS use the bold white-rim /
     black-interior icon, PANOPTES/KRON/KAIRON the thin one (see CcosSystemIcon;
     PANOPTES moved to thin by operator request, M1 amendment A2);
   - leaf (`activeId` set): the current system keeps its native colour, the
     other five carry `data-state="inactive"`, which global.css renders at
     opacity 0.2 — R1.1 wraps exactly five artwork groups in
     `<g opacity="0.2">` on every leaf. Their cube gradient ends at #545454
     on KAIA/AETHERNOS/PANOPTES/KRON/KAIRON leaves; on the WRKOPS leaf the five
     groups keep their native hues (page_products_ccos_wkrops.svg paint2..6).
   - R1.1 has no per-icon text on any of the seven pages (only the single
     "<SYSTEM> [version]" caption under the rail), so the names stay in the
     DOM as the links' accessible text and are visually hidden. */

export interface CcosSystem {
  id: string;
  name: string;
  color: string;
  route: string;
  family: CcosIconFamily;
}

export const CCOS_SYSTEMS: CcosSystem[] = [
  { id: "wkrops", name: "WRKOPS", color: "#545454", route: "/products/ccos/wrkops", family: "bold" },
  { id: "kaia", name: "KAIA", color: "#8654B3", route: "/products/ccos/kaia", family: "bold" },
  { id: "athernos", name: "AETHERNOS", color: "#B35464", route: "/products/ccos/aethernos", family: "bold" },
  { id: "panoptes", name: "PANOPTES", color: "#48A4F6", route: "/products/ccos/panoptes", family: "thin" },
  { id: "kron", name: "KRON", color: "#B38B54", route: "/products/ccos/kron", family: "thin" },
  { id: "kairon", name: "KAIRON", color: "#5AE36F", route: "/products/ccos/kairon", family: "thin" },
];

const INACTIVE_COLOR = "#545454";

export function CcosSystemRail({ activeId }: { activeId?: string }) {
  const onLeaf = activeId !== undefined;
  return (
    <ul className="ccos-rail" aria-label="CCOS subsystems">
      {CCOS_SYSTEMS.map((system) => {
        const isActive = system.id === activeId;
        const isInactive = onLeaf && !isActive;
        const tone = isInactive && activeId !== "wkrops" ? INACTIVE_COLOR : system.color;
        return (
          <li
            key={system.id}
            className="ccos-rail__item"
            data-system-id={system.id}
            data-active={isActive}
            data-state={onLeaf ? (isActive ? "active" : "inactive") : undefined}
          >
            <Link
              to={system.route}
              className="ccos-rail__link"
              aria-current={isActive ? "page" : undefined}
              preventScrollReset
            >
              <CcosSystemIcon family={system.family} gradientTo={tone} className="ccos-rail__icon" />
              <span className="ccos-rail__name">{system.name}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
