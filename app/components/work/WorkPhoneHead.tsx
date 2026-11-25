import { Link } from "react-router";
import { useTransitionLink } from "../GlobalShell";
import { GearMark } from "../marks/GearMark";
import { CcdvPixelMark } from "../marks/CcdvPixelMark";

/* N4 P-J (OPERATOR, WORK V3_responsive / _responsive2, 390 wide): the Work
   head on phones and tablets — a light card (x24, 342 x 281.7, radius 12):
   the gear and the inline CCDV mark (Home), `■ CC: DEV UNIT → WORK ■`, then
   the four other sections. The desktop rail (WorkSidebar) is not used below
   1024. */

const SECTIONS = [
  { label: "STUDIO", to: "/studio" },
  { label: "SERVICES", to: "/services" },
  { label: "PRODUCTS", to: "/products" },
  { label: "CONTACT", to: "/contact" },
];

export function WorkPhoneHead() {
  const link = useTransitionLink();
  return (
    <header className="wv3p-head">
      <Link className="wv3p-head__home" aria-label="CCDV — Home" {...link("/")}>
        <GearMark className="wv3p-head__gear" fill="#1A1A1A" dotFill="#F2F2F2" />
        <CcdvPixelMark variant="inline" className="wv3p-head__pixel" fill="#1A1A1A" />
      </Link>
      <nav className="wv3p-head__nav" aria-label="Sections">
        <p className="wv3p-head__unit">
          <span className="wv3p-head__sq" aria-hidden="true" />
          <span>
            CC: DEV UNIT <span aria-hidden="true">→</span> WORK
          </span>
          <span className="wv3p-head__sq" aria-hidden="true" />
        </p>
        <ul className="wv3p-head__sections">
          {SECTIONS.map(({ label, to }) => (
            <li key={to}>
              <Link className="wv3p-head__section" to={to}>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
