import type { CSSProperties } from "react";

/* Products V2 artwork, transcribed from PRODUCTS_v2.svg (OPERATOR D1). Each
   viewBox is the drawing's own source box, so the path data is pasted
   unchanged (the ProductsCard / WorkGearTile convention). The phone artboard
   (PRODUCTS_responsive_v2.svg) draws the same shapes at the same size (topic
   art, card icons) or uniformly scaled (hero cube, x0.2379), so one drawing
   serves both layouts.

   Figma's inside-aligned strokes are kept as exported: a doubled stroke
   masked by the shape itself. `Products demo cube (not use, recreate)` is a
   negative reference and is not used anywhere here. All art is decorative. */

/* hero wireframe cube: three nested hexagons (light / green / green-to-light)
   and the green Y + light vertical that read as a cube. The source box runs
   past the 1536 artboard on the right; the page clips it. */
export function ProductsHeroCube({ className }: { className?: string }) {
  const outer = "M1111.5 53L1657.53 368.25V998.75L1111.5 1314L565.471 998.75V368.25L1111.5 53Z";
  const middle = "M1111.47 179.104L1548.29 431.304V935.704L1111.47 1187.9L674.647 935.704V431.304L1111.47 179.104Z";
  const inner = "M1111.49 355.635L1395.43 519.565V847.425L1111.49 1011.36L827.558 847.425V519.565L1111.49 355.635Z";
  return (
    <svg className={className} viewBox="563 50 1097 1267" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <mask id="pv-cube-m0" fill="white"><path d={outer} /></mask>
        <mask id="pv-cube-m1" fill="white"><path d={middle} /></mask>
        <mask id="pv-cube-m2" fill="white"><path d={inner} /></mask>
        <linearGradient id="pv-cube-g0" x1="1111.49" y1="355.635" x2="1132.51" y2="1276.16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5AE36F" />
          <stop offset="1" stopColor="#F2F2F2" />
        </linearGradient>
      </defs>
      <path d={outer} strokeWidth="4.53597" stroke="#F2F2F2" mask="url(#pv-cube-m0)" />
      <path d={middle} strokeWidth="4.53597" stroke="#5AE36F" mask="url(#pv-cube-m1)" />
      <path d={inner} strokeWidth="4.53597" stroke="url(#pv-cube-g0)" mask="url(#pv-cube-m2)" />
      <path d="M676.086 431.754L1111.54 683.501L1546.99 431.754" strokeWidth="2.26799" stroke="#5AE36F" />
      <path d="M1111.48 683.496V1185.84" strokeWidth="2.26799" stroke="#F2F2F2" />
    </svg>
  );
}

/* \\Our Software Code artwork boxes: each viewBox is that column's 340.4 x
   222.4 box (x 51.2 / 415.6 / 780 / 1144.4, y 1314.33), so the art keeps its
   place inside the box; the box outline itself is CSS. */
function ApproachArt() {
  return (
    <svg className="pv-topic__svg" viewBox="51.2 1314.33 340.4 222.4" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="pv-topic-a1" x1="221.409" y1="1440.04" x2="221.409" y2="1365.79" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5AE36F" />
          <stop offset="1" stopColor="#F2F2F2" />
        </linearGradient>
        <linearGradient id="pv-topic-a2" x1="156.406" y1="1485.27" x2="280.192" y2="1481.97" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5AE36F" />
          <stop offset="0.454452" stopColor="#84E794" />
          <stop offset="1" stopColor="#F2F2F2" />
        </linearGradient>
      </defs>
      <path d="M221.409 1365.79L253.658 1384.41V1421.65L221.409 1440.27L189.161 1421.65V1384.41L221.409 1365.79Z" fill="url(#pv-topic-a1)" />
      <path d="M188.43 1383.97L221.454 1403.26L254.48 1383.97" strokeWidth="2" stroke="#1A1A1A" />
      <path
        d="M186.7 1468.91H164.906C163.802 1468.91 162.906 1469.81 162.906 1470.91V1483.27C162.906 1484.37 163.802 1485.27 164.906 1485.27H244.251C244.542 1485.27 244.829 1485.21 245.093 1485.08L277.845 1469.87C278.938 1469.36 279.337 1468.01 278.694 1466.99L275.886 1462.53C275.365 1461.71 274.324 1461.38 273.424 1461.75L245.062 1473.59C244.818 1473.69 244.557 1473.74 244.292 1473.74H214.13C213.025 1473.74 212.13 1472.85 212.13 1471.74V1466.08C212.13 1464.97 213.025 1464.08 214.13 1464.08H233.605C234.71 1464.08 235.605 1463.18 235.605 1462.08V1458.27C235.605 1457.16 234.71 1456.27 233.605 1456.27H201.209C200.685 1456.27 200.182 1456.48 199.808 1456.84L188.101 1468.34C187.727 1468.7 187.224 1468.91 186.7 1468.91Z"
        fill="url(#pv-topic-a2)"
      />
    </svg>
  );
}

function TargetArt() {
  return (
    <svg className="pv-topic__svg" viewBox="415.6 1314.33 340.4 222.4" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="pv-topic-t3" x1="585.073" y1="1375.23" x2="544.913" y2="1365.31" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5AE36F" />
          <stop offset="1" stopColor="#F2F2F2" />
        </linearGradient>
        <linearGradient id="pv-topic-t4" x1="534.929" y1="1417.9" x2="520.936" y2="1456.82" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5AE36F" />
          <stop offset="1" stopColor="#F2F2F2" />
        </linearGradient>
        <linearGradient id="pv-topic-t5" x1="600.143" y1="1470.88" x2="638.948" y2="1456.55" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F2F2F2" />
          <stop offset="0.822115" stopColor="#5AE36F" />
        </linearGradient>
        <linearGradient id="pv-topic-t6" x1="546.151" y1="1461.14" x2="567.626" y2="1496.49" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F2F2F2" />
          <stop offset="0.822115" stopColor="#5AE36F" />
        </linearGradient>
      </defs>
      <path d="M544.912 1365.32L581.758 1499.06L601.9 1504.03L616.278 1489.08L579.432 1355.34L559.29 1350.36L544.912 1365.32Z" fill="url(#pv-topic-t3)" />
      <path d="M559.148 1349.91L559.686 1349.76L595.639 1482.12L595.101 1482.26L594.564 1482.41L558.611 1350.06L559.148 1349.91ZM595.101 1482.26L595.501 1482.65L580.659 1497.94L580.259 1497.55L579.859 1497.16L594.702 1481.87L595.101 1482.26ZM595.101 1482.26L595.235 1481.72L615.269 1486.67L615.136 1487.21L615.002 1487.75L594.968 1482.8L595.101 1482.26Z" fill="#1A1A1A" />
      <path d="M520.931 1456.82L657.796 1433.95L664.817 1414.44L651.421 1398.6L514.556 1421.46L507.534 1440.98L520.931 1456.82Z" fill="url(#pv-topic-t4)" />
      <path d="M507.07 1441.07L506.981 1440.52L642.368 1418.4L642.458 1418.95L642.548 1419.5L507.16 1441.62L507.07 1441.07ZM642.458 1418.95L642.885 1418.6L656.564 1434.93L656.136 1435.29L655.709 1435.65L642.031 1419.31L642.458 1418.95ZM642.458 1418.95L641.934 1418.77L648.918 1399.35L649.442 1399.54L649.966 1399.73L642.982 1419.14L642.458 1418.95Z" fill="#1A1A1A" />
      <path d="M638.95 1456.55L533.391 1366.51L513.928 1373.69L510.417 1394.13L615.976 1484.18L635.44 1477L638.95 1456.55Z" fill="url(#pv-topic-t5)" />
      <path d="M635.812 1477.29L635.449 1477.72L531.411 1388.32L531.774 1387.9L532.137 1387.48L636.176 1476.87L635.812 1477.29ZM531.774 1387.9L531.226 1387.8L534.934 1366.83L535.483 1366.92L536.032 1367.02L532.323 1388L531.774 1387.9ZM531.774 1387.9L531.967 1388.42L512.608 1395.57L512.415 1395.04L512.222 1394.52L531.581 1387.38L531.774 1387.9Z" fill="#1A1A1A" />
      <path d="M567.636 1496.48L635.849 1375.68L625.074 1357.95L604.332 1358.42L536.119 1479.22L546.894 1496.95L567.636 1496.48Z" fill="url(#pv-topic-t6)" />
      <path d="M546.672 1497.37L546.188 1497.09L614.052 1377.9L614.536 1378.18L615.02 1378.46L547.156 1497.64L546.672 1497.37ZM614.536 1378.18L614.526 1377.62L635.831 1377.25L635.84 1377.81L635.85 1378.36L614.546 1378.74L614.536 1378.18ZM614.536 1378.18L614.06 1378.47L603.343 1360.84L603.819 1360.55L604.295 1360.26L615.012 1377.89L614.536 1378.18Z" fill="#1A1A1A" />
    </svg>
  );
}

function OfflineArt() {
  const hollow = "M1005.53 1495.76L1005.73 1400.23L980.678 1385.76L955.625 1400.23L955.42 1495.76L980.473 1510.22L1005.53 1495.76Z";
  return (
    <svg className="pv-topic__svg" viewBox="780 1314.33 340.4 222.4" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="pv-topic-o7" x1="841.682" y1="1466.92" x2="891.635" y2="1495.76" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5AE36F" />
          <stop offset="1" stopColor="#F2F2F2" />
        </linearGradient>
        <linearGradient id="pv-topic-o8" x1="897.862" y1="1466.92" x2="947.814" y2="1495.76" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F2F2F2" />
          <stop offset="1" stopColor="#5AE36F" />
        </linearGradient>
        <linearGradient id="pv-topic-o9" x1="955.573" y1="1466.92" x2="1005.53" y2="1495.76" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5AE36F" />
          <stop offset="1" stopColor="#F2F2F2" />
        </linearGradient>
        <linearGradient id="pv-topic-o10" x1="1007.5" y1="1464.1" x2="916.497" y2="1409.61" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5AE36F" />
          <stop offset="1" stopColor="#F2F2F2" />
        </linearGradient>
        <linearGradient id="pv-topic-o11" x1="1014.11" y1="1466.92" x2="1064.06" y2="1495.76" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F2F2F2" />
          <stop offset="1" stopColor="#5AE36F" />
        </linearGradient>
        <mask id="pv-topic-om" fill="white"><path d={hollow} /></mask>
      </defs>
      <path d="M891.636 1495.76L891.636 1447.76L866.583 1433.29L841.529 1447.76L841.529 1495.76L866.583 1510.22L891.636 1495.76Z" fill="url(#pv-topic-o7)" />
      <path d="M866.602 1510.88L866.602 1462.42M866.602 1462.42L892.405 1447.69M866.602 1462.42L841.683 1448.04" strokeWidth="1.55376" stroke="#1A1A1A" />
      <path d="M947.816 1495.75L947.816 1419.65L922.762 1405.19L897.709 1419.65L897.709 1495.75L922.762 1510.22L947.816 1495.75Z" fill="url(#pv-topic-o8)" />
      <path d="M922.781 1510.88L922.781 1435.18M922.781 1435.18L948.584 1420.46M922.781 1435.18L897.862 1420.8" strokeWidth="1.55376" stroke="#1A1A1A" />
      <path d={hollow} strokeWidth="3.10752" stroke="url(#pv-topic-o9)" mask="url(#pv-topic-om)" />
      <path d="M980.492 1510.88L981.188 1416.17M981.188 1416.17L1006.99 1401.44M981.188 1416.17L956.269 1401.78" strokeWidth="1.55376" stroke="url(#pv-topic-o10)" />
      <path d="M1064.07 1495.75L1066.54 1354.39L1041.48 1339.93L1016.43 1354.39L1013.96 1495.75L1039.01 1510.22L1064.07 1495.75Z" fill="url(#pv-topic-o11)" />
      <path d="M1039.02 1510.88L1042.15 1372.62M1042.15 1372.62L1067.95 1357.89M1042.15 1372.62L1017.23 1358.23" strokeWidth="1.55376" stroke="#1A1A1A" />
    </svg>
  );
}

/* six bars, in source paint order: [body, gradient x1 y1 x2 y2 first-stop (end offset), edges] */
const UPDATES_BARS: [string, [string, string, string, string, string, number?], string][] = [
  [
    "M1329.19 1459.76L1330.76 1345.76L1316.02 1337.25L1301.27 1345.79L1299.7 1459.79L1314.44 1468.3L1329.19 1459.76Z",
    ["1322.54", "1337.56", "1329.45", "1459.75", "#F2F2F2", 0.528846],
    "M1314.44 1468.69L1316.39 1355.99M1316.39 1355.99L1331.59 1347.3M1316.39 1355.99L1301.74 1347.53",
  ],
  [
    "M1298.6 1461.09L1299.94 1347.23L1285.17 1338.7L1270.42 1347.2L1269.07 1461.07L1283.84 1469.59L1298.6 1461.09Z",
    ["1275.69", "1345.41", "1273.97", "1468.86", "#5AE36F"],
    "M1283.85 1469.98L1285.59 1357.42M1285.59 1357.42L1300.78 1348.77M1285.59 1357.42L1270.9 1348.94",
  ],
  [
    "M1358.87 1465.64L1360.4 1351.66L1345.66 1343.15L1330.91 1351.68L1329.37 1465.66L1344.11 1474.17L1358.87 1465.64Z",
    ["1329.48", "1448.67", "1358.87", "1465.64", "#5AE36F"],
    "M1344.12 1474.56L1346.05 1361.89M1346.05 1361.89L1361.24 1353.2M1346.05 1361.89L1331.39 1353.42",
  ],
  [
    "M1312.7 1479.39L1314.09 1365.49L1299.33 1356.97L1284.58 1365.48L1283.18 1479.37L1297.95 1487.89L1312.7 1479.39Z",
    ["1303.82", "1394.79", "1273.39", "1482.8", "#F2F2F2", 0.822115],
    "M1297.96 1488.28L1299.74 1375.69M1299.74 1375.69L1314.94 1367.03M1299.74 1375.69L1285.06 1367.21",
  ],
  [
    "M1344.72 1489.91L1346.09 1376.03L1331.33 1367.51L1316.57 1376.01L1315.2 1489.89L1329.97 1498.42L1344.72 1489.91Z",
    ["1315.28", "1472.92", "1344.72", "1489.92", "#F2F2F2", 0.822115],
    "M1329.98 1498.81L1331.73 1386.23M1331.73 1386.23L1346.93 1377.57M1331.73 1386.23L1317.05 1377.75",
  ],
  [
    "M1330.08 1505.01L1331.43 1391.15L1316.66 1382.62L1301.9 1391.12L1300.56 1504.98L1315.33 1513.51L1330.08 1505.01Z",
    ["1300.63", "1488.01", "1330.08", "1505.01", "#5AE36F"],
    "M1315.34 1513.9L1317.07 1401.34M1317.07 1401.34L1332.27 1392.68M1317.07 1401.34L1302.38 1392.85",
  ],
];

function UpdatesArt() {
  return (
    <svg className="pv-topic__svg" viewBox="1144.4 1314.33 340.4 222.4" fill="none" aria-hidden="true" focusable="false">
      <defs>
        {UPDATES_BARS.map(([, [x1, y1, x2, y2, first, end]], i) => (
          /* two-stop ramps: green <-> light; `end` is the second stop's offset
             where the source does not run it to 1 */
          <linearGradient key={i} id={`pv-topic-u${i}`} x1={x1} y1={y1} x2={x2} y2={y2} gradientUnits="userSpaceOnUse">
            <stop stopColor={first} />
            <stop offset={end ?? 1} stopColor={first === "#5AE36F" ? "#F2F2F2" : "#5AE36F"} />
          </linearGradient>
        ))}
      </defs>
      {UPDATES_BARS.map(([body, , edges], i) => (
        <g key={i}>
          <path d={body} fill={`url(#pv-topic-u${i})`} />
          <path d={edges} strokeWidth="0.91498" stroke="#1A1A1A" />
        </g>
      ))}
    </svg>
  );
}

export function ProductsTopicArt({ topic }: { topic: "approach" | "target" | "offline" | "updates" }) {
  if (topic === "approach") return <ApproachArt />;
  if (topic === "target") return <TargetArt />;
  if (topic === "offline") return <OfflineArt />;
  return <UpdatesArt />;
}

/* the icon is sized by its source width (CSS: --icon-w x the page unit) */
const iconWidth = (w: number) => ({ "--icon-w": w }) as CSSProperties;

/* Product card icons: outer plate, inner plate, a white-to-#202020 core and
   the ink Y + vertical. CC.OS is green; the three placeholders are light
   (the card's 0.2 opacity dims them, as the source group does). */
export function ProductsCardIcon({ kind }: { kind: "ccos" | "triangle" | "diamond" | "pentagon" }) {
  if (kind === "ccos") {
    return (
      <svg className="pv-card__icon" viewBox="97.52 2339.37 65.57 75.71" style={iconWidth(65.57)} aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="pv-card-g-ccos" x1="130.309" y1="2357.54" x2="130.309" y2="2396.91" gradientUnits="userSpaceOnUse">
            <stop stopColor="white" />
            <stop offset="1" stopColor="#202020" />
          </linearGradient>
        </defs>
        <path d="M130.308 2339.37L163.091 2358.29V2396.15L130.308 2415.08L97.5247 2396.15V2358.29L130.308 2339.37Z" fill="#5AE36F" />
        <path d="M130.307 2346.93L156.534 2362.08V2392.36L130.307 2407.5L104.081 2392.36V2362.08L130.307 2346.93Z" fill="#5AE36F" />
        <path d="M130.309 2357.54L147.357 2367.38V2387.07L130.309 2396.91L113.262 2387.07V2367.38L130.309 2357.54Z" fill="url(#pv-card-g-ccos)" />
        <path d="M103.812 2362.08L130.311 2377.22L156.809 2362.08" strokeWidth="1.30851" stroke="#141414" fill="none" />
        <path d="M130.305 2377.22V2407.51" strokeWidth="1.30851" stroke="#141414" />
      </svg>
    );
  }
  if (kind === "triangle") {
    return (
      <svg className="pv-card__icon" viewBox="279.73 2328.47 65.57 68.14" style={iconWidth(65.57)} aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="pv-card-g-triangle" x1="312.505" y1="2346.64" x2="312.505" y2="2386.01" gradientUnits="userSpaceOnUse">
            <stop stopColor="white" />
            <stop offset="1" stopColor="#202020" />
          </linearGradient>
        </defs>
        <path d="M312.511 2328.47L345.294 2385.25H279.728L312.511 2328.47Z" fill="#F2F2F2" />
        <path d="M312.51 2336.04L338.737 2381.46H286.284L312.51 2336.04Z" fill="#F2F2F2" />
        <path d="M312.505 2346.64L329.552 2376.17H295.458L312.505 2346.64Z" fill="url(#pv-card-g-triangle)" />
        <path d="M286.016 2351.18L312.514 2366.33L339.012 2351.18" strokeWidth="1.30851" stroke="#141414" fill="none" />
        <path d="M312.508 2366.33V2396.61" strokeWidth="1.30851" stroke="#141414" />
      </svg>
    );
  }
  if (kind === "diamond") {
    return (
      <svg className="pv-card__icon" viewBox="456.85 2328.47 75.71 75.71" style={iconWidth(75.71)} aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="pv-card-g-diamond" x1="494.7" y1="2346.64" x2="494.7" y2="2386.01" gradientUnits="userSpaceOnUse">
            <stop stopColor="white" />
            <stop offset="1" stopColor="#202020" />
          </linearGradient>
        </defs>
        <path d="M494.706 2328.47L532.561 2366.33L494.706 2404.18L456.852 2366.33L494.706 2328.47Z" fill="#F2F2F2" />
        <path d="M494.706 2336.04L524.989 2366.32L494.706 2396.61L464.422 2366.32L494.706 2336.04Z" fill="#F2F2F2" />
        <path d="M494.7 2346.64L514.385 2366.33L494.7 2386.01L475.016 2366.33L494.7 2346.64Z" fill="url(#pv-card-g-diamond)" />
        <path d="M468.211 2351.18L494.709 2366.33L521.208 2351.18" strokeWidth="1.30851" stroke="#141414" fill="none" />
        <path d="M494.703 2366.33V2396.61" strokeWidth="1.30851" stroke="#141414" />
      </svg>
    );
  }
  return (
    <svg className="pv-card__icon" viewBox="640.91 2328.47 72 68.48" style={iconWidth(72)} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="pv-card-g-pentagon" x1="676.903" y1="2346.64" x2="676.903" y2="2386.01" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" />
          <stop offset="1" stopColor="#202020" />
        </linearGradient>
      </defs>
      <path d="M676.909 2328.47L712.911 2354.63L699.16 2396.95H654.659L640.907 2354.63L676.909 2328.47Z" fill="#F2F2F2" />
      <path d="M676.901 2336.04L705.703 2356.96L694.701 2390.82H659.101L648.099 2356.96L676.901 2336.04Z" fill="#F2F2F2" />
      <path d="M676.903 2346.64L695.624 2360.25L688.473 2382.25H665.333L658.182 2360.25L676.903 2346.64Z" fill="url(#pv-card-g-pentagon)" />
      <path d="M650.406 2351.18L676.905 2366.33L703.403 2351.18" strokeWidth="1.30851" stroke="#141414" fill="none" />
      <path d="M676.906 2366.33V2396.61" strokeWidth="1.30851" stroke="#141414" />
    </svg>
  );
}
