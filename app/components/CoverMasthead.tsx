/* A8 (OPERATOR): Masthead V3 (work_assets/New Masthead V3.svg, 1344 x 191).
   One light card at the top of the Studio, Services and Products covers,
   replacing the R3 identity lockup, its `collapse` label and the two loose
   squares beside it: the gear and the inline pixel mark, `:<page>`
   underlined, the two meta lines, `collapse` (a link Home, as before) and
   two squares. Desktop draws it in the card's 1344 grid (global.css, `.cmh`),
   48u from the frame's edges and widened by the spread (--gx); phones and
   tablets re-flow it inside the 390 column. The card spawns first, as the
   lockup did; the page's heading stays the route's own h1. */
import { Link } from "react-router";
import { useRouteArrival, useTransitionLink } from "./GlobalShell";
import { GearMark } from "./marks/GearMark";
import { CcdvPixelMark } from "./marks/CcdvPixelMark";
import { index } from "../motion/studioMotion";
import { TITLE_PREFIX, useRetype } from "../motion/retype";
import { useMotionPolicy } from "../motion/reducedMotion";
import { useIsPresent } from "motion/react";

const INK = "#141414";
const LIGHT = "#F2F2F2";

export function CoverMasthead({ page }: { page: string }) {
  const link = useTransitionLink();
  const arrival = useRouteArrival();
  const { reduced } = useMotionPolicy();
  const present = useIsPresent();
  const full = TITLE_PREFIX + page;
  const shown = useRetype(full, { mode: arrival.kind, reduced, active: present });
  return (
    <div
      className="cmh"
      data-spawn={arrival.kind === "carry" ? undefined : true}
      data-enter={arrival.side ?? undefined}
      data-typing={shown !== full || undefined}
      style={index(0)}
    >
      <GearMark className="cmh__gear" fill={INK} dotFill={LIGHT} />
      <CcdvPixelMark variant="inline" className="cmh__pixel" fill={INK} />
      <p className="cmh__title">
        <span aria-hidden="true">{shown}</span>
        <span className="cmh__sr">{full}</span>
      </p>
      <div className="cmh__meta">
        <div>[ COLLAPSE CREATIVE : DEV UNIT ]</div>
        <div>[ hello[@]collapsecreative.com ]</div>
      </div>
      <Link className="cmh__label" aria-label="collapse — back to Home" {...link("/")}>
        collapse
      </Link>
      <span className="cmh__sq cmh__sq--a" aria-hidden="true" />
      <span className="cmh__sq cmh__sq--b" aria-hidden="true" />
    </div>
  );
}
