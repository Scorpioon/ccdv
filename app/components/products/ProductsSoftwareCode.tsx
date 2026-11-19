import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Chip, ChipGear } from "../studio/studioMarks";
import { ProductsTopicArt } from "./ProductsArtwork";
import { LitCube, type LitPattern } from "./LitCube";
import { PENDING, PRODUCTS_TOPICS } from "../../data/productsContent";

/* \\Our Software Code. CORR04 (OPERATOR): desktop is back to
   PRODUCTS_v2.svg's four columns — every topic side by side (figure, label
   chip, headline, body), all four figures animating; the tab rows and pager
   are not shown (CSS). The lit cube there is the hero cube only (one cube on
   desktop), so the LitCube below is hidden. Phones keep
   PRODUCTS_responsive_v2.svg (y585..1419): rows, one panel
   (figure, headline, body), four pager squares — and the LitCube is the
   page's one cube, drawn first with the chip and rows over its foot, as the
   Studio sphere / Services voxel face sit behind their selectors (CSS order;
   it holds nothing focusable, so reading order is unchanged).

   Every selection — a click, or the arrow / Home / End keys, re-selecting the
   current row included — asks the route for a new lit pattern (`onSelect`).
   On desktop there are no rows to click, so the cube rolls once on load.
   On phones the label chip inside each panel is visually hidden (the row
   names it). The
   pager squares duplicate the tabs, so they stay out of the tab order and the
   accessibility tree. */
export function ProductsSoftwareCode({
  pattern,
  onSelect,
  reduced,
}: {
  pattern: LitPattern;
  onSelect: () => void;
  reduced: boolean;
}) {
  const [selected, setSelected] = useState(0);
  const tabsRef = useRef<HTMLDivElement>(null);
  const last = PRODUCTS_TOPICS.length - 1;
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => setWide(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const select = (i: number, focus = false) => {
    setSelected(i);
    onSelect();
    if (focus) tabsRef.current?.querySelectorAll<HTMLElement>('[role="tab"]')[i]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const step: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    if (event.key in step) select((selected + step[event.key] + PRODUCTS_TOPICS.length) % PRODUCTS_TOPICS.length, true);
    else if (event.key === "Home") select(0, true);
    else if (event.key === "End") select(last, true);
    else return;
    event.preventDefault();
  };

  return (
    <section className="pv-code" aria-labelledby="pv-code-title">
      <Chip tone="lilac" as="h2" id="pv-code-title" className="pv-chip pv-code__title">
        {"\\\\Our Software Code"}
      </Chip>

      <div
        className="pv-code__tabs"
        role="tablist"
        aria-labelledby="pv-code-title"
        aria-orientation="vertical"
        ref={tabsRef}
        onKeyDown={onKeyDown}
      >
        {PRODUCTS_TOPICS.map((topic, i) => (
          <button
            key={topic.key}
            type="button"
            className="pv-code__tab"
            role="tab"
            id={`pv-tab-${topic.key}`}
            aria-selected={i === selected}
            aria-controls={`pv-topic-${topic.key}`}
            tabIndex={i === selected ? 0 : -1}
            onClick={() => select(i)}
          >
            <ChipGear className="chip__gear" />
            <span>{topic.label ?? PENDING}</span>
          </button>
        ))}
      </div>

      <LitCube className="pv-code__cube" pattern={pattern} />
      <span className="pv-code__sq" aria-hidden="true" />

      <div className="pv-code__topics">
        {PRODUCTS_TOPICS.map((topic, i) => (
          <div
            key={topic.key}
            className="pv-topic"
            role="tabpanel"
            id={`pv-topic-${topic.key}`}
            aria-labelledby={`pv-label-${topic.key}`}
            data-active={i === selected}
          >
            <div className="pv-topic__art">
              <ProductsTopicArt topic={topic.key} active={wide || i === selected} reduced={reduced} />
            </div>
            <Chip tone="lilac" as="h3" id={`pv-label-${topic.key}`} className="pv-chip pv-topic__label">
              {topic.label ?? PENDING}
            </Chip>
            <p className="pv-topic__headline" data-pending={topic.headline ? undefined : true}>
              {topic.headline ?? PENDING}
            </p>
            {topic.body.map((line) => (
              <p key={line} className="pv-topic__body">
                {line}
              </p>
            ))}
          </div>
        ))}
      </div>

      <div className="pv-code__pager" aria-hidden="true">
        {PRODUCTS_TOPICS.map((topic, i) => (
          <button
            key={topic.key}
            type="button"
            className="pv-code__page"
            tabIndex={-1}
            data-active={i === selected}
            onClick={() => select(i)}
          />
        ))}
      </div>
    </section>
  );
}
