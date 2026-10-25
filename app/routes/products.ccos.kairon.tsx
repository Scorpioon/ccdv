import { SiteFooter } from "../components/SiteFooter";
import { CcosSystemDetail } from "../components/CcosSystemDetail";
import { getCcosSystem } from "../data/ccosSystems";

export function meta() {
  return [{ title: "CCDV — Products — CCOS — KAIRON" }];
}

const system = getCcosSystem("kairon");

/* `/products/ccos/kairon` — thin route delegating to the shared
   `CcosSystemDetail` template (GF08-C2). */
export default function ProductsCcosKairon() {
  return (
    <div className="r11 r11--ccos">
      <CcosSystemDetail system={system} />
      <SiteFooter />
    </div>
  );
}
