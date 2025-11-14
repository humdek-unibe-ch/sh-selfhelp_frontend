// Frontend route constants for client-side navigation
// Updated to use CMS system page URLs
export const ROUTES = {
  // System page URLs that match the CMS database
  LOGIN: '/auth/login',
  TWO_FACTOR_AUTH: '/two-factor-authentication',
  VERIFY_2FA: '/two-factor-authentication', // Keep alias for backward compatibility
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
