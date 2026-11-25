import { SiteFooter } from "../components/SiteFooter";
import { HomeIdentity } from "../components/home/HomeIdentity";
import { HomeSections } from "../components/home/HomeSections";

export function meta() {
  return [
    { title: "CCDV — Collapse Creative Development Unit" },
    { name: "description", content: "Collapse Creative Development Unit — UX/UI, code and motion studio, part of Collapse Creative." },
  ];
}

/* N5 BH1 (OPERATOR): Home rebuilt to the BetterHome design. Two light panels on
   the grey ground: the identity panel (the page h1) and the section cards. The
   masthead and the five NavBand bands are gone from Home. The identity panel
   sits inside <main> because it carries the h1; the footer (contentinfo) stays
   outside it (N4 P-H A-14). */
export default function Home() {
  return (
    <div className="r11 r11--home">
      <main className="hm">
        <section className="hm__panel hm__panel--id">
          <HomeIdentity />
        </section>
        <section className="hm__panel hm__panel--nav">
          <HomeSections />
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
