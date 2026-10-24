/* The hex-cube outline in the Products masthead's active cell.
   Transcribed from pages_products.svg's own active-cell icon: three nested
   hexagons sharing the same y134.061 centre line plus the Y-divider, the
   same construction family as HexCube's Studio instances. The middle ring is
   filled green here (unique to this cell's icon, unlike HexCube's grey/ring
   variants), and the innermost ring's reference gradient stroke is reduced
   to a flat light stroke rather than carrying a second gradient definition
   for one small masthead glyph. */

export function ProductsMarkTile({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="1026.72 57.0547 133.38 153.46"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M1160.1 95.5566V172.564L1093.41 211.066L1026.72 172.563V95.5576L1093.41 57.0547L1160.1 95.5566Z"
        stroke="#202020"
        strokeWidth="0.68"
      />
      <path
        d="M1146.73 103.274V164.846L1093.41 195.634L1040.08 164.846V103.274L1093.41 72.4868L1146.73 103.274Z"
        fill="#5AE36F"
        stroke="#202020"
        strokeWidth="0.68"
      />
      <path
        d="M1128.02 114.078V154.043L1093.41 174.027L1058.8 154.043V114.078L1093.41 94.0938L1128.02 114.078Z"
        fill="none"
        stroke="#D9D9D9"
        strokeWidth="0.68"
      />
      <path d="M1040.11 103.25L1093.41 134.061L1146.7 103.25" stroke="#202020" strokeWidth="0.68" />
      <path d="M1093.41 134.061V195.543" stroke="#202020" strokeWidth="0.68" />
    </svg>
  );
}
