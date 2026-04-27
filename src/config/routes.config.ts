// Frontend route constants for client-side navigation.
//
// These match the *URL* column on the corresponding `pages` rows in the CMS,
// NOT the keyword. The dynamic slug catch-all (`src/app/[[...slug]]/page.tsx`)
// resolves URLs back to the keyword (with a small alias map for the
// `no_access` / `reset_password` mismatch).
//
// `/auth/login` and `/auth/two-factor-authentication` still exist as static
// fallback routes (`src/app/auth/...`) — the slug catch-all redirects there
// when the CMS payload for `login` / `two-factor-authentication` is empty,
// so operators are never locked out of their own install. Day-to-day links
// always point at the public-facing CMS URL.
export const ROUTES = {
  // System page URLs that match the CMS database
  LOGIN: '/login',
  TWO_FACTOR_AUTH: '/two-factor-authentication',
  RESET_PASSWORD: '/reset',
  VALIDATE: '/validate', // Base path, actual URL includes parameters
  HOME: '/home',
  PROFILE: '/profile',
  NO_ACCESS: '/no-access',
  MISSING: '/missing',
  // Legal pages
  AGB: '/agb',
  IMPRESSUM: '/impressum',
  DISCLAIMER: '/disclaimer',
  // Add more as needed
};
