import { useParams } from "react-router";
import { Workcase } from "../components/Workcase";
import { WORKCASES, findProject, workcaseHref } from "../data/workProjects";

export function meta({ params }: { params: { slug?: string } }) {
  const slug = params.slug;
  return [{ title: slug && workcaseHref(slug) ? `CCDV — Work / ${slug}` : "CCDV — Not found" }];
}

/* `/work/:slug` — one reusable route. Only a slug with authentic case data
   (WORKCASES) resolves; anything else, including a real project without a
   case (e.g. /work/adg-ops), takes the router's existing 404 handling, the
   same as any unmatched URL, and leaks no metadata. */
export default function WorkcaseRoute() {
  const { slug = "" } = useParams();
  const known = workcaseHref(slug) !== undefined;
  const data = known ? WORKCASES[slug] : undefined;
  const project = known ? findProject(slug) : undefined;
  if (!data || !project) {
    throw new Response("Not Found", { status: 404, statusText: "Not Found" });
  }
  return <Workcase project={project} data={data} />;
}
