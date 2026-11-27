import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { useIsPresent } from "motion/react";
import { Link } from "react-router";
import { indexGrids } from "../../data/servicesVoxels";
import type { TransitionTarget } from "../../motion/transitionCoordinator";
import { useMotionPolicy } from "../../motion/reducedMotion";
import { useTransitionLink } from "../GlobalShell";
import { ContactMarkTile } from "../marks/ContactMarkTile";
import { GearMark } from "../marks/GearMark";
import { ProductsMarkTile } from "../marks/ProductsMarkTile";
import { StudioWheelTile } from "../marks/StudioWheelTile";
import { RubikCube } from "../services/RubikCube";

/* N5 BH1 (OPERATOR): the five section cards, in the order Studio, Services,
   Work, Products, Contact (NAV-T3). Each card is one link. Art is the existing
   tile for the section: Studio uses StudioWheelTile (the non-interactive
   sphere; StudioMobileOrbit takes pointer and key input, which would sit inside
   a link). The art and the one-liner are always in the DOM; CSS shows them on
   the open card only.

   Round 2: Services art is the Rubik cube at rest (not interactive, the card is
   a link); Work art is the gear mark. */
type Slug = "studio" | "services" | "work" | "products" | "contact";
type Art = (props: { className?: string }) => ReactNode;

const HOME_GRIDS = indexGrids("strategy");
const HOME_CUBE_REST = { rx: 0.3, ry: -0.4 };

function ServicesCubeTile({ className }: { className?: string }) {
  const { reduced } = useMotionPolicy();
  return (
    <span className={className}>
      <RubikCube
        front={HOME_GRIDS[0]}
        top={HOME_GRIDS[1]}
        right={HOME_GRIDS[2]}
        category={0}
        reduced={reduced}
        rest={HOME_CUBE_REST}
        interactive={false}
      />
    </span>
  );
}

function WorkGearTile({ className }: { className?: string }) {
  return <GearMark className={`${className ?? ""} hs__tile--gear`} fill="none" dotFill="none" />;
}

/* N5 BH1: provisional copy (OPERATOR review) */
const CARDS: { slug: Slug; label: string; to: TransitionTarget; line: string; Art: Art }[] = [
  { slug: "studio", label: "Studio", to: "/studio", line: "A brief overview on how we work.", Art: StudioWheelTile },
  { slug: "services", label: "Services", to: "/services", line: "What we build, and how we build it.", Art: ServicesCubeTile },
  { slug: "work", label: "Work", to: "/work", line: "Selected projects and the full archive.", Art: WorkGearTile },
  { slug: "products", label: "Products", to: "/products", line: "Tools and systems we make, CC.OS included.", Art: ProductsMarkTile },
  { slug: "contact", label: "Contact", to: "/contact", line: "Say hello, we read everything.", Art: ContactMarkTile },
];

export function HomeSections() {
  const link = useTransitionLink();
  /* N5 BH1 (OPERATOR): the open card. Set by hover (mouse and pen only, so a
     tap navigates without opening first) and by focus. Nothing is open at rest.
     Leaving the list returns to the focused card (if any), else closes all. */
  const [active, setActive] = useState<Slug | null>(null);
  const focused = useRef<Slug | null>(null);
  /* R3 S4: a page that is leaving (popped, fading out) must not collapse its open
     card: pointer-leave and blur fire as the pointer moves to the bar / link,
     and the label snapped back (":contact" flash) while the page was exiting */
  const present = useIsPresent();

  return (
    <nav aria-label="Sections">
      <ul
        className="hs"
        onPointerLeave={() => {
          if (!present) return;
          setActive(focused.current);
        }}
        onBlur={(e) => {
          if (!present) return;
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            focused.current = null;
            setActive(null);
          }
        }}
      >
        {CARDS.map(({ slug, label, to, line, Art }) => (
          <li
            key={slug}
            className={`hs__card hs__card--${slug}`}
            data-open={active === slug || undefined}
            onPointerEnter={(event) => {
              if (event.pointerType !== "touch") setActive(slug);
            }}
          >
            <Link
              id={`home-card-${slug}`}
              className="hs__link"
              {...link(to)}
              onFocus={() => {
                focused.current = slug;
                setActive(slug);
              }}
            >
              <span className="hs__stripe" aria-hidden="true">
                <span className="hs__square hs__square--filled" aria-hidden="true" />
              </span>
              <span className="hs__body">
                <span className="hs__art" aria-hidden="true">
                  <Art className="hs__tile" />
                </span>
                <span className="hs__label-card">
                  <span className="hs__label">:{label}</span>
                  <span className="hs__line">{line}</span>
                  <span className="hs__square hs__square--outline" aria-hidden="true" />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
