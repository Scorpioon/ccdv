import { useId } from "react";
import { CCOS_CORES, type CcosCoreId } from "../../data/ccosContent";

/* The core map (P2, PRODUCTS/CCOS.svg y1605..2094.89, the 684 x 489.892 box,
   re-based to 0,0). Seven pointy-top hexagons (half-width 43, rings 1 / 0.8 /
   0.52 as HexCube's; CCOS's inner ring 0.665 to hold its label) on the
   source centres, joined to CCOS by 0.5 lines.

   OPERATOR: every core starts as a diagram; the selected one (CCOS on load)
   is drawn as the source's solid cube — light outer hexagon, ink middle ring,
   a white-to-core-colour face and the Y — and the panel beside the map shows
   it. The others are the source's thin triple outline with their label. Both
   looks are always drawn and cross-fade (CSS). Each hexagon is a real button
   laid over the drawing (same centres, in % of the box), so selection works
   by pointer, keyboard and assistive tech. */

const A = 43; // half-width
const R = A / Math.cos(Math.PI / 6); // circumradius, 49.65

const CENTRES: Record<CcosCoreId, [number, number]> = {
  ccos: [342, 244.95],
  wrkops: [224.65, 145.57],
  kaia: [342.08, 97.65],
  aethernos: [459.43, 145.65],
  kron: [459.35, 344.24],
  panoptes: [342, 392.24],
  kairon: [224.65, 344.24],
};

/* source lines from CCOS's edges to each core */
const LINKS = [
  "M300 220.82L248.5 181.82",
  "M300 269.82L248.5 308.82",
  "M385 220.82L436.5 181.82",
  "M385 269.82L436.5 308.82",
  "M342 195.32V146.82",
  "M342 342.82V293.82",
];

const VIEW_W = 684;
const VIEW_H = 489.892;

function vertex(cx: number, cy: number, r: number, k: number): [number, number] {
  const angle = (Math.PI / 3) * k - Math.PI / 2;
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

function hex(cx: number, cy: number, r: number) {
  const points = Array.from({ length: 6 }, (_, k) => vertex(cx, cy, r, k).map((n) => n.toFixed(2)).join(" "));
  return `M${points.join("L")}Z`;
}

/* the Y: centre to the upper-left, upper-right and bottom vertices */
function wye(cx: number, cy: number, from: number, to: number) {
  return [5, 1, 3]
    .map((k) => {
      const [x1, y1] = from === 0 ? [cx, cy] : vertex(cx, cy, from, k);
      const [x2, y2] = vertex(cx, cy, to, k);
      return `M${x1.toFixed(2)} ${y1.toFixed(2)}L${x2.toFixed(2)} ${y2.toFixed(2)}`;
    })
    .join("");
}

export function CcosCoreMap({
  selected,
  onSelect,
  labelledBy,
}: {
  selected: CcosCoreId;
  onSelect: (id: CcosCoreId) => void;
  labelledBy: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");

  return (
    <div className="cc-map">
      <svg className="cc-map__svg" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} aria-hidden="true" focusable="false">
        <defs>
          {CCOS_CORES.map((core) => {
            const [cx, cy] = CENTRES[core.id];
            return (
              <linearGradient
                key={core.id}
                id={`${uid}-${core.id}`}
                gradientUnits="userSpaceOnUse"
                x1={cx}
                y1={cy - R * 0.52}
                x2={cx}
                y2={cy + R * 0.52}
              >
                <stop stopColor="#FFFFFF" />
                <stop offset="1" stopColor={core.color} />
              </linearGradient>
            );
          })}
        </defs>
        <g className="cc-map__links">
          {LINKS.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        {CCOS_CORES.map((core) => {
          const [cx, cy] = CENTRES[core.id];
          const inner = core.id === "ccos" ? 0.665 : 0.52;
          return (
            <g key={core.id} className="cc-map__core" data-selected={core.id === selected}>
              <g className="cc-map__thin">
                <path d={hex(cx, cy, R)} />
                <path d={hex(cx, cy, R * 0.8)} />
                <path d={hex(cx, cy, R * inner)} />
                <path d={wye(cx, cy, R * inner, R * 0.8)} />
                <text x={cx} y={cy} className="cc-map__abbr">
                  {core.abbr}
                </text>
              </g>
              <g className="cc-map__solid">
                <path d={hex(cx, cy, R)} fill="#D9D9D9" />
                <path d={hex(cx, cy, R * 0.8)} fill="#202020" />
                <path d={hex(cx, cy, R * 0.52)} fill={`url(#${uid}-${core.id})`} />
                <path d={wye(cx, cy, 0, R * 0.8)} className="cc-map__wye" />
              </g>
            </g>
          );
        })}
      </svg>

      <div className="cc-map__buttons" role="group" aria-labelledby={labelledBy}>
        {CCOS_CORES.map((core) => {
          const [cx, cy] = CENTRES[core.id];
          return (
            <button
              key={core.id}
              type="button"
              className="cc-map__button"
              style={{ left: `${(cx / VIEW_W) * 100}%`, top: `${(cy / VIEW_H) * 100}%` }}
              aria-pressed={core.id === selected}
              aria-label={core.name}
              onClick={() => onSelect(core.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
