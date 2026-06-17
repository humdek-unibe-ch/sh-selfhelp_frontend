/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import NotFoundStyle from './components/frontend/styles/NotFoundStyle';

/**
 * Client half of the 404 page.
 *
 * The Mantine `Button` with `component={Link}` receives a *function*
 * (`LinkComponent`) as a prop, which cannot cross the RSC → CC serialization
 * boundary. So the server component (`not-found.tsx`) reads the auth cookie
 * and passes only a plain boolean prop to this client component, which then
 * renders the configurable `NotFoundStyle`.
 *
 * The 404 route is served outside the CMS, so no `style` payload flows here;
 * we render `NotFoundStyle` with its built-in defaults. It shares the same
 * Container + Paper + icon + title + text + actions structure as
 * `MissingStyle` / `NoAccessStyle`.
 */
export function NotFoundClient({ isAuthenticated }: { isAuthenticated: boolean }) {
    return <NotFoundStyle style={{}} styleProps={{}} cssClass="" isAuthenticated={isAuthenticated} />;
}
