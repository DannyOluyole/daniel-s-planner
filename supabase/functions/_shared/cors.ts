// These functions have no legitimate browser-based caller other than the
// app itself running in Expo's web target (native mobile fetch and the
// browser extension's direct PostgREST calls are never subject to CORS at
// all) — so a wildcard origin only ever benefits a caller that shouldn't be
// trusted. Reflect the request's own Origin back only when it's a known
// dev/prod origin; otherwise fail closed.
const ALLOWED_ORIGINS = [
  // Add the deployed web app's own origin here once one exists, e.g.:
  // "https://app.checkpoint.example",
];

function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false;
  // Any localhost/127.0.0.1 port — safe to allow broadly since a page
  // served from the developer's own machine is a different threat model
  // than an arbitrary third-party origin.
  if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return true;
  return ALLOWED_ORIGINS.includes(origin);
}

export function corsHeadersFor(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  return {
    "Access-Control-Allow-Origin": isAllowedOrigin(origin) ? origin : "null",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    Vary: "Origin",
  };
}
