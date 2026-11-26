import { useEffect, useState } from "react";
import { ProductsCard } from "../ProductsCard";
import { ProductsPanel } from "./ProductsPanel";
import { ProductsPhoneCard } from "./ProductsPhoneCard";
import { PRODUCTS, PRODUCTS_DEFAULT_OPEN } from "../../data/productsContent";

/* The Products rail (P1b CORR03, OPERATOR): a product slot opens its panel
   and the panel drops below — on desktop under the whole rail, on phones (one
   column) right under the slot's row. One panel is open at a time; 01 is open
   on load and the open slot closes again on a second click. Every slot keeps
   its card and its panel together in one list item: on desktop the items are
   `display: contents`, so the cards fill the rail's first row and every panel
   is placed in one shared second row spanning it (global.css); on phones each
   item is a block, so its panel follows its row. A closed panel collapses to
   nothing and is hidden from assistive tech (visibility); the drop is a CSS
   height transition, instant under reduced motion.
   CORR04 (OPERATOR): only the three products remain; the empty frames are
   gone, but the rail keeps its eight-column sizes (global.css).
   CORR05 (OPERATOR): on desktop the panels sit beside the cards instead of
   below them — the shared cell is columns 4-8 of the cards' row.
   N6 R1 B6 (OPERATOR): below 1024 the rail is Work-archive-style cards
   (ProductsPhoneCard): always open, so nothing folds or reflows. The desktop
   rail is unchanged; the split is read from matchMedia (min-width: 1024px)
   on the first render, as WorkWorkspace does. */
const DESKTOP = "(min-width: 1024px)";

export function ProductsRail() {
  const [open, setOpen] = useState<string | null>(PRODUCTS_DEFAULT_OPEN);
  const [desktop, setDesktop] = useState(() =>
    typeof window === "undefined" ? true : window.matchMedia(DESKTOP).matches,
  );

  useEffect(() => {
    const query = window.matchMedia(DESKTOP);
    const update = () => setDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  if (!desktop) {
    return (
      <ul className="pv-pcards">
        {PRODUCTS.map((product) => (
          <li key={product.index} className="pv-pcards__item">
            <ProductsPhoneCard product={product} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="pv-rail">
      {PRODUCTS.map((product) => {
        const slot = product.index;
        const isOpen = open === slot;
        const panelId = `pv-panel-${slot}`;
        return (
          <li key={slot} className="pv-rail__slot">
            <ProductsCard
              index={product.index}
              label={product.label}
              kind={product.kind}
              status={product.status}
              open={isOpen}
              panelId={panelId}
              onToggle={() => setOpen(isOpen ? null : slot)}
            />
            <div className="pv-drop" id={panelId} data-open={isOpen}>
              <div className="pv-drop__inner">
                <ProductsPanel index={product.index} panel={product.panel} />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
