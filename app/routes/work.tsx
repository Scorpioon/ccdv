import { Outlet } from "react-router";
import { WorkWorkspace } from "../components/work/WorkWorkspace";

/* N3 Work V3, W-A1 (t_20261124_ccdvn3work, OPERATOR): the `work` layout
   route. One Work workspace (WorkWorkspace) draws Featured (/work), the
   archive (/work/archive) and a case (/work/:slug) and moves between them
   like the CC.OS deck; the child routes only name the URL and the title
   (and the case route validates its slug, 404 otherwise). Replaces the
   separate V3 Featured / Archive pages and the V2 hub. */
export default function WorkLayout() {
  return (
    <>
      <WorkWorkspace />
      <Outlet />
    </>
  );
}
