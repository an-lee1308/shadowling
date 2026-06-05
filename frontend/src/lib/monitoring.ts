// To enable Sentry:
//   1. npm install @sentry/nextjs
//   2. Set NEXT_PUBLIC_SENTRY_DSN in .env.local
//   3. Uncomment the Sentry lines below

// import * as Sentry from "@sentry/nextjs";
// if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
//   Sentry.init({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN, environment: process.env.NODE_ENV });
// }

const isDev = process.env.NODE_ENV === "development";

export function captureError(error: unknown, context?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  if (isDev) {
    console.error("[Error]", message, context ?? "", stack ?? "");
  } else {
    // Production: structured log picked up by log aggregators (Vercel, Railway, etc.)
    console.error(JSON.stringify({ level: "error", message, context, stack, ts: new Date().toISOString() }));
    // Sentry.captureException(error, { extra: context });
  }
}

export function captureMessage(message: string, level: "info" | "warning" = "info") {
  if (isDev) {
    level === "warning" ? console.warn("[Warning]", message) : console.info("[Info]", message);
  } else {
    console.log(JSON.stringify({ level, message, ts: new Date().toISOString() }));
    // Sentry.captureMessage(message, level === "warning" ? "warning" : "info");
  }
}
