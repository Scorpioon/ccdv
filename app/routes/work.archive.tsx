export function meta() {
  return [
    { title: "CCDV — Work Archive" },
    { name: "description", content: "Selected work and project archive by CCDV." },
  ];
}

/* N3 W-A1: /work/archive — the Archive view of the Work workspace. The layout
   (routes/work.tsx, WorkWorkspace) draws every view, holds the filters and
   their restore context; this route only names the URL and the title. */
export default function WorkArchive() {
  return null;
}
