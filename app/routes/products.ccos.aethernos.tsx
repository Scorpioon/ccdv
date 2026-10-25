import { SiteFooter } from "../components/SiteFooter";
import { CcosSystemDetail } from "../components/CcosSystemDetail";
import { getCcosSystem } from "../data/ccosSystems";

export function meta() {
  return [{ title: "CCDV — Products — CCOS — AETHERNOS" }];
}

const system = getCcosSystem("athernos");

/* `/products/ccos/aethernos` — thin route delegating to the shared
   `CcosSystemDetail` template (GF08-C2). Public route and displayed name use
   the corrected "aethernos"/"AETHERNOS" spelling; the internal system id
   stays the stable "athernos" (CLAUDE.md §2/§4). */
export default function ProductsCcosAethernos() {
  return (
    <div className="r11 r11--ccos">
      <CcosSystemDetail system={system} />
      <SiteFooter />
    </div>
  );
}
