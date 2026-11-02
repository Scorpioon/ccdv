/* Single canonical data source for /services (MTG03, FBI-023..027).

   Shape: category (5) -> services (N per category) -> description. Every id is
   scoped by its parent (`${categoryId}` / `${categoryId}-${n}`), so a service
   id can never exist under two categories and the right pane can never show
   category A's child with category B's content.

   Content status: NO category-specific service names or descriptions are
   approved. Labels/descriptions below are the R1.1 placeholder wording
   (`SVC-DEC-005`), numbered per slot so each service is distinguishable, and
   every description is flagged `pending` — editorial debt routed to MTG04.
   `work_assets/copys_v2.txt` was not present in the workspace when this was
   written, so no corrected-Services copy was compared or used.

   Counts are data, not a rule: `PLACEHOLDER_SERVICE_COUNT` mirrors the three
   rows drawn in R1.1 and is only the observed reference state. A category
   with real content replaces its `services` array with any length. */

export interface ServiceItem {
  id: string;
  label: string;
  description: string;
  /* true until the description is operator-approved copy */
  pending: boolean;
}

export interface ServiceCategory {
  id: string;
  label: string;
  services: ServiceItem[];
}

const PLACEHOLDER_SERVICE_COUNT = 3;

function placeholderServices(categoryId: string, count: number): ServiceItem[] {
  return Array.from({ length: count }, (_, index) => {
    const slot = index + 1;
    return {
      id: `${categoryId}-${slot}`,
      label: `Service block ${slot}`,
      description: `Description of services mentioned in service block ${slot}`,
      pending: true,
    };
  });
}

/* Category names are read verbatim from pages_services.png and are provisional
   (`SVC-DEC-001`). */
const CATEGORY_LABELS: ReadonlyArray<readonly [id: string, label: string]> = [
  ["strategy", "Strategy"],
  ["product", "Product"],
  ["experience", "Experience"],
  ["ai-rnd", "AI / RND"],
  ["automatization", "Automatization"],
];

export const SERVICE_CATEGORIES: ServiceCategory[] = CATEGORY_LABELS.map(([id, label]) => ({
  id,
  label,
  services: placeholderServices(id, PLACEHOLDER_SERVICE_COUNT),
}));

/* "Experience" is the one category R1.1 draws filled red, the only sourced
   initial-state evidence for this control. */
export const DEFAULT_SERVICE_CATEGORY_ID = "experience";
