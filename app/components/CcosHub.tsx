import { Link } from "react-router";
import { GearMark } from "./marks/GearMark";
import { CcdvPixelMark } from "./marks/CcdvPixelMark";
import { CcosHeroIcon } from "./marks/CcosArtwork";
import { CcosSystemRail } from "./CcosSystemRail";
import { CcosDetailPanel } from "./CcosDetailPanel";

/* CCOS hub (`/products/ccos`, `pages_products_ccos.png`, 1440x2968).

   The header here is NOT SiteMasthead: R1.1 gives this page its own
   two-line underlined title and brand/contact metadata instead of the
   five-cell section nav every other interior page shares (confirmed
   against the page's own SVG — no cell geometry present), so it is built
   directly rather than widening SiteMasthead with a sixth, structurally
   different variant. The gear/CCDV lockup is the one shared identity mark,
   reused at this page's own scale; clicking it returns Home, the one
   behaviour already approved globally for this mark (`HDR-001`/global
   logo-to-Home rule) — a plain `Link`, not the transition-coordinated one,
   for the same reason NavBand/SiteFooter use plain links for Work/Services:
   the coordinator's `TransitionTarget` union stays `"/" | "/studio"` only.

   `PCC-006`'s top-right `collapse` is visually present but intentionally
   inert — its behaviour is explicitly undecided and distinct from
   `PCC-013`'s own collapse inside CcosDetailPanel (`PCC-DEC-002`). */

export function CcosHub() {
  return (
    <div className="ccos-hub">
      <header className="ccos-hub__header">
        <Link to="/" className="ccos-hub__mark" aria-label="CCDV — Home">
          <GearMark className="ccos-hub__gear" fill="#D9D9D9" dotFill="#202020" />
          <CcdvPixelMark variant="stack" className="ccos-hub__pixel" fill="#D9D9D9" />
        </Link>

        <h1 className="ccos-hub__title">
          <span>Collapse Creative</span>
          <span>Operating System</span>
        </h1>

        <div className="ccos-hub__meta">
          <div>[ COLLAPSE CREATIVE : DEV UNIT ]</div>
          <div>[ hello[@]collapsecreative.com ]</div>
          <div>
            [ Part of <a href="https://collapsecreative.com">collapsecreative.com</a> ]
          </div>
        </div>

        <span className="ccos-hub__watermark" aria-hidden="true">
          collapse
        </span>
        <span className="ccos-hub__dot ccos-hub__dot--a" aria-hidden="true" />
        <span className="ccos-hub__dot ccos-hub__dot--b" aria-hidden="true" />
        <span className="ccos-hub__dot ccos-hub__dot--c" aria-hidden="true" />
      </header>

      <section className="ccos-hub__hero" aria-labelledby="ccos-hero-title">
        <CcosHeroIcon className="ccos-hub__hero-icon" />
        <h2 className="ccos-hub__wordmark" id="ccos-hero-title">
          CC.OS
        </h2>
        <p className="ccos-hub__intro">
          Collapse Creative OS sits at the center of our daily operations. Together with WrkOps and
          other core systems we operate and create our own projects, tools and client work.
        </p>
        <span className="ccos-hub__chevron" aria-hidden="true">
          v
        </span>

        <CcosSystemRail />
        <p className="ccos-hub__rail-caption">CC.OS [0.3.0]</p>
      </section>

      <CcosDetailPanel />
    </div>
  );
}
