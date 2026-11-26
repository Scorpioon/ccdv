import { useMotionPolicy } from "../motion/reducedMotion";

/* N6 R1 C3 (OPERATOR, STUDIO_resp3): the `V` under a cover's art on phones and
   tablets. It scrolls to the page's next section. Hidden from 1024px up (CSS,
   `.cover-next`), where the stepper owns the page. */
export function CoverNext({ className }: { className?: string }) {
  const { reduced } = useMotionPolicy();
  return (
    <button
      type="button"
      className={`cover-next${className ? ` ${className}` : ""}`}
      aria-label="Next section"
      onClick={(event) => {
        /* the `.pin-snap` markers are display:none on phones: the next real section is the target */
        let next = event.currentTarget.closest("section")?.nextElementSibling ?? null;
        while (next?.classList.contains("pin-snap")) next = next.nextElementSibling;
        next?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      }}
    >
      V
    </button>
  );
}
