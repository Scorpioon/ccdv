import { useParams } from "react-router";
import { findProject, workcaseHref } from "../data/workProjects";

/* N4 P-H A-16 (OPERATOR): the title names the project, not its slug */
export function meta({ params }: { params: { slug?: string } }) {
  const slug = params.slug;
  if (!slug || !workcaseHref(slug)) return [{ title: "CCDV — Not found" }];
  const project = findProject(slug);
  const name = project ? project.displayName ?? project.name : slug;
  return [
    { title: `CCDV — Work / ${name}` },
    { name: "description", content: `${name}: a case study from the CCDV work archive.` },
  ];
}

/* `/work/:slug` — one reusable route. Only a slug with authentic case data
   (WORKCASES) resolves; anything else, including a real project without a
   case (e.g. /work/adg-ops), takes the router's existing 404 handling, the
   same as any unmatched URL, and leaks no metadata.
   N3 W-A1: the case is drawn by the Work workspace (routes/work.tsx), which
   slides it in beside the rail; this route only validates the slug. */
export default function WorkcaseRoute() {
  const { slug = "" } = useParams();
  if (workcaseHref(slug) === undefined) {
    throw new Response("Not Found", { status: 404, statusText: "Not Found" });
  }
  return null;
}
