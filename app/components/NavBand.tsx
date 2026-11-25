import { Link } from "react-router";
import { useTransitionLink } from "./GlobalShell";

/* One Home navigation band: a 31 colour stripe over a 177 body carrying an
   oversized bracketed label and a small emoticon. The label deliberately
   overruns the body — see the paint-order note in global.css.

   `suffixLeft` is the emoticon's x on the 1440 artboard, taken per band from
   the reference rather than derived, because each emoticon's first glyph has
   a different left bearing. */

export interface NavBandProps {
  slug: "studio" | "work" | "services" | "products" | "contact";
  label: string;
  suffix: string;
  suffixLeft: number;
}

/* the bands whose route rises out of Home (NAV-T3; Products V2 P1b) */
const SCENE_TARGET = { studio: "/studio", services: "/services", products: "/products" } as const;

export function NavBand({ slug, label, suffix, suffixLeft }: NavBandProps) {
  const link = useTransitionLink();

  const inner = (
    <>
      <span className="band__stripe" />
      <span className="band__body">
        <span className="band__label">{label}</span>
        {/* N4 P-I B-17: the emoticon is decoration, not part of the link's name */}
        <span className="band__suffix" aria-hidden="true" style={{ left: `calc(${suffixLeft} * var(--u))` }}>
          {suffix}
        </span>
        <span className="band__chevron" aria-hidden="true">
          v
        </span>
      </span>
    </>
  );

  // Studio, Services and Products go through the transition coordinator (its
  // TransitionTarget union is deliberately narrow — see
  // transitionCoordinator.ts); Work and Contact are plain route links. N4 P-I
  // A-07: every band routes, so the unrouted span branch is gone.
  return (
    <li className={`band band--${slug}`}>
      {slug === "studio" || slug === "services" || slug === "products" ? (
        // NAV-T3: Services rises out of Home like Studio; Products V2 P1b too
        <Link className="band__link" id={`band-link-${slug}`} {...link(SCENE_TARGET[slug])}>
          {inner}
        </Link>
      ) : (
        <Link className="band__link" id={`band-link-${slug}`} to={`/${slug}`}>
          {inner}
        </Link>
      )}
    </li>
  );
}
