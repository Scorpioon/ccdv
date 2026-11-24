import { CcdvLongMark } from "./CcdvLongMark";

/* Contact's two oversized directory identities (`CTC-012`, `CTC-014`).

   CCDV: the long-format lockup (CCDV_Long.svg, gear + horizontal pixel
   wordmark), approved for CTC-012 in GF09-A2 D4. Inert: no anchor, no
   handler (`CTC-DEC-004`).

   Collapse Creative: N2 A2 (OPERATOR: use the real logo) — the operator's
   own lockup (CollapseCreativeLogo.tsx, verbatim paths, as in the M1 menu)
   replaces the approximate rings and typed wordmark. */
import { CollapseCreativeLogo } from "./CollapseCreativeLogo";

export function CcdvIdentityMark({ className }: { className?: string }) {
  return (
    <span className={className} aria-hidden="true">
      <CcdvLongMark className="identity-mark__long" />
    </span>
  );
}

export function CollapseCreativeMark({ className }: { className?: string }) {
  return (
    <span className={className} aria-hidden="true">
      <CollapseCreativeLogo className="identity-mark__cc" />
    </span>
  );
}
