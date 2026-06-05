// Swap out captureError / captureMessage bodies for Sentry once you have a DSN:
//   import * as Sentry from "@sentry/nextjs";
//   export const captureError = Sentry.captureException;
//   export const captureMessage = Sentry.captureMessage;

export function captureError(error: unknown, context?: Record<string, unknown>) {
  console.error("[Shadowling Error]", error, context ?? "");
}

export function captureMessage(message: string, level: "info" | "warning" = "info") {
  if (level === "warning") {
    console.warn("[Shadowling Warning]", message);
  } else {
    console.info("[Shadowling]", message);
  }
}
