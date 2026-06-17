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
  RESET_PASSWORD: '/reset-password',
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
