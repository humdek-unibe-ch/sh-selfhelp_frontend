/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import type { INavigationMenu } from '../../../../../shared';
import { useAppNavigation } from '../../../../../hooks/useAppNavigation';
import { FooterLinks } from './FooterLinks';

/**
 * Public footer links that follow client-side language switches: the
 * language-keyed navigation query (same source as the header) wins, and the
 * server-rendered menu is only the first-paint fallback.
 */
export function WebsiteFooterLinks({ initialFooterMenu }: { initialFooterMenu: INavigationMenu | null }) {
    const { footerMenu } = useAppNavigation();
    return <FooterLinks footerMenu={footerMenu ?? initialFooterMenu} />;
}
