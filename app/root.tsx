import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { GlobalShell } from "./components/GlobalShell";
import "./styles/tokens.css";
import "./styles/global.css";
export function links() {
  return [{ rel: "icon", type: "image/svg+xml", href: "/ccdv-gear-favicon.svg" }];
}
export default function Root() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {/* GF09-D: mobile-only notice. In flow above the shell, so it never covers
            the masthead or navigation; hidden outside the mobile query in global.css. */}
        <p className="mobile-notice" role="note">we are working on the responsive <span role="img" aria-label="construction">🚧</span>, check on desktop!</p>
        <GlobalShell><Outlet /></GlobalShell>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
