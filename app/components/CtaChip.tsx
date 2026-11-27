import type { CSSProperties } from "react";
import { Link } from "react-router";
import type { TransitionTarget } from "../motion/transitionCoordinator";
import { useTransitionLink } from "./GlobalShell";

/* R3 S7: the one call-to-action chip (light panel, ink text, hairline under it,
   a trailing arrow). It goes through the transition coordinator, like every
   in-app link, so a plain click rises into the next page and a modified click
   stays native. `.cta-chip` shares its rules with the older `.cs__cta`
   (global.css); `className` lets a scene keep its own placement class. */
export function CtaChip({
  to,
  label,
  className,
  spawn,
  style,
}: {
  to: TransitionTarget;
  label: string;
  className?: string;
  spawn?: boolean;
  style?: CSSProperties;
}) {
  const link = useTransitionLink();
  return (
    <Link
      className={`cta-chip${className ? ` ${className}` : ""}`}
      {...link(to)}
      {...(spawn ? { "data-spawn": "" } : {})}
      style={style}
    >
      <span>{label}</span>
      <span aria-hidden="true">{"→"}</span>
    </Link>
  );
}
