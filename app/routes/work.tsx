import { WorkSidebar } from "../components/work/WorkSidebar";
import { WorkMosaic } from "../components/work/WorkMosaic";
import { useMotionPolicy } from "../motion/reducedMotion";
import { FEATURED_CATEGORY, FEATURED_YEAR } from "../data/workProjects";

export function meta() {
  return [{ title: "CCDV — Work" }];
}

/* N3 Work V3 Featured (t_20261124_ccdvn3work, OPERATOR, WORK V3.svg 1536 x
   1193): a dedicated Work workspace on the gray grid ground — the light rail
   (WorkSidebar) and the ADG-ARC mosaic (WorkMosaic). No shared bar and no
   footer (GlobalShell gives /work no chrome); Home and the other sections are
   in the rail, as /products/ccos is its own surface. Desktop: one screen,
   the artboard scaled to fit (global.css, WORK V3). Below 1024: the rail is a
   top band and the mosaic one column. Replaces the V2 hub (WorkHero). */
export default function Work() {
  const { reduced } = useMotionPolicy();
  return (
    <div className="r11 wv3" data-view="featured">
      <div className="wv3__frame">
        <WorkSidebar view="featured" marked={{ year: FEATURED_YEAR, category: FEATURED_CATEGORY }} />
        <WorkMosaic reduced={reduced} />
      </div>
    </div>
  );
}
