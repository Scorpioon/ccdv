import { SiteFooter } from "../components/SiteFooter";
import { CcosSystemDetail } from "../components/CcosSystemDetail";
import { getCcosSystem } from "../data/ccosSystems";

export function meta() {
  return [{ title: "CCDV — Products — CCOS — KRON" }];
}

const system = getCcosSystem("kron");

/* `/products/ccos/kron` — thin route delegating to the shared
   `CcosSystemDetail` template (GF08-C2). */
export default function ProductsCcosKron() {
  return (
    <div className="r11 r11--ccos">
      <CcosSystemDetail system={system} />
      <SiteFooter />
    </div>
  );
}
