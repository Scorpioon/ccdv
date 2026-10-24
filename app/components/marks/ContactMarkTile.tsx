/* The overlapping outlined diamonds in the Contact masthead's active cell.
   Transcribed from pages_contact.svg's own active-cell icon, the same
   mask-source-silhouette-as-stroked-outline simplification already used by
   WorkGearTile/ServicesArrowTile: the reference's doubled mask geometry is
   dropped and the single source path is drawn directly with fill="none". */

const DIAMONDS_OUTLINE =
  "M1249.08 155.758L1249.08 155.759L1227.9 134.572L1303.41 59.061L1324.24 79.894L1343.29 60.8403L1369.52 87.0679L1369.56 87.0249L1388.71 106.173L1361.82 133.069L1388.63 159.882L1369.48 179.031L1369.48 179.031L1342.63 205.881L1324.1 187.351L1302.39 209.061L1249.08 155.758ZM1350.6 160.148L1323.94 133.49L1323.94 133.488L1323.52 133.067L1350.12 106.468L1324.25 80.5972L1271.13 133.716L1324.08 186.667L1350.6 160.148Z";

export function ContactMarkTile({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="1227.9 59.061 160.81 150"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <path d={DIAMONDS_OUTLINE} fill="none" stroke="#202020" strokeWidth="0.5" />
    </svg>
  );
}
