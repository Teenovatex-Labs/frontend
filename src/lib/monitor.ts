// Browser error alerts. Off unless NEXT_PUBLIC_SENTRY_DSN is set. Members are teenagers, so nothing
// personal is sent: no session recording, no tracing, no request details, no user info, no page
// addresses or click trails. Only what broke and where in the code. The library loads after the page
// is idle, so it never slows down first load.
const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

type SentryModule = typeof import("@sentry/browser");
let loading: Promise<SentryModule | null> | undefined;

function load(): Promise<SentryModule | null> {
  if (!DSN || typeof window === "undefined") return Promise.resolve(null);
  loading ??= import("@sentry/browser")
    .then((Sentry) => {
      Sentry.init({
        dsn: DSN,
        environment: window.location.hostname.startsWith("localhost") ? "development" : "production",
        tracesSampleRate: 0,
        maxBreadcrumbs: 0,
        beforeBreadcrumb: () => null,
        beforeSend(event) {
          delete event.request;
          delete event.user;
          return event;
        },
        // Browser extensions and flaky networks throw a lot of noise that is not ours.
        ignoreErrors: ["ResizeObserver loop", "Non-Error promise rejection captured", "Failed to fetch", "NetworkError", "Load failed"],
        denyUrls: [/extensions\//i, /^chrome:\/\//i, /^moz-extension:\/\//i],
      });
      return Sentry;
    })
    .catch(() => null);
  return loading;
}

/** Starts watching for errors once the browser is idle. */
export function startMonitoring(): void {
  if (!DSN || typeof window === "undefined") return;
  const go = () => void load();
  const w = window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number };
  if (w.requestIdleCallback) w.requestIdleCallback(go, { timeout: 4000 });
  else window.setTimeout(go, 2000);
}

/** Reports an error we caught ourselves (for example in an error screen). Safe when monitoring is off. */
export function reportBrowserError(error: unknown): void {
  void load().then((Sentry) => Sentry?.captureException(error));
}
