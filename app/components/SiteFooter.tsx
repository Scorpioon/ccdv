import { GearMark } from "./marks/GearMark";
import { CcdvPixelMark } from "./marks/CcdvPixelMark";

/* Identical on Home and Studio — verified by the footer block in
   pages_studio.svg matching footer.svg coordinate for coordinate (gear at
   y53.2, text rows at +59.74/77.74/95.74/113.74, columns at x217.69/472.69/
   583.69).

   The gear is #CACAC8 and the pixel block #D9D9D9 here, and the gear's centre
   is knocked out in the footer's own ink rather than being light — that is
   what the reference does, so it is transcribed rather than normalised.

   Link text is reproduced verbatim from R1.1 and is editorially provisional;
   none of these destinations is routed in this build, so they are inert. */

const COLUMN_B = ["[ Work ]", "[ Services ]", "[ Products ]", "[ Contact ]"];
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
          <div key={item}>{item}</div>
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
