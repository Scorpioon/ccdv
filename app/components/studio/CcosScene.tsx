/* CC.OS chapter (R3 M07/M08): a connected systems scene on the lilac ground.
   Title block, copy, the large cube/axis/ring sphere (the Build gyro, moved
   here), the seven-node graph card and the dev-notes link. The structural lines
   are CSS hairlines hung on the sphere and the card (global.css, `.cs__*`), so
   they follow the layout instead of floating as decoration. */
import { Link } from "react-router";
import { HexCube } from "../marks/HexCube";
import { BuildGyro, LILAC, STROKE } from "./artworks";
import { CCOS_COPY } from "../../data/studioApproach";
import { CCOS_GRAPH_ORDER, CCOS_GRAPH_STEP, index } from "../../motion/studioMotion";
import type { CSSProperties } from "react";

/* Graph card artboard 300 x 440: CCOS at the centre, the six systems on a
   hexagon, clockwise from the top. Reveal order is CCOS_GRAPH_ORDER. */
const NODES: Record<(typeof CCOS_GRAPH_ORDER)[number], { x: number; y: number; side: "t" | "r" | "b" | "l" }> = {
  CCOS: { x: 150, y: 220, side: "b" },
  WRK: { x: 150, y: 64, side: "t" },
  INT: { x: 243, y: 142, side: "r" },
  ARC: { x: 243, y: 298, side: "r" },
  TME: { x: 150, y: 376, side: "b" },
  SEC: { x: 57, y: 298, side: "l" },
  BIZ: { x: 57, y: 142, side: "l" },
};
const RING = CCOS_GRAPH_ORDER.slice(1);

function CcosGraph() {
  const at = (name: (typeof CCOS_GRAPH_ORDER)[number]) => CCOS_GRAPH_ORDER.indexOf(name);
  const label = (name: (typeof CCOS_GRAPH_ORDER)[number]) => {
    const n = NODES[name];
    if (n.side === "t") return { x: n.x, y: n.y - 18, anchor: "middle" as const };
    if (n.side === "b") return { x: n.x, y: n.y + 26, anchor: "middle" as const };
    if (n.side === "r") return { x: n.x - 0, y: n.y - 18, anchor: "middle" as const };
    return { x: n.x, y: n.y - 18, anchor: "middle" as const };
  };
  return (
    <div className="cg" data-scene style={{ "--cg-step": `${CCOS_GRAPH_STEP}s` } as CSSProperties}>
      <svg
        className="cg__svg"
        viewBox="0 0 300 440"
        fill="none"
        role="img"
        aria-label={`CC.OS system map: ${CCOS_GRAPH_ORDER[0]} connected to ${RING.join(", ")}.`}
      >
        {/* spokes: centre to each system, drawn as its node appears */}
        {RING.map((name) => (
          <line
            key={`spoke-${name}`}
            className="cg__edge"
            style={index(at(name))}
            pathLength={1}
            x1={NODES.CCOS.x}
            y1={NODES.CCOS.y}
            x2={NODES[name].x}
            y2={NODES[name].y}
          />
        ))}
        {/* ring: each system to the next, the last closing back to the first */}
        {RING.map((name, i) => {
          const next = RING[(i + 1) % RING.length];
          return (
            <line
              key={`ring-${name}`}
              className="cg__edge cg__edge--ring"
              style={index(at(i === RING.length - 1 ? name : next))}
              pathLength={1}
              x1={NODES[name].x}
              y1={NODES[name].y}
              x2={NODES[next].x}
              y2={NODES[next].y}
            />
          );
        })}
        {CCOS_GRAPH_ORDER.map((name) => {
          const n = NODES[name];
          const l = label(name);
          const hub = name === "CCOS";
          return (
            <g key={name} className="cg__node" data-hub={hub} style={index(at(name))}>
              <rect x={n.x - (hub ? 9 : 6)} y={n.y - (hub ? 9 : 6)} width={hub ? 18 : 12} height={hub ? 18 : 12} />
              <text x={l.x} y={l.y} textAnchor={l.anchor}>
                {name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function CcosScene({ reduced }: { reduced: boolean }) {
  return (
    <section className="cs" aria-labelledby="ccos-title" data-scene>
      <div className="cs__head" data-spawn style={index(0)}>
        <HexCube
          className="studio-hex cs__cube"
          variant="solid"
          gradientFrom="#FFFFFF"
          gradientTo={LILAC}
          lineColor="#D9D9D9"
          outerFill="#1A1A1A"
          lineWidth={STROKE}
        />
        <h2 className="cs__title" id="ccos-title">
          CC.OS
        </h2>
      </div>

      <div className="cs__copy">
        {CCOS_COPY.map((text, i) => (
          <p key={text} data-spawn style={index(i + 1)}>
            {text}
          </p>
        ))}
      </div>

      <div className="cs__sphere" data-spawn style={index(2)}>
        <BuildGyro reduced={reduced} tight />
      </div>

      <div className="cs__card" data-spawn style={index(3)}>
        <CcosGraph />
      </div>

      <Link className="ccos__action cs__cta" to="/products/ccos" data-spawn style={index(4)}>
        Read dev notes <span aria-hidden="true">→</span>
      </Link>
    </section>
  );
}
