import { SiteMasthead } from "../components/SiteMasthead";
import { SiteFooter } from "../components/SiteFooter";
import { NavBand } from "../components/NavBand";

export function meta() {
  return [{ title: "CCDV — Collapse Creative Developent Unit" }];
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
  { slug: "studio", label: "[Studio]", suffix: ":P", suffixLeft: 951, routed: true },
  { slug: "work", label: "[Work]", suffix: "+.+", suffixLeft: 722, routed: true },
  { slug: "services", label: "[Services]", suffix: "\\", suffixLeft: 1180, routed: true },
  { slug: "products", label: "[Products]", suffix: ":o", suffixLeft: 1180, routed: true },
  { slug: "contact", label: "[Contact]", suffix: "<3", suffixLeft: 1065, routed: true },
] as const;

export default function Home() {
  return (
    <div className="r11 r11--home">
      <SiteMasthead variant="home" />

      <ul className="bands">
        {BANDS.map((band) => (
          <NavBand key={band.slug} {...band} />
        ))}
      </ul>

      <SiteFooter />
    </div>
  );
}
