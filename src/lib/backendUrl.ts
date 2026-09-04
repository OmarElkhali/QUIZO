const configuredBackendUrl = String(import.meta.env.VITE_BACKEND_URL || '').trim();
const pointsToLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(?::\d+)?(?:\/|$)/i.test(
  configuredBackendUrl,
);

// A production browser must never call the developer's local Flask server.
// Vercel rewrites /api/* to the deployed Render backend.
export const BACKEND_API_URL =
  import.meta.env.PROD && pointsToLocalhost
    ? '/api'
    : configuredBackendUrl || '/api';
