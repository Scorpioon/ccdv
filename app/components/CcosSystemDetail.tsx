import type { CSSProperties } from "react";
import { Link } from "react-router";
import { GearMark } from "./marks/GearMark";
import { CcdvPixelMark } from "./marks/CcdvPixelMark";
import { HexCube } from "./marks/HexCube";
import { CcosSystemRail } from "./CcosSystemRail";
import type { CcosSystemData } from "../data/ccosSystems";

/* Shared template for the six CCOS subsystem leaf pages (GF08-C2). Reuses
   the accepted GF08-B hub's own header/hero/rail markup and CSS classes
   unchanged (`.ccos-hub__*`, `.ccos-rail*` — zero edits to those rules, so
   `CcosHub`'s own accepted instance is unaffected) for the chrome that is
   genuinely identical across hub and all six leaves (confirmed against
   every PNG). Only what actually differs per leaf — the per-system tint,
   the variable-height overview/body panels, and the accent stripe/lists —
   gets new, additively-scoped `.ccos-sysdetail__*` classes (global.css),
   so none of it can regress `CcosDetailPanel`'s own accepted `PCC-013`
   toggle/height behaviour on the hub.

   Leaf pages render permanently expanded (no local collapse/expand state):
   the title-strip `collapse` control is a `Link` back to `/products/ccos`
   (CLAUDE.md §8 / OPERATOR-approved plain route navigation), not a toggle. */

const HERO_ICON_OUTER = "#202020";
const HERO_ICON_LINE = "#D9D9D9";
const OVERVIEW_ICON_OUTER = "#D9D9D9";
const OVERVIEW_ICON_MIDDLE = "#202020";

export function CcosSystemDetail({ system }: { system: CcosSystemData }) {
  const style = {
    "--ccos-sys-color": system.themeColor,
    "--ccos-sys-text": system.heroTextColor,
    "--ccos-body-units": system.bodyHeightUnits,
    "--ccos-overview-units": system.overviewHeightUnits,
  } as CSSProperties;

  const stripeClassName = system.accentPanels
    ? "section--stripe ccos-sysdetail__stripe--accent"
    : "section--stripe section--stripe--light";
  const listsClassName = system.accentPanels
    ? "section ccos-detail__lists ccos-sysdetail__lists--accent"
    : "section ccos-detail__lists";

  return (
    <div className="ccos-sysdetail" style={style}>
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

      <section className="ccos-hub__hero" aria-labelledby={`ccos-${system.id}-hero-title`}>
        <HexCube
          className="ccos-hub__hero-icon"
          variant="solid"
          gradientFrom="#FFFFFF"
          gradientTo={system.themeColor}
          outerFill={HERO_ICON_OUTER}
          lineColor={HERO_ICON_LINE}
        />
        <h2 className="ccos-hub__wordmark" id={`ccos-${system.id}-hero-title`}>
          CC.OS
        </h2>
        <p className="ccos-hub__intro">
          Collapse Creative OS sits at the center of our daily operations. Together with WrkOps and
          other core systems we operate and create our own projects, tools and client work.
        </p>
        <span className="ccos-hub__chevron" aria-hidden="true">
          v
        </span>

        <CcosSystemRail activeId={system.id} />
        <p className="ccos-hub__rail-caption">
          {system.name} {system.railVersionDisplay}
        </p>
      </section>

      <div className="ccos-detail">
        <div className="section section--stripe ccos-detail__lead-stripe" />

        <section className="section section--hero ccos-detail__strip">
          <h2 className="ccos-detail__wordmark">⌈{system.name}⌉</h2>
          <span className="ccos-detail__version">{system.stripVersion}</span>
          <Link
            to="/products/ccos"
            className="ccos-detail__toggle"
            aria-label={`Collapse ${system.name} detail, return to CCOS`}
          >
            collapse
          </Link>
        </section>

        <div className="ccos-sysdetail__body">
          <section className="section ccos-sysdetail__overview">
            <p className="ccos-detail__overview-statement">{system.overviewStatement}</p>
            <ul className="ccos-detail__overview-list">
              {system.overviewLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <HexCube
              className="ccos-detail__overview-icon"
              variant="ring"
              gradientFrom="#D4D4D4"
              gradientTo={system.themeColor}
              outerFill={OVERVIEW_ICON_OUTER}
              middleFill={OVERVIEW_ICON_MIDDLE}
              lineColor="#D9D9D9"
            />
          </section>

          <div className={stripeClassName} />

          <section className="section ccos-detail__columns">
            {system.columns.map((column) => (
              <div className="ccos-detail__column" key={column.heading}>
                <p className="ccos-detail__column-heading">{column.heading}</p>
                <p className="ccos-detail__column-body">{column.body}</p>
              </div>
            ))}
          </section>

          <div className="section--stripe section--stripe--light" />

          <section className={listsClassName}>
            <div className="ccos-detail__list">
              <p className="ccos-detail__column-heading">{system.featuresHeading}</p>
              <ul>
                {system.features.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="ccos-detail__list">
              <p className="ccos-detail__column-heading">[ Roadmap ]</p>
              <ul>
                {system.roadmap.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
