/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useAppNavigation } from '../../../../../hooks/useAppNavigation';
import { type INavigationMenu } from '../../../../../shared';
import { WebsiteHeaderRenderer } from './WebsiteHeaderRenderer';

interface IWebsiteHeaderMenuProps {
    /** Server-resolved `web_header` menu for first paint. */
    initialHeaderMenu?: INavigationMenu | null;
    utilitySlot?: React.ReactNode;
}

/**
 * Website Header Menu — renders the global `web_header` menu via preset.
 */
export function WebsiteHeaderMenu({ initialHeaderMenu = null, utilitySlot }: IWebsiteHeaderMenuProps) {
    const { headerMenu: liveHeaderMenu } = useAppNavigation();

    const menu = liveHeaderMenu ?? initialHeaderMenu;

    return <WebsiteHeaderRenderer menu={menu} utilitySlot={utilitySlot} />;
}
