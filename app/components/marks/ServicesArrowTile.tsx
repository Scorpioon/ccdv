/* The thin-outline NE arrow in the Services masthead's active cell.

   Transcribed from pages_services.svg's own active-cell icon, the same way
   as WorkGearTile: the reference's mask-source silhouette (a simple arrow
   shaft + head, no teeth) is reproduced directly as a stroked outline rather
   than carrying its doubled mask geometry. Stroke width matches WorkGearTile's
   0.5 for the same reason — the nearest value either reference states
   explicitly, used in place of the measured ~0.72 doubled-path offset. */

const ARROW_OUTLINE =
  "M959.585 84.3638V215.114H930.43V102.572L818.062 214.94L797.445 194.324L909.605 82.1646H797.48V53.0083H928.229L959.585 84.3638Z";

export function ServicesArrowTile({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="797.445 53.0083 162.14 162.106"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <path d={ARROW_OUTLINE} fill="none" stroke="#202020" strokeWidth="0.5" />
    </svg>
  );
}
