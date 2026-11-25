import { useRef } from "react";
import { SiteMasthead } from "../components/SiteMasthead";
import { SiteFooter } from "../components/SiteFooter";
import { NavBand } from "../components/NavBand";
import { usePinTop } from "../motion/routeNav";

export function meta() {
  return [
    { title: "CCDV — Collapse Creative Development Unit" },
    { name: "description", content: "Collapse Creative Development Unit — UX/UI, code and motion studio, part of Collapse Creative." },
  ];
}

/* The five bands, top to bottom, exactly as R1.1 stacks them: a 31 colour
   stripe over a 177 body, repeating every 208 from y268. All five are
   routed as of GF08-B.

   GF07-C2: `suffixLeft` is each emoticon's text ORIGIN on the 1440 artboard,
   not its ink — GF07-C used measured ink minus an estimated bearing, which
   left three of the five several units out. Each origin is the measured ink
   less that glyph's R1.1 side bearing at 90, and all five land on round
   artboard numbers, which is the check that they are origins. */
const BANDS = [
  { slug: "studio", label: "[Studio]", suffix: ":P", suffixLeft: 951 },
  // NAV-T3 (OPERATOR): Services moved above Work
  { slug: "services", label: "[Services]", suffix: "\\", suffixLeft: 1180 },
  { slug: "work", label: "[Work]", suffix: "+.+", suffixLeft: 722 },
  { slug: "products", label: "[Products]", suffix: ":o", suffixLeft: 1180 },
  { slug: "contact", label: "[Contact]", suffix: "<3", suffixLeft: 1065 },
] as const;

/* N4 P-I A-04: GF09-G D2.1's "focus the Work band on return from Work" effect
   is gone: nothing pushes `state.from === "work"` since the V2 Work hub.
   N4 P-K D (OPERATOR): masthead and main sit in one `page-pin` wrapper that
   holds at the page end (desktop) while the footer rises over it. */
export default function Home() {
  const pageRef = useRef<HTMLDivElement>(null);
  usePinTop(pageRef);

  return (
    <div className="r11 r11--home">
      <div className="page-pin" ref={pageRef}>
        <SiteMasthead variant="home" />

        {/* N4 P-H A-14: masthead (banner) and footer (contentinfo) sit outside main */}
        <main>
          <ul className="bands">
            {BANDS.map((band) => (
              <NavBand key={band.slug} {...band} />
            ))}
          </ul>
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}
