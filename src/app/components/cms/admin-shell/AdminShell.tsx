/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { AppShell, Burger, Group, useMantineTheme } from "@mantine/core";
import { AdminNavbar } from "./admin-navbar/AdminNavbar";
import { useHotkeys, useMediaQuery } from '@mantine/hooks';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ROUTES } from "../../../../config/routes.config";
import { DebugMenu } from "../../shared/common/debug";
import { SelfHelpLogo } from "../../shared/common/SelfHelpLogo";
import { useIsSidebarCollapsed, useToggleSidebarCollapsed } from "../../../store/ui.store";
import { useAuthStatus } from "../../../../hooks/useUserData";
import { useIsClient } from "../../../../hooks/useIsClient";
import classes from './AdminShell.module.css';

const NAVBAR_WIDTH = 340;
const NAVBAR_RAIL_WIDTH = 72;

interface AdminShellProps {
    children: React.ReactNode;
    aside?: React.ReactNode;
    asideWidth?: number;
    /** Gives Main a definite height so `height: 100%` children resolve. */
    fullHeightMain?: boolean;
}

export function AdminShell({ children, aside, asideWidth = 400, fullHeightMain = false }: AdminShellProps) {
    // Below `sm` the navbar is a drawer opened from the header's burger. It is
    // open only on the page it was opened on, so following a link closes it.
    const pathname = usePathname();
    const [openedOn, setOpenedOn] = useState<string | null>(null);
    const opened = openedOn === pathname;
    const theme = useMantineTheme();
    const isDesktop = useMediaQuery(`(min-width: ${theme.breakpoints.sm})`, undefined, { getInitialValueInEffect: false });
    const isSidebarCollapsed = useIsSidebarCollapsed();
    const toggleSidebarCollapsed = useToggleSidebarCollapsed();
    // The persisted choice is applied only after hydration, so the server
    // markup and the first client render agree (the store reads
    // localStorage synchronously on the client).
    const isClient = useIsClient();
    const collapsed = isClient && isSidebarCollapsed && isDesktop;
    const [hasToggled, setHasToggled] = useState(false);
    const toggleSidebar = () => {
        setHasToggled(true);
        toggleSidebarCollapsed();
    };
    useHotkeys([['mod+B', toggleSidebar]]);
    // Derive auth from our SSR-hydrated `['user-data']` cache rather than
    // Refine's separate `useIsAuthenticated` query, which starts every
    // render with `isLoading: true` and caused the admin shell to flash
    // empty on every reload even though the cookie + user payload were
    // already present.
    const { isAuthenticated, isLoading: isAuthLoading, isBackendUnavailable } = useAuthStatus();
    const router = useRouter();

    // The server layout (`src/app/admin/layout.tsx`) already verifies
    // `sh_auth` exists and calls `/auth/user-data`. This effect only handles
    // the *mid-session expiry* case: the BFF returns a genuine 401 and
    // `useAuthStatus` resolves to `isAuthenticated === false`, so we bounce
    // the user to login.
    //
    // It deliberately does NOT bounce on a TRANSIENT backend outage
    // (`isBackendUnavailable`): while the manager restarts Symfony for a
    // plugin/system operation, user-data briefly answers 5xx/network and the
    // operator must stay put — the transient-aware retry recovers in place
    // instead of sending them to the login page (and making them think the
    // session expired).
    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated && !isBackendUnavailable) {
            router.replace(ROUTES.LOGIN);
        }
    }, [isAuthenticated, isAuthLoading, isBackendUnavailable, router]);

    if (!isAuthLoading && !isAuthenticated && !isBackendUnavailable) {
        return null;
    }

    return (
        <>
            <AppShell
                navbar={{
                    width: collapsed ? NAVBAR_RAIL_WIDTH : NAVBAR_WIDTH,
                    breakpoint: 'sm',
                    collapsed: { mobile: !opened, desktop: false },
                }}
                header={{ height: { base: 56, sm: 0 } }}
                transitionDuration={hasToggled ? 200 : 0}
                aside={aside ? {
                    width: asideWidth,
                    breakpoint: 'md',
                    collapsed: { mobile: true, desktop: false }
                } : undefined}
                padding={0}
            >
                <AppShell.Header hiddenFrom="sm" px="md">
                    <Group h="100%" justify="space-between" wrap="nowrap">
                        <SelfHelpLogo variant="compact" />
                        <Burger
                            opened={opened}
                            onClick={() => {
                                setHasToggled(true);
                                setOpenedOn(opened ? null : pathname);
                            }}
                            size="sm"
                            aria-label={opened ? 'Close navigation' : 'Open navigation'}
                            aria-expanded={opened}
                            aria-controls="admin-navbar"
                        />
                    </Group>
                </AppShell.Header>
                <AppShell.Navbar id="admin-navbar" className={classes.navbar}>
                    <AdminNavbar collapsed={collapsed} onToggleCollapsed={toggleSidebar} />
                </AppShell.Navbar>
                {/* `100dvh` (not `h-screen`) — Mantine pads Main by the
                    navbar/header offsets, which `h-screen` would overflow. */}
                <AppShell.Main
                    className={fullHeightMain ? 'flex flex-col overflow-hidden' : 'max-h-screen'}
                    style={fullHeightMain ? { height: '100dvh' } : undefined}
                >
                    {children}
                </AppShell.Main>
                {aside && (
                    <AppShell.Aside p={0}>
                        {aside}
                    </AppShell.Aside>
                )}
            </AppShell>
            <DebugMenu />
        </>
    );
}