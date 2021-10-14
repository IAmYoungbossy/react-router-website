import * as React from "react";
import { useLocation, Outlet } from "react-router-dom";
import {
  ErrorBoundaryComponent,
  LinksFunction,
  RouteComponent,
  useCatch,
} from "remix";
import { Links, LiveReload, Meta, Scripts, json } from "remix";
import cx from "clsx";
import { SiteFooter } from "./components/site-footer";
import { SiteHeader } from "./components/site-header";
import { DocsSiteHeader } from "./components/docs-site-header";
import { DocsSiteFooter } from "./components/docs-site-footer";
import { useScrollRestoration } from "./hooks/scroll-restoration";
import tailwind from "./styles/tailwind.css";
import global from "./styles/global.css";
import { SkipNavLink, SkipNavContent } from "@reach/skip-nav";

export let links: LinksFunction = () => {
  return [
    { rel: "stylesheet", href: global },
    { rel: "stylesheet", href: tailwind },
  ];
};

function DocsLiveReload() {
  if (process.env.NODE_ENV !== "development") return null;
  return <script src="http://localhost:35729/livereload.js?snipver=1"></script>;
}

const Document: React.FC<{
  forceDarkMode?: boolean;
  className?: string;
}> = ({ children, className, forceDarkMode }) => {
  return (
    <html lang="en" data-force-dark={forceDarkMode ? "" : undefined}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <meta name="theme-color" content="var(--hue-0000)" />
      </head>

      <body
        className={cx(
          className,
          "bg-[color:var(--hue-0000)] text-[color:var(--hue-1000)]"
        )}
      >
        {children}
        <Scripts />
        <LiveReload />
        {/* <DocsLiveReload /> */}
      </body>
    </html>
  );
};

export let App: RouteComponent = () => {
  let location = useLocation();
  let pathname = location.pathname;
  let isDocsPage = React.useMemo(
    () => pathname.startsWith("/docs/"),
    [pathname]
  );
  let skipNavRef = React.useRef<HTMLDivElement | null>(null);

  useScrollRestoration();
  useRouteChangeFocusAndLiveRegionUpdates({ location, focusRef: skipNavRef });

  if (isDocsPage) {
    return (
      <Document>
        <SkipNavLink />
        <div className="flex flex-col">
          <DocsSiteHeader className="w-full flex-shrink-0" />
          <div className="flex flex-col">
            <SkipNavContent ref={skipNavRef} tabIndex={-1} />
            <Outlet />
          </div>
        </div>
        <DocsSiteFooter className="w-full flex-shrink-0" />
      </Document>
    );
  }

  return (
    <Document forceDarkMode>
      <SkipNavLink />
      <SiteHeader />
      <div className="flex flex-col min-h-screen">
        <div className="flex-auto">
          <SkipNavContent ref={skipNavRef} tabIndex={-1} />
          <Outlet />
        </div>
      </div>
      <SiteFooter />
    </Document>
  );
};

export default App;

export let ErrorBoundary: ErrorBoundaryComponent = ({ error }) => {
  console.error(error);
  return (
    <Document forceDarkMode>
      <h1>App Error</h1>
      <pre>{error.message}</pre>
      <p>
        Replace this UI with what you want users to see when your app throws
        uncaught errors.
      </p>
    </Document>
  );
};

export let CatchBoundary = () => {
  let caught = useCatch();
  return (
    <Document forceDarkMode>
      <h1>{caught.status}</h1>
      <pre>{caught.statusText}</pre>
    </Document>
  );
};

function useRouteChangeFocusAndLiveRegionUpdates({
  location,
  focusRef,
}: {
  location: ReturnType<typeof useLocation>;
  focusRef: React.RefObject<null | undefined | HTMLElement>;
}) {
  let pathname = location.pathname;
  let liveRegionRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    liveRegionRef.current = document.createElement("div");
    liveRegionRef.current.setAttribute("role", "status");
    liveRegionRef.current.classList.add("sr-only");
    liveRegionRef.current.id = "route-change-region";
    document.body.appendChild(liveRegionRef.current);
  }, []);

  let firstRenderRef = React.useRef(true);
  React.useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }

    if (focusRef.current) {
      // FIXME: this breaks scroll restoration, we need to figure out how to
      // manage focus and scroll without sacrificing one for the other. For now
      // we're prioritizing scroll restoration since browsers don't really have
      // any good answers for focus on back clicks either.
      // focusRef.current.focus();
    }

    if (liveRegionRef.current) {
      let pageTitle =
        pathname === "/"
          ? "Home page"
          : document.title.replace("React Router | ", "");
      liveRegionRef.current.textContent = pageTitle;
    }
  }, [pathname]);
}
