/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { ActionIcon, Tooltip } from '@mantine/core';
import { IconEdit } from '@tabler/icons-react';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { flattenMenuItems } from '@selfhelp/shared';
import { useAuth } from '../../../../hooks/useAuth';
import { useAppNavigation } from '../../../../hooks/useAppNavigation';
import { usePreviewNavigation } from '../../cms/live-preview/PreviewNavigationContext';

/**
 * Floating admin shortcut stacked next to the debug button in the top-left
 * corner. Jumps straight into the admin editor of the page currently being
 * viewed (`/admin/pages/{keyword}`); falls back to the admin dashboard when
 * the keyword cannot be resolved. Hidden for non-admins and inside the CMS
 * Live Preview pane (the preview has its own editing chrome).
 */
export function AdminEditCornerButton() {
    const { hasAdminAccess } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const { navigation } = useAppNavigation();
    const previewNav = usePreviewNavigation();

    // Resolve the CMS keyword of the current URL: exact page-url match in the
    // resolved menus first, else the last path segment (keywords are unique
    // and nested URLs mirror the parent chain).
    const keyword = useMemo(() => {
        const cleanPath = pathname.split('#')[0].split('?')[0].replace(/\/+$/, '') || '/';
        if (navigation) {
            for (const menu of Object.values(navigation.menus)) {
                for (const item of flattenMenuItems(menu?.items ?? [])) {
                    if (item.page?.url === cleanPath) {
                        return item.page.keyword;
                    }
                }
            }
        }
        const segments = cleanPath.split('/').filter(Boolean);
        return segments.length > 0 ? segments[segments.length - 1] : null;
    }, [pathname, navigation]);

    if (!hasAdminAccess() || previewNav !== null || pathname.startsWith('/admin')) {
        return null;
    }

    const href = keyword ? `/admin/pages/${keyword}` : '/admin';

    return (
        <Tooltip label="Edit this page in Admin" position="right">
            <ActionIcon
                onClick={() => router.push(href)}
                variant="subtle"
                size="lg"
                aria-label="Edit this page in Admin"
                style={{
                    // Stacked directly under the debug bug button (top-left corner).
                    position: 'fixed',
                    top: 60,
                    left: 16,
                    zIndex: 1000,
                    backgroundColor: 'var(--mantine-color-grape-6)',
                    color: 'white',
                }}
            >
                <IconEdit size={20} />
            </ActionIcon>
        </Tooltip>
    );
}
