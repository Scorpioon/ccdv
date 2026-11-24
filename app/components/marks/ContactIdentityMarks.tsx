import { CollapseCreativeLogo } from "./CollapseCreativeLogo";

/* Contact's directory identity (`CTC-014`): the Collapse Creative lockup.
   N2 A2 (OPERATOR: use the real logo) — the operator's own lockup
   (CollapseCreativeLogo.tsx, verbatim paths, as in the M1 menu) replaces the
   approximate rings and typed wordmark. N3 G2 / C1 (OPERATOR): the CCDV long
   lockup (`CTC-012`, CcdvIdentityMark / CcdvLongMark) is removed. */
export function CollapseCreativeMark({ className }: { className?: string }) {
  return (
    <span className={className} aria-hidden="true">
      <CollapseCreativeLogo className="identity-mark__cc" />
    </span>
  );
}
