import { CcdvIdentityMark, CollapseCreativeMark } from "./marks/ContactIdentityMarks";

/* Contact's two-column directory (`CTC-010`-`CTC-024`).

   Link provenance, exactly per `CTC-DEC-001`-`005` and the open PENDs they
   leave:
   - Website row (`CTC-021`) and the large Collapse Creative logo
     (`CTC-014`) both resolve to the one verified candidate URL already
     live elsewhere in the shell, `https://collapsecreative.com`
     (`CTC-DEC-003`/`005`).
   - Email rows (`CTC-016`/`019`) and Instagram rows (`CTC-017`/`020`) are
     approved as clickable in principle (`CTC-DEC-001`/`002`) but their
     exact `mailto:`/profile targets are unverified (`CTC-PEND-003`) — no
     URL is derived from the displayed obfuscated text or handle, so these
     render as plain visual rows, not live links.
   - The large CCDV logo (`CTC-012`) is inert (`CTC-DEC-004`), distinct from
     the small shared masthead logo elsewhere on the page.
   - Privacy/Legal and the version/build line (`CTC-023`/`024`) are visual
     placeholders with no route. */

const COLLAPSE_CREATIVE_URL = "https://collapsecreative.com";

interface DirectoryRow {
  tag: string;
  value: string;
  href?: string;
}

interface DirectoryGroup {
  heading: string;
  rows: DirectoryRow[];
}

const GROUPS: DirectoryGroup[] = [
  {
    heading: "[ Get in touch with CCDV ]",
    rows: [
      { tag: "@", value: "[ hello[@]collapsecreative.com ]" },
      { tag: "IG", value: "@cc.dv" },
    ],
  },
  {
    heading: "[ Get in touch with Collapse Creative ]",
    rows: [
      { tag: "@", value: "[ hello[@]collapsecreative.com ]" },
      { tag: "IG", value: "@collapse.creative" },
      { tag: "W", value: "collapsecreative.com", href: COLLAPSE_CREATIVE_URL },
    ],
  },
];

export function ContactDirectory() {
  return (
    <div className="contact-directory">
      <div className="contact-directory__brand">
        <span className="contact-directory__anchor" aria-hidden="true" />
        <div className="contact-directory__identity">
          <p className="contact-directory__caption">[ Collapse Creative: Development Unit ]</p>
          <CcdvIdentityMark className="contact-directory__ccdv" />
        </div>
        <div className="contact-directory__identity">
          <p className="contact-directory__caption">[ Part of: Collapse Creative ]</p>
          <a href={COLLAPSE_CREATIVE_URL} aria-label="Collapse Creative">
            <CollapseCreativeMark className="contact-directory__collapse" />
          </a>
        </div>
        <span className="contact-directory__anchor" aria-hidden="true" />
      </div>

      <div className="contact-directory__groups">
        {GROUPS.map((group) => (
          <div className="contact-directory__group" key={group.heading}>
            <p className="contact-directory__group-heading">{group.heading}</p>
            {group.rows.map((row) => (
              <div className="contact-directory__row" key={`${group.heading}-${row.tag}`}>
                <span className="contact-directory__tag">{row.tag}</span>
                {row.href ? (
                  <a className="contact-directory__value" href={row.href}>
                    {row.value}
                  </a>
                ) : (
                  <span className="contact-directory__value contact-directory__value--pending">{row.value}</span>
                )}
              </div>
            ))}
          </div>
        ))}

        <div className="contact-directory__legal">
          <span>[ Privacy ]</span>
          <span>[ Legal ]</span>
          <span className="contact-directory__version">[ v.0.1.2 Built with Wrkops © 2026 ]</span>
        </div>
      </div>
    </div>
  );
}
