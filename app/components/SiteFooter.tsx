import { Link } from "react-router";
import { GearMark } from "./marks/GearMark";
import { CcdvPixelMark } from "./marks/CcdvPixelMark";

/* Identical on Home, Studio, Work and Services — the Studio-era coordinate
   match against footer.svg (gear at y53.2, text rows at +59.74/77.74/95.74/
   113.74, columns at x217.69/472.69/583.69) stands; Work/Services were
   checked at the rect level (160-tall dark footer rect at the expected
   page-bottom offset in both pages_work.svg and pages_services.svg) and by
   direct visual comparison of pages_work.png / pages_services.png, not by
   re-deriving every inner coordinate a second time.

   The gear is #CACAC8 and the pixel block #D9D9D9 here, and the gear's centre
   is knocked out in the footer's own ink rather than being light — that is
   what the reference does, so it is transcribed rather than normalised.

   Link text is reproduced verbatim from R1.1 and is editorially provisional.
   Work and Services now route; Products and Contact stay inert plain text
   until GF08-B gives them real destinations — this is the one shared
   component where that split is visible, so it is per-item, not per-column. */

const COLUMN_B: { label: string; to?: string }[] = [
  { label: "[ Work ]", to: "/work" },
  { label: "[ Services ]", to: "/services" },
  { label: "[ Products ]" },
  { label: "[ Contact ]" },
];
const COLUMN_C = ["[ Privacy ]", "[ Terms of use ]", "[ Legal ]", "[ Onlyfans ]"];

export function SiteFooter() {
  return (
    <footer className="footer">
      <span className="footer__mark" aria-hidden="true">
        <GearMark className="footer__gear" fill="#CACAC8" dotFill="#202020" />
        <CcdvPixelMark variant="inline" className="footer__pixel" fill="#D9D9D9" />
      </span>

      <div className="footer__col footer__col--a">
        <div>[ COLLAPSE CREATIVE : DEV UNIT ]</div>
        <div>[ hello[@]collapsecreative.com ]</div>
        <div>
          [ Part of <a href="https://collapsecreative.com">collapsecreative.com</a> ]
        </div>
        <div>[ © 2026 ]</div>
      </div>

      <div className="footer__col footer__col--b">
        {COLUMN_B.map((item) => (
          <div key={item.label}>{item.to ? <Link to={item.to}>{item.label}</Link> : item.label}</div>
        ))}
      </div>

      <div className="footer__col footer__col--c">
        {COLUMN_C.map((item) => (
          <div key={item}>{item}</div>
        ))}
      </div>
    </footer>
  );
}
