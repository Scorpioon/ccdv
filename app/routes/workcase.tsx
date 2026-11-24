import { useParams } from "react-router";
import { workcaseHref } from "../data/workProjects";

export function meta({ params }: { params: { slug?: string } }) {
  const slug = params.slug;
  return [{ title: slug && workcaseHref(slug) ? `CCDV — Work / ${slug}` : "CCDV — Not found" }];
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
