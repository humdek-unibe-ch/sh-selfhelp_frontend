// Client Components - Safe to import in client components
export { WebsiteHeader } from './WebsiteHeader';
export { WebsiteHeaderMenu } from './WebsiteHeaderMenu';
export { WebsiteFooter } from './WebsiteFooter/WebsiteFooter';

// Server Components - Import directly from their files to avoid client component issues
// These contain server-only imports like 'next/headers' that don't work in client components
// export { WebsiteHeaderServer } from './WebsiteHeaderServer';
// export { WebsiteHeaderMenuServer } from './WebsiteHeaderMenuServer';
// export { WebsiteFooterServer } from './WebsiteFooterServer';