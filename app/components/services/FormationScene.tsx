/* Services R1 CORR01 S4: Formation (SERVICES_v2 y2880..4160, replacing the R1
   "Next step" scene). The large underlined title, the copy and its link at the
   right, and the shared cube formation between four black cards:

     cards   Tailored formation / Keep up with advancements (left), Understanding
             LLMs / Toolmaking Workshops (right), each with its own figure and
             loop (cardArt.tsx). A card is a toggle button: it selects the
             formation (aria-pressed); Tab / Enter / Space as any button.
     pile    VoxelRain (morph) on the SERVICES_v2 pile: always ONE figure of
             the same 15 cubes (ink cubes with red edges, the four drawn
             outline cubes as red "ghosts"). It rains in once, the first time
             it is on screen, then stays still; a card scrambles the same
             cubes into that card's arrangement (voxelShapes.ts), spread over
             the background and leaning toward the card, passing behind the
             side cards. Toolmaking (selected at first) is the drawn cluster.
     line    one tether, from the corner of the figure's cube nearest the
             selected card, drawn along the cubes' own angles (a vertical run,
             then the 30 deg edge direction) into the card; it grows once the
             scramble has landed (pathLength 1 + dashoffset, CSS) and the
             previous one retracts. The figure's SVG covers the section
             exactly in SERVICES_v2 units (0..1536 x 2880..4160), under the
             cards and the text, so every coordinate is the export's.
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
import { CUBE_CORNERS, FORMATION_SHAPES } from "./voxelShapes";
import type { VoxelShape } from "./voxelShapes";
import { FORMATION_CARDS, FORMATION_COPY, FORMATION_DEFAULT, FORMATION_LINK, FORMATION_THROW } from "../../data/servicesScenes";
import { index } from "../../motion/studioMotion";

/* the four cards in SERVICES_v2 units (x, y, w, h), card order */
const CARD_RECTS = [
  [77, 3396.9, 303.644, 275.219],
  [77, 3799.58, 303.644, 258.219],
  [1207.36, 3396.9, 303.644, 318.451],
  [1207.36, 3739.35, 303.644, 318.451],
] as const;
const ISO = 21.427 / 37.373; // the cube edges' slope (30 deg isometric)
const CLEAR = 24; // a cube corner closer than this to the card is behind it

/* the tether from `shape` to card `card`: from the outer corner of the cube
   nearest the card, a vertical run (if needed) then the edge-direction
   diagonal, ending at the card's edge, level with its middle */
function tether(shape: VoxelShape, card: number) {
  const [cx, cy, cw, ch] = CARD_RECTS[card];
  const left = cx < 768;
  const upper = card === 0 || card === 2;
  const edge = left ? cx + cw : cx;
  const mid = cy + ch / 2;
  let best: { x: number; y: number; gap: number; dist: number } | null = null;
  for (const c of shape) {
    const x = c.x + (left ? CUBE_CORNERS.left : CUBE_CORNERS.right) * c.s;
    const y = c.y + (upper ? CUBE_CORNERS.upper : CUBE_CORNERS.lower) * c.s;
    const gap = left ? x - edge : edge - x;
    if (gap < CLEAR) continue;
    const dist = Math.hypot(gap, y - mid);
    if (!best || dist < best.dist) best = { x, y, gap, dist };
  }
  if (!best) return "";
  const rise = best.gap * ISO;
  const want = mid - best.y;
  let sign = want === 0 ? -1 : Math.sign(want);
  const run = Math.max(0, Math.abs(want) - rise);
  let end = best.y + sign * (run + rise);
  /* a short way: the diagonal alone; keep it on the card, else turn it */
  if (!run && (end < cy + CLEAR || end > cy + ch - CLEAR)) {
    sign = -sign;
    end = best.y + sign * rise;
  }
  const y1 = best.y + sign * run;
  return `M${best.x.toFixed(2)} ${best.y.toFixed(2)}V${y1.toFixed(2)}L${edge} ${end.toFixed(2)}`;
}
const TETHERS = FORMATION_SHAPES.map((shape, card) => tether(shape, card));

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
          viewBox="0 2880 1536 1280"
          tone="pile"
          rain={460}
          enterDelay={0.4}
          throwable={FORMATION_THROW}
          morph
        >
          <g className="sv-fm__tethers">
            {TETHERS.map((d, i) => (
              <path key={i} className="sv-fm__line" d={d} pathLength={1} data-active={selected === i} />
            ))}
          </g>
        </VoxelRain>
      </div>

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
