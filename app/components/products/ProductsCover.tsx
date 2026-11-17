import { Link } from "react-router";
import { useTransitionLink } from "../GlobalShell";
import { GearMark } from "../marks/GearMark";
import { CcdvPixelMark } from "../marks/CcdvPixelMark";
import { Chip } from "../studio/studioMarks";
import { ProductsHeroCube } from "./ProductsArtwork";
import { PRODUCTS_INTRO } from "../../data/productsContent";

/* Products V2 cover (PRODUCTS_v2.svg y0..1243.73). The identity lockup,
   `collapse`, the loose squares and the Whois chip sit exactly where
   StudioCover puts them (same 1440 geometry, x1.0667 on this 1536 artboard),
   here light-on-ink with the green accent; the wireframe cube replaces
   Studio's sphere. Phones (PRODUCTS_responsive_v2.svg y50..557) keep only the
   cube: the M1 bar carries the identity, and the Whois block has no phone
   slot in the source.

   The lockup is not a link (as on Studio); `collapse` goes Home (NAV-T3). Its
   title is brand text, not the page heading — the route's h1 is "Products". */
export function ProductsCover() {
  const link = useTransitionLink();
  return (
    <section className="pv-cover" aria-label="CCDV">
      <div className="pv-cover__lockup">
        <GearMark className="pv-cover__gear" fill="#F2F2F2" dotFill="#5AE36F" />
        <CcdvPixelMark variant="stack" className="pv-cover__pixel" fill="#F2F2F2" />
        <p className="pv-cover__title">
          <span>Collapse Creative</span> <span>Development Unit</span>
        </p>
        <div className="pv-cover__meta">
          <div>[ COLLAPSE CREATIVE : DEV UNIT ]</div>
          <div>[ hello[@]collapsecreative.com ]</div>
          <div>
            [ Part of <a href="https://collapsecreative.com">collapsecreative.com</a> ]
          </div>
        </div>
      </div>
      <Link className="pv-cover__label" aria-label="collapse — back to Home" {...link("/")}>
        collapse
      </Link>
      <span className="pv-cover__sq pv-cover__sq--a" aria-hidden="true" />
      <span className="pv-cover__sq pv-cover__sq--b" aria-hidden="true" />
      <span className="pv-cover__sq pv-cover__sq--c" aria-hidden="true" />
      <span className="pv-cover__sq pv-cover__sq--d" aria-hidden="true" />
      <span className="pv-cover__sq pv-cover__sq--e" aria-hidden="true" />

      <ProductsHeroCube className="pv-cover__cube" />

      <div className="pv-cover__whois">
        <Chip tone="ink" as="p" className="pv-chip pv-cover__chip">
          {"Whois\\\\"}
        </Chip>
        {PRODUCTS_INTRO.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </section>
  );
}
