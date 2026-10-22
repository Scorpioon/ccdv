import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { GlobalShell } from "./components/GlobalShell";
import "./styles/tokens.css";
import "./styles/global.css";
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
        <GlobalShell><Outlet /></GlobalShell>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
