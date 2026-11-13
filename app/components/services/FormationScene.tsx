/* Services R1 CORR01 S4: Formation (SERVICES_v2 y2880..4160, replacing the R1
   "Next step" scene). The large underlined title, the copy and its link at the
   right, and the shared cube formation between four black cards:

     cards   Tailored formation / Keep up with advancements (left), Understanding
             LLMs / Toolmaking Workshops (right), each with its own figure and
             loop (cardArt.tsx). A card is a toggle button: it selects the
             formation (aria-pressed); Tab / Enter / Space as any button.
     pile    VoxelRain on the SERVICES_v2 pile (ink cubes with red edges, the
             drawn outline cubes as red "ghosts"). It falls in and settles the
             first time it is on screen, then dissolves and re-forms into the
             selected card's formation: gear, arrow, network, or the drawn
             cluster (Toolmaking, selected at first, as drawn).
     line    one connector, from the pile to the selected card; it grows
             (pathLength 1 + dashoffset, CSS) and the previous one retracts.
             The SVG covers the section exactly in SERVICES_v2 units
             (0..1536 x 2880..4160), so every coordinate is the export's.
     throw   (optional stretch, FORMATION_THROW) a mouse or pen can pick up a
             cube, drag it and throw it; it knocks others aside and everything
             springs back into the formation (VoxelRain). Pointer-only extra:
             the cards stay the keyboard path.
   Phones: the pile above a two-by-two card grid, no connectors; the pile takes
   no touches, so the page scrolls over it. */
import { useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { AdvanceArrowArt, GearMeshArt, NetworkArt, ToolmakingArt } from "./cardArt";
import { VoxelRain } from "./VoxelRain";
import { FORMATION_SHAPES } from "./voxelShapes";
import { FORMATION_CARDS, FORMATION_COPY, FORMATION_DEFAULT, FORMATION_LINK, FORMATION_THROW } from "../../data/servicesScenes";
import { index } from "../../motion/studioMotion";

/* pile edge -> card edge, one per card (card order) */
const LINKS = [
  "M491.3 3533H380.64",
  "M491.3 3712.8H430V3928.7H380.64",
  "M1033.7 3488.9H1120V3556.1H1207.36",
  "M1033.7 3794.5H1120V3898.6H1207.36",
];

export function FormationScene({ reduced }: { reduced: boolean }) {
  const [selected, setSelected] = useState(FORMATION_DEFAULT);

  const art: Record<(typeof FORMATION_CARDS)[number]["key"], ReactNode> = {
    gear: <GearMeshArt reduced={reduced} />,
    arrow: <AdvanceArrowArt reduced={reduced} />,
    network: <NetworkArt reduced={reduced} />,
    toolmaking: <ToolmakingArt reduced={reduced} />,
  };

  return (
    <section className="sv-fm" aria-labelledby="services-formation" data-scene>
      <h2 className="sv-fm__title" id="services-formation" data-spawn style={index(0)}>
        Formation
      </h2>
      <div className="sv-fm__intro" data-spawn style={index(1)}>
        <p className="sv-fm__copy">{FORMATION_COPY}</p>
        <Link className="sv-fm__link" to={FORMATION_LINK.to}>
          {FORMATION_LINK.label}
        </Link>
      </div>

      <div className="sv-fm__pile" aria-hidden="true">
        <VoxelRain
          shapes={FORMATION_SHAPES}
          active={selected}
          reduced={reduced}
          viewBox="390 3300 807 760"
          tone="pile"
          rain={460}
          enterDelay={0.4}
          throwable={FORMATION_THROW}
        />
      </div>

      <svg className="sv-fm__links" viewBox="0 2880 1536 1280" fill="none" aria-hidden="true" focusable="false">
        {LINKS.map((d, i) => (
          <path key={d} className="sv-fm__line" d={d} pathLength={1} data-active={selected === i} />
        ))}
      </svg>

      {FORMATION_THROW ? (
        <p className="sv-visually-hidden" id="services-formation-drag">
          With a mouse you can also drag and throw a cube of the formation; it returns to its place.
        </p>
      ) : null}
      <div
        className="sv-fm__cards"
        role="group"
        aria-label="Formation topics: choose one to reshape the cube formation"
        aria-describedby={FORMATION_THROW ? "services-formation-drag" : undefined}
      >
        {FORMATION_CARDS.map((card, i) => (
          <button
            key={card.key}
            type="button"
            className={`sv-fm__card sv-fm__card--${card.key}`}
            aria-pressed={selected === i}
            onClick={() => setSelected(i)}
            data-spawn
            style={index(i + 2)}
          >
            <span className="sv-fm__art" aria-hidden="true">
              {art[card.key]}
            </span>
            <span className="sv-fm__caption">{card.caption}</span>
          </button>
        ))}
      </div>
      <span className="sv-fm__sq" aria-hidden="true" />
    </section>
  );
}
