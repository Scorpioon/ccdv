import type { ReactNode } from "react";
import { useState } from "react";
import { Link } from "react-router";
import type { TransitionTarget } from "../../motion/transitionCoordinator";
import { useTransitionLink } from "../GlobalShell";
import { ContactMarkTile } from "../marks/ContactMarkTile";
import { ProductsMarkTile } from "../marks/ProductsMarkTile";
import { ServicesArrowTile } from "../marks/ServicesArrowTile";
import { StudioWheelTile } from "../marks/StudioWheelTile";
import { WorkPixelBlock } from "../work/WorkPixelBlock";

/* N5 BH1 (OPERATOR): the five section cards, in the order Studio, Services,
   Work, Products, Contact (NAV-T3). Each card is one link. Art is the existing
   tile for the section: Studio uses StudioWheelTile (the non-interactive
   sphere; StudioMobileOrbit takes pointer and key input, which would sit inside
   a link). The art and the one-liner are always in the DOM; CSS shows them on
   the open card only. */
type Slug = "studio" | "services" | "work" | "products" | "contact";
type Art = (props: { className?: string }) => ReactNode;

/* N5 BH1: provisional copy (OPERATOR review) */
const CARDS: { slug: Slug; label: string; to: TransitionTarget; line: string; Art: Art }[] = [
  { slug: "studio", label: "Studio", to: "/studio", line: "A brief overview on how we work.", Art: StudioWheelTile },
  { slug: "services", label: "Services", to: "/services", line: "What we build, and how we build it.", Art: ServicesArrowTile },
  { slug: "work", label: "Work", to: "/work", line: "Selected projects and the full archive.", Art: WorkPixelBlock },
  { slug: "products", label: "Products", to: "/products", line: "Tools and systems we make, CC.OS included.", Art: ProductsMarkTile },
  { slug: "contact", label: "Contact", to: "/contact", line: "Say hello, we read everything.", Art: ContactMarkTile },
];

export function HomeSections() {
  const link = useTransitionLink();
  /* N5 BH1 (OPERATOR): the open card. Set by hover (mouse and pen only, so a
     tap navigates without opening first) and by focus. It is not reset on
     leave, so the last card read stays open. */
  const [active, setActive] = useState<Slug>("studio");

  return (
    <nav aria-label="Sections">
      <ul className="hs">
        {CARDS.map(({ slug, label, to, line, Art }) => (
          <li
            key={slug}
            className={`hs__card hs__card--${slug}`}
            data-open={active === slug || undefined}
            onPointerEnter={(event) => {
              if (event.pointerType !== "touch") setActive(slug);
            }}
          >
            <Link id={`home-card-${slug}`} className="hs__link" {...link(to)} onFocus={() => setActive(slug)}>
              <span className="hs__stripe" aria-hidden="true" />
              <span className="hs__body">
                <span className="hs__art" aria-hidden="true">
                  <Art className="hs__tile" />
                </span>
                <span className="hs__label-card">
                  <span className="hs__label">:{label}</span>
                  <span className="hs__line">{line}</span>
                  <span className="hs__square hs__square--outline" aria-hidden="true" />
                  <span className="hs__square hs__square--filled" aria-hidden="true" />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
