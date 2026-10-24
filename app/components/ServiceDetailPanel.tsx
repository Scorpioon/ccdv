import { useEffect, useState } from "react";

/* Services' nested ServiceBlock selector + bound description (`SVC-DEC-002
   `–`004`). Only the category shown active in R1.1 (`Experience`) has a
   visible content state — three identically-worded placeholder blocks and
   one placeholder description, per `SVC-DEC-005` ("names and descriptions
   are placeholders"). The other four categories have no sourced content at
   all, so rather than inventing four sets of distinct names (forbidden by
   this task's scope), every category reuses that same verbatim placeholder
   triad: it is the one approved placeholder pattern, reproduced rather than
   multiplied into invented variations.

   GF08-A4R1 CORRECTION: `services.tsx` now supplies one distinct, stably-
   identified `ServiceBlockContent` record per category+index (see that
   file's `SERVICES_CONTENT`) instead of one flat `description` string
   shared by every block. This component reads `active.description` off the
   selected record, so the right pane is mechanically a function of BOTH the
   active category (which record set `blocks` is) and the active block
   (`selectedIndex` into it) — satisfying `SVC-DEC-004`'s "keyed to BOTH"
   requirement at the binding level, without the visible text changing: all
   records still carry the one sourced placeholder label/description
   verbatim (`SVC-DEC-005`), just as distinct entries rather than aliases of
   each other. `categoryId` (not `categoryLabel`) drives the block-reset
   effect, since it is the stable identity the reset should key off; the
   label is kept only for the accessible group name. `data-category-id` /
   `data-active-block-id` / `data-block-id` expose that identity for
   verification without touching layout — no class or visible markup
   changed. */

export interface ServiceBlockContent {
  id: string;
  label: string;
  description: string;
}

export interface ServiceDetailPanelProps {
  categoryId: string;
  categoryLabel: string;
  blocks: ServiceBlockContent[];
  panelId?: string;
}

export function ServiceDetailPanel({ categoryId, categoryLabel, blocks, panelId }: ServiceDetailPanelProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [categoryId]);

  const active = blocks[selectedIndex] ?? blocks[0];

  return (
    <div id={panelId} className="svc-detail" data-category-id={categoryId} data-active-block-id={active?.id}>
      <div className="svc-detail__blocks" role="group" aria-label={`${categoryLabel} service blocks`}>
        {blocks.map((block, index) => {
          const isActive = index === selectedIndex;
          return (
            <button
              key={block.id}
              type="button"
              aria-pressed={isActive}
              data-block-id={block.id}
              className="svc-detail__block"
              onClick={() => setSelectedIndex(index)}
            >
              {isActive ? `[ ${block.label} ]` : block.label}
            </button>
          );
        })}
        <span className="svc-detail__dot" aria-hidden="true" />
      </div>
      <div className="svc-detail__description">
        <p>{active?.description}</p>
        <span className="svc-detail__dot svc-detail__dot--accent" aria-hidden="true" />
      </div>
    </div>
  );
}
