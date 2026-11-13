/* Services R1 CORR01 S4: Formation (SERVICES_v2 y2880..4160, replacing the R1
   "Next step" scene). The large underlined title, the copy and its link at the
   right, and the shared cube formation between four black cards:

     cards   Tailored formation / Keep up with advancements (left), Understanding
             LLMs / Toolmaking Workshops (right), each with its own figure and
             loop (cardArt.tsx). A card is a toggle button: it selects the
             formation (aria-pressed); Tab / Enter / Space as any button.
     pile    VoxelRain (rain; round 3) between the OPERATOR's voxel drawings
             (voxelShapes.ts): the gear, the arrow, the LLM network (with its
             wires) and the drawn SERVICES_v2 cluster (Toolmaking, selected at
             first), each centred between the cards; ink cubes with red edges,
             red cubes as the red "ghosts". It rains in the first time it is
             on screen; a card dissolves the figure and rains in its own.
     line    one tether, from the corner of the figure's cube nearest the
             selected card, drawn along the cubes' own angles (a vertical run,
             then the 30 deg edge direction) into the card; it grows once the
             rain has landed (pathLength 1 + dashoffset, CSS) and the
             previous one retracts. The figure's SVG covers the section
             in SERVICES_v2 units (0..1536 x 2880..4160), under the cards and
             the text, and draws past its edges (overflow visible); with the
             columns spread (useFrameSpread) the tether ends at the moved card.
     wires   the LLM drawing's wires, under its cubes, drawn in once it has
             landed while Understanding LLMs is selected.
     throw   (optional stretch, FORMATION_THROW) a mouse or pen can pick up a
             cube, drag it and throw it; it knocks others aside and everything
             springs back into the formation (VoxelRain). Pointer-only extra:
             the cards stay the keyboard path.
   Phones: the pile above a two-by-two card grid, no connectors; the pile takes
   no touches, so the page scrolls over it. */
import { useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router";
import { AdvanceArrowArt, GearMeshArt, NetworkArt, ToolmakingArt } from "./cardArt";
import { VoxelRain } from "./VoxelRain";
import { CUBE_CORNERS, FORMATION_SHAPES, FORMATION_WIRED, LLM_WIRES } from "./voxelShapes";
import type { VoxelShape } from "./voxelShapes";
import { FORMATION_CARDS, FORMATION_COPY, FORMATION_DEFAULT, FORMATION_LINK, FORMATION_THROW } from "../../data/servicesScenes";
import { useFrameSpread } from "../../motion/frameSpread";
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
   diagonal, ending at the card's edge, level with its middle. Round 3: `g` is
   the column spread in SERVICES_v2 units (the left cards move left by it, the
   right cards right; the figure stays centred) */
function tether(shape: VoxelShape, card: number, g: number) {
  const [x0, cy, cw, ch] = CARD_RECTS[card];
  const left = x0 < 768;
  const cx = left ? x0 - g : x0 + g;
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
  const sign = Math.sign(want);
  const start = `M${best.x.toFixed(2)} ${best.y.toFixed(2)}`;
  if (rise <= Math.abs(want)) {
    /* a vertical run, then the full diagonal into the card's middle */
    const y1 = mid - sign * rise;
    return `${start}V${y1.toFixed(2)}L${edge} ${mid.toFixed(2)}`;
  }
  /* round 3: a wide gap (spread columns) would carry the diagonal past the
     card, so it climbs only to the card's middle, then runs level into it */
  const x1 = best.x + (left ? -1 : 1) * (Math.abs(want) / ISO);
  return `${start}L${x1.toFixed(2)} ${mid.toFixed(2)}H${edge}`;
}

export function FormationScene({ reduced }: { reduced: boolean }) {
  const [selected, setSelected] = useState(FORMATION_DEFAULT);
  const pileRef = useRef<HTMLDivElement>(null);
  const g = useFrameSpread(pileRef, 1536);
  const tethers = useMemo(() => FORMATION_SHAPES.map((shape, card) => tether(shape, card, g)), [g]);

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

      <div className="sv-fm__pile" ref={pileRef} aria-hidden="true">
        <VoxelRain
          shapes={FORMATION_SHAPES}
          active={selected}
          reduced={reduced}
          viewBox="0 2880 1536 1280"
          tone="pile"
          rain={460}
          enterDelay={0.4}
          throwable={FORMATION_THROW}
        >
          <g className="sv-fm__wires" data-active={selected === FORMATION_WIRED}>
            {LLM_WIRES.map((d, i) => (
              <path key={i} className="sv-fm__wire" d={d} pathLength={1} style={{ "--i": i } as CSSProperties} />
            ))}
          </g>
          <g className="sv-fm__tethers">
            {tethers.map((d, i) => (
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
