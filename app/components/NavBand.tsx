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
  /** only Studio is routed in this build; the rest are inert affordances */
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

  return (
    <li className={`band band--${slug}`}>
      {routed ? (
        <Link className="band__link" {...link("/studio")}>
          {inner}
        </Link>
      ) : (
        <span className="band__link" aria-disabled="true">
          {inner}
        </span>
      )}
    </li>
  );
}
