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
  /** Studio, Work, Services, Products and Contact are all routed in this build */
  routed?: boolean;
}

export function NavBand({ slug, label, suffix, suffixLeft, routed = false }: NavBandProps) {
  const link = useTransitionLink();

  const inner = (
    <>
      <span className="band__stripe" />
      <span className="band__body">
        <span className="band__label">{label}</span>
        <span className="band__suffix" style={{ left: `calc(${suffixLeft} * var(--u))` }}>
          {suffix}
        </span>
        <span className="band__chevron" aria-hidden="true">
          v
        </span>
      </span>
    </>
  );

  // Studio keeps the motion-coordinated link `go()` already knows how to
  // animate (its TransitionTarget union is deliberately narrow — see
  // transitionCoordinator.ts, untouched by GF08-A). Work and Services are
  // plain route links: GF09 owns extending page-transition choreography
  // beyond Home<->Studio, not this movement.
  return (
    <li className={`band band--${slug}`}>
      {routed ? (
        slug === "studio" ? (
          <Link className="band__link" id={`band-link-${slug}`} {...link("/studio")}>
            {inner}
          </Link>
        ) : (
          <Link className="band__link" id={`band-link-${slug}`} to={`/${slug}`}>
            {inner}
          </Link>
        )
      ) : (
        <span className="band__link" aria-disabled="true">
          {inner}
        </span>
      )}
    </li>
  );
}
