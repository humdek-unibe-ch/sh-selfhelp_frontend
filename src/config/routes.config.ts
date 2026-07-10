/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
// Frontend route constants for client-side navigation.
//
// These match the *URL* column on the corresponding `pages` rows in the CMS.
// CMS page keywords now use kebab-case and match the URL segments directly —
// no alias mapping needed.
//
// Static fallback routes exist under `/auth/...` for system pages; the slug
// catch-all redirects there when the CMS payload is empty so operators are
// never locked out of their own install.
export const ROUTES = {
  // System page URLs that match the CMS database
  LOGIN: '/login',
  REGISTER: '/register',
  TWO_FACTOR_AUTH: '/two-factor-authentication',
  // Canonical public reset URL (DB routing, issue #30). The CMS `reset-password`
  // page is resolved from `/reset`; `/reset/{user_id}/{token}` carries the
  // emailed link. `/reset-password` stays a valid alias on the backend.
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
  // Full-screen CMS Live Preview (admin-only; opens in a new tab). Append the
  // page keyword: `${ROUTES.LIVE_PREVIEW}/${keyword}`.
  LIVE_PREVIEW: '/admin/preview',
  // Add more as needed
};
