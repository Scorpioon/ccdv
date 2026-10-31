import { useMemo, useState } from "react";
import { Link } from "react-router";
import { SiteMasthead } from "../components/SiteMasthead";
import { SiteFooter } from "../components/SiteFooter";
import { FilterGroup } from "../components/FilterGroup";
import { ProjectList, type WorkProject } from "../components/ProjectList";

export function meta() {
  return [{ title: "CCDV — Work" }];
}

/* Work is a 1195-tall artboard: 268.12 masthead, 31 stripe, 177 hero,
   31 stripe, 527 explorer (filters + list + preview), 160 footer — the
   literal rect heights from pages_work.svg, summing unchanged. */
const YEARS = ["2026", "2025", "2024", "2023"];
const TYPES = ["WEBSITE", "TOOL", "CC:OS", "DIGITAL PRODUCT"];

/* Six projects, names/tags/WIP status verbatim from pages_work.png
   (`WPG-016`–`WPG-021`); `typeFilter` is read straight off each row's own
   tag. No project carries a sourced release year — the content-ID registry
   the decision matrix refers to is absent from the workspace (GF08-A0
   report §2). GF08-A4 CORRECTION 01 (supersedes the GF08-A2 reading below):
   rather than let Year selection empty the list on every option, Year
   filtering is disabled outright until real per-project year data exists;
   `year` is kept on the data shape only so a future pass can wire it back in
   by filling real values, not by changing this filter's mechanics again. */
const PROJECTS: WorkProject[] = [
  { id: "adg-arc", name: "ADG-ARC", tag: "INTERACTIVE WEBSITE", typeFilter: "WEBSITE", year: null, wip: false, leading: true },
  { id: "adg-ops", name: "ADG-OPS", tag: "DIGITAL PRODUCT", typeFilter: "DIGITAL PRODUCT", year: null, wip: true },
  { id: "ccdv-website", name: "CC.DV Website", tag: "WEBSITE", typeFilter: "WEBSITE", year: null, wip: false },
  { id: "htw-website", name: "HTW Website", tag: "WEBSITE", typeFilter: "WEBSITE", year: null, wip: true },
  { id: "htw-tool", name: "HTW Tool", tag: "TOOL", typeFilter: "TOOL", year: null, wip: true },
  { id: "ccos-01", name: "CC.OS 0.1", tag: "WEBSITE", typeFilter: "WEBSITE", year: null, wip: true },
];

const DEFAULT_PREVIEW_ID = PROJECTS[0].id;

export default function Work() {
  const [type, setType] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string>(DEFAULT_PREVIEW_ID);

  const filtered = useMemo(
    () => PROJECTS.filter((project) => !type || project.typeFilter === type),
    [type],
  );

  const previewProject =
    PROJECTS.find((project) => project.id === previewId) ?? PROJECTS.find((project) => project.id === DEFAULT_PREVIEW_ID)!;

  return (
    <div className="r11 r11--work">
      <SiteMasthead variant="work" />

      <div className="section section--stripe" />

      <section className="section section--hero" aria-labelledby="work-hero">
        <h1 className="band__label" id="work-hero">
          [Work]
        </h1>
        <span className="band__suffix" style={{ left: "calc(722 * var(--u))" }}>
          +.+
        </span>
        <Link
          className="hero__watermark"
          to="/"
          state={{ from: "work" }}
          aria-label="collapse — back to Home"
        >
          collapse
        </Link>
      </section>

      <div className="section section--stripe" />

      <section className="section section--work-explorer" aria-label="Work projects">
        <div className="work-filters">
          <FilterGroup label="Year" options={YEARS} value={null} onChange={() => {}} align="start" disabled />
          <FilterGroup label="Type" options={TYPES} value={type} onChange={setType} align="end" />
        </div>

        <div className="work-layout">
          <div className="work-layout__list" onMouseLeave={() => setPreviewId(DEFAULT_PREVIEW_ID)}>
            <ProjectList projects={filtered} activeId={previewId} onActiveChange={setPreviewId} />
          </div>

          <div className="work-preview" role="status" aria-live="polite">
            <p className="work-preview__name">{previewProject.name}</p>
            <p className="work-preview__note">[ preview unavailable ]</p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
