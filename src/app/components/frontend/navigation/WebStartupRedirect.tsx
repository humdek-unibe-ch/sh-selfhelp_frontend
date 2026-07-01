/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { resolveWebStartupPath } from '@selfhelp/shared';
import { useAppNavigation } from '../../../../hooks/useAppNavigation';
import { useAuth } from '../../../../hooks/useAuth';

/**
 * Applies web guest/user startup redirects for `/` when the configured landing
 * page URL differs from the resolved root page.
 */
export function WebStartupRedirect(): null {
    const router = useRouter();
    const pathname = usePathname();
    const { navigation } = useAppNavigation();
    const { isAuthenticated } = useAuth();
    const redirectedRef = useRef(false);

    useEffect(() => {
        if (!navigation || pathname !== '/' || redirectedRef.current) {
            return;
        }
        const target = resolveWebStartupPath(navigation.startup, isAuthenticated);
        if (!target || target === '/') {
            return;
        }
        redirectedRef.current = true;
        router.replace(target);
    }, [navigation, pathname, isAuthenticated, router]);

    return null;
}
