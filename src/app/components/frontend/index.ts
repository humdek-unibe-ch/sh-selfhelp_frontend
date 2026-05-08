/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
// Frontend Components - User-facing components for content display
export * from './content';
export * from './layout';
export * from './styles';

// Server Components - These need to be imported directly, not through the main index
// because they contain server-only imports that don't work in client components
// export { WebsiteHeaderMenuServer } from './layout/WebsiteHeaderMenuServer';
// export { WebsiteFooterServer } from './layout/WebsiteFooterServer';