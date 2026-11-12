/* CC.OS chapter (R3 M07/M08, rebuilt in OPUS CORR01 OC01-06/07 from FB_R4_5.svg
   y2809..3852 and STUDIO_resp3-1.svg y3753..4919).

   Title row (hex mark + underlined CC.OS), copy, the CC.OS globe (desktop only:
   the mobile original has none), the graph card (black 410 x 571.89, rx 16.44:
   the seven-node graph, then a light caption capsule) and the light "Read dev
   notes" chip. The external hairlines that tie this chapter to Build are
   StudioConnectors (desktop only).

   The graph is the original's: seven nested-hexagon nodes (outer / ring / core
   with three ticks), CCOS in the centre, INT above, SEC below, WRK and ARC
   upper left/right, BIZ and TME lower left/right, six spokes from CCOS. It
   appears in the fixed order CCOS, WRK, INT, ARC, TME, SEC, BIZ; each spoke
   draws with the node it reaches. */
import { useId } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router";
import { CcosGyro } from "./artworks";
import { CcosHexMark } from "./studioMarks";
import { CCOS_CAPTION, CCOS_COPY } from "../../data/studioApproach";
import { CCOS_GRAPH_ORDER, CCOS_GRAPH_STEP, index } from "../../motion/studioMotion";

type NodeName = (typeof CCOS_GRAPH_ORDER)[number];

/* FB_R4_5 node centres; hexagons are pointy-top: outer half-width 43 / half-
   height 49.65, ring 34.4 / 39.72, core 22.36 / 25.82 (CCOS core 28.58 / 32.76) */
const NODES: Record<NodeName, { x: number; y: number }> = {
  CCOS: { x: 1187, y: 3323.125 },
  WRK: { x: 1069.65, y: 3223.83 },
  INT: { x: 1187, y: 3175.83 },
  ARC: { x: 1304.35, y: 3223.83 },
  TME: { x: 1304.35, y: 3422.42 },
  SEC: { x: 1187, y: 3470.42 },
  BIZ: { x: 1069.65, y: 3422.42 },
};
/* spokes, verbatim: CCOS outer corner -> the neighbour's facing side */
const SPOKES: Partial<Record<NodeName, string>> = {
  WRK: "M1145 3299L1093.5 3260",
  INT: "M1187 3273.5V3225",
  ARC: "M1230 3299L1281.5 3260",
  TME: "M1230 3348L1281.5 3387",
  SEC: "M1187 3421V3372",
  BIZ: "M1145 3348L1093.5 3387",
};

const hex = (x: number, y: number, hw: number, hh: number) =>
  `M${x} ${y - hh}L${x + hw} ${y - hh / 2}V${y + hh / 2}L${x} ${y + hh}L${x - hw} ${y + hh / 2}V${y - hh / 2}Z`;

function GraphNode({ name }: { name: NodeName }) {
  const { x, y } = NODES[name];
  const hub = name === "CCOS";
  const core = hub ? { hw: 28.58, hh: 32.76 } : { hw: 22.36, hh: 25.82 };
  /* the three ticks join the ring hexagon's upper corners and lower vertex to
     the core's, so the core reads as a cube */
  const ticks = `M${x - 34.29} ${y - 19.83}L${x - core.hw + 0.54} ${y - core.hh / 2 + 0.12}M${x + core.hw - 0.55} ${y - core.hh / 2 + 0.3}L${x + 33.85} ${y - 19.56}M${x} ${y + core.hh - 0.24}V${y + 39.56}`;
  return (
    <g className="cg__node" style={index(CCOS_GRAPH_ORDER.indexOf(name))}>
      <path d={hex(x, y, 43, 49.65)} />
      <path d={hex(x, y, 34.4, 39.72)} />
      <path d={hex(x, y, core.hw, core.hh)} />
      <path className="cg__tick" d={ticks} />
      <text x={x} y={y + 6.47} textAnchor="middle">
        {name}
      </text>
    </g>
  );
}

function CcosGraph() {
  return (
    <svg
      className="cg"
      data-scene
      viewBox="994 3114.18 386 417.892"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      role="img"
      aria-label={`CC.OS system map: ${CCOS_GRAPH_ORDER[0]} at the centre, connected to ${CCOS_GRAPH_ORDER.slice(1).join(", ")}.`}
      style={{ "--cg-step": `${CCOS_GRAPH_STEP}s` } as CSSProperties}
    >
      {CCOS_GRAPH_ORDER.map((name) =>
        SPOKES[name] ? (
          <path
            key={`spoke-${name}`}
            className="cg__edge"
            d={SPOKES[name]}
            pathLength={1}
            style={index(CCOS_GRAPH_ORDER.indexOf(name))}
          />
        ) : null,
      )}
      {CCOS_GRAPH_ORDER.map((name) => (
        <GraphNode key={name} name={name} />
      ))}
    </svg>
  );
}

export function CcosScene({ reduced }: { reduced: boolean }) {
  const markId = `ccm-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <section className="cs" aria-labelledby="ccos-title" data-scene>
      <div className="cs__head" data-spawn style={index(0)}>
        <CcosHexMark id={markId} />
        <h2 className="cs__title" id="ccos-title">
          CC.OS
        </h2>
      </div>

      <p className="cs__copy" data-spawn style={index(1)}>
        {CCOS_COPY}
      </p>

      <div className="cs__globe-wrap" data-spawn style={index(2)}>
        <CcosGyro reduced={reduced} />
      </div>

      <div className="cs__card" data-spawn style={index(3)}>
        <div className="cs__art">
          <CcosGraph />
        </div>
        <p className="cs__caption">{CCOS_CAPTION}</p>
      </div>

      <Link className="cs__cta" to="/products/ccos" data-spawn style={index(4)}>
        Read dev notes <span aria-hidden="true">→</span>
      </Link>
      <span className="cs__sq" aria-hidden="true" />
    </section>
  );
}
