/* The orbit/wheel diagram in the Studio masthead's active cell.

   This one needs no asset promotion: pages_studio.svg defines it entirely as
   five primitives inside a 159.174 square clip at (369.141, 54.474), so it is
   reconstructed from published numbers rather than transcribed path data.
   The two ellipses are the same 79.5869 semi-minor circle seen at 90 and 60
   degrees, which is what reads as a wireframe sphere. */

const CX = 448.728;
const CY = 134.061;
const STROKE = "#202020";
const WIDTH = 0.286284;

export function StudioWheelTile({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="369.141 54.4741 159.174 159.174"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx={CX} cy={CY} r="79.4438" fill="none" stroke={STROKE} strokeWidth={WIDTH} />
      <ellipse
        cx={CX}
        cy={CY}
        rx="49.2408"
        ry="79.5869"
        transform={`rotate(90 ${CX} ${CY})`}
        fill="none"
        stroke={STROKE}
        strokeWidth={WIDTH}
        strokeLinecap="round"
        strokeDasharray="2.86 2.86"
      />
      <ellipse
        cx={CX}
        cy={CY}
        rx="17.7496"
        ry="79.5869"
        transform={`rotate(60 ${CX} ${CY})`}
        fill="none"
        stroke={STROKE}
        strokeWidth={WIDTH}
        strokeLinecap="round"
        strokeDasharray="2.86 2.86"
      />
      <line x1="448.871" y1="54.4741" x2="448.871" y2="213.648" stroke={STROKE} strokeWidth={WIDTH} />
      <line x1="528.312" y1="134.207" x2="369.138" y2="134.207" stroke={STROKE} strokeWidth={WIDTH} />
    </svg>
  );
}
