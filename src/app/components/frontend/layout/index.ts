// Client Components - Safe to import in client components
export { WebsiteHeaderMenu } from './WebsiteHeaderMenu';
export { WebsiteFooter } from './WebsiteFooter/WebsiteFooter';

// `WebsiteHeader` is intentionally NOT re-exported through this barrel.
// It is now a Server Component (uses `next/headers` via `resolveLanguageSSR`)
// and re-exporting it here would risk pulling server-only modules into
// any client bundle that imports anything else from this barrel. The
// only consumer (`src/app/[[...slug]]/layout.tsx`) imports it directly
// from `./WebsiteHeader`.