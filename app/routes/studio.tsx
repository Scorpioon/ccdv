import { useId, useState } from "react";
import { SiteMasthead } from "../components/SiteMasthead";
import { SiteFooter } from "../components/SiteFooter";
import { ClippedHeading } from "../components/ClippedHeading";
import { PrincipleCard, PRINCIPLES } from "../components/PrincipleCard";
import { HexCube } from "../components/marks/HexCube";

export function meta() {
  return [{ title: "CCDV — Studio" }];
}

/* Studio is a 3209-tall artboard. The section heights below are the literal
   rect heights from pages_studio.svg and sum with the 268.12 masthead to
   3208.12, so the page flows without absolute section positioning:

     268.12 masthead · 31 stripe · 177 hero · 392 intro · 31 stripe ·
     389 cards · 293 heading rows · 389 columns · 97 heading row ·
     289 WRKOPS · 692 CC.OS · 160 footer

   All copy is verbatim R1.1 and editorially provisional, typos included. */
export default function Studio() {
  // GF07-D: the two rows with reference panel content (B1-a leaves the other
  // two, [Designer to dev] and [Core principle 2], static — no content exists
  // for them). Independent booleans, both default open per R1.1's drawn state;
  // no exclusivity, no route-level behaviour.
  const [collaborativeOpen, setCollaborativeOpen] = useState(true);
  const [wrkopsOpen, setWrkopsOpen] = useState(true);
  const columnsPanelId = useId();
  const wrkopsPanelId = useId();

  return (
    <div className="r11 r11--studio">
      <SiteMasthead variant="studio" />

      <div className="section section--stripe" />

      <section className="section section--hero" aria-labelledby="studio-hero">
        <h1 className="band__label" id="studio-hero">
          [Studio]
        </h1>
        {/* origin, as on Home: ink 982.44 less the ":" bearing at 90 */}
        <span className="band__suffix" style={{ left: "calc(963 * var(--u))" }}>
          :P
        </span>
        <span className="hero__watermark" aria-hidden="true">
          collapse
        </span>
      </section>

      <section className="section section--intro">
        <div className="intro__copy">
          <p>
            Collapse: Dev Unit is a technical studio spezialized in developing tools and human
            centered experiences.
          </p>
          <p>
            We meet at the intersection between technical implementation, ux/ui design and
            creativity.
          </p>
        </div>
        <HexCube
          className="intro__figure"
          variant="interior"
          gradientFrom="#A864E2"
          gradientTo="#5C377C"
          lineColor="#6E6E6E"
        />
      </section>

      <div className="section section--stripe" />

      <section className="section section--cards" aria-label="Core principles">
        <div className="cards">
          {PRINCIPLES.map((entry) => (
            <PrincipleCard key={entry.label} {...entry} />
          ))}
        </div>
      </section>

      <div className="clip-rows clip-rows--triple">
        <ClippedHeading label="[Designer to dev]" chevron />
        <ClippedHeading label="[Core principle 2]" chevron />
        <ClippedHeading
          label="[Collaborative approach]"
          expanded={collaborativeOpen}
          onToggle={() => setCollaborativeOpen((open) => !open)}
          panelId={columnsPanelId}
        />
      </div>

      <section
        id={columnsPanelId}
        className="section section--columns"
        data-collapsed={!collaborativeOpen}
        aria-hidden={collaborativeOpen ? undefined : "true"}
      >
        <div className="columns">
          {PRINCIPLES.map((entry) => (
            <PrincipleCard key={entry.label} {...entry} />
          ))}
        </div>
      </section>

      <div className="clip-rows clip-rows--single">
        <ClippedHeading
          label="[Build with Wrkops™]"
          expanded={wrkopsOpen}
          onToggle={() => setWrkopsOpen((open) => !open)}
          panelId={wrkopsPanelId}
        />
      </div>

      <section
        id={wrkopsPanelId}
        className="section section--wrkops"
        data-collapsed={!wrkopsOpen}
        aria-hidden={wrkopsOpen ? undefined : "true"}
      >
        <div className="wrkops__copy">
          <p>
            Our daily operation manager.
            <br />
            A suite made for ai-assisted-human-ownership development.
          </p>
        </div>
        <HexCube
          className="wrkops__figure"
          variant="ring"
          gradientFrom="#FFFFFF"
          gradientTo="#8654B3"
          lineColor="#D9D9D9"
          outerFill="#D9D9D9"
          middleFill="#202020"
        />
      </section>

      <section className="section section--ccos" aria-labelledby="ccos-title">
        <HexCube
          className="ccos__figure"
          variant="solid"
          gradientFrom="#FFFFFF"
          gradientTo="#8654B3"
          lineColor="#D9D9D9"
          outerFill="#202020"
        />
        <h2 className="ccos__wordmark" id="ccos-title">
          CC.OS
        </h2>
        <p className="ccos__copy">
          Collapse Creative OS sits at the center of our daily operations. Together with WrkOps and
          other core systems we operate and create our own projects, tools and client work.
        </p>
        <span className="ccos__action" aria-disabled="true">
          Read dev notes →
        </span>
        <span className="ccos__dot" aria-hidden="true" />
      </section>

      <SiteFooter />
    </div>
  );
}
