/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import SlugShell from '../../../[[...slug]]/SlugLayout/SlugShell';
import { WebsiteHeader } from './header/WebsiteHeader';
import { WebsiteFooter } from './footer/WebsiteFooter';

/**
 * Shared layout shell for standalone pages that live outside the
 * `[[...slug]]` catch-all but still need the website header and footer
 * (e.g. static fallback pages, error pages, auth/profile).
 *
 * Reuses SlugShell so the AppShell header height, sticky footer, and
 * preview mode indicator are consistent with CMS-driven pages.
 */
export default async function WebsiteLayout({ children }: { children: React.ReactNode }) {
    return (
        <SlugShell
            isHeadless={false}
            header={<WebsiteHeader />}
            footer={<WebsiteFooter />}
        >
            {children}
        </SlugShell>
    );
}
