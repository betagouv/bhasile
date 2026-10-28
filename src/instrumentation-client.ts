import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://3acdbeb9544bbe2ff17673b6c7db2b76@sentry.incubateur.net/251",
  tracesSampleRate: 1,
  debug: false,
  enabled:
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PUBLIC_IS_PRODUCTION === "true",
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
