import { SiteFooter } from "../components/SiteFooter";
import { CcosSystemDetail } from "../components/CcosSystemDetail";
import { getCcosSystem } from "../data/ccosSystems";

export function meta() {
  return [{ title: "CCDV — Products — CCOS — WRKOPS" }];
}

const system = getCcosSystem("wkrops");

/* `/products/ccos/wrkops` — thin route delegating to the shared
   `CcosSystemDetail` template (GF08-C2). Public route uses the corrected
   "wrkops" spelling; the internal system id stays the stable "wkrops"
   (CLAUDE.md §2/§4). */
export default function ProductsCcosWrkops() {
  return (
    <div className="r11 r11--ccos">
      <CcosSystemDetail system={system} />
      <SiteFooter />
    </div>
  );
}
