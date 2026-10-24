import { SiteFooter } from "../components/SiteFooter";
import { CcosHub } from "../components/CcosHub";

export function meta() {
  return [{ title: "CCDV — Products — CCOS" }];
}

/* `/products/ccos` — the CCOS hub (`pages_products_ccos.png`, 1440x2968).
   CcosHub owns its own page-specific header (see that component's note on
   why it does not reuse SiteMasthead); the shared footer is wired here,
   same as every other route. */
export default function ProductsCcos() {
  return (
    <div className="r11 r11--ccos">
      <CcosHub />
      <SiteFooter />
    </div>
  );
}
