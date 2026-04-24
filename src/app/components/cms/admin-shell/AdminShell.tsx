'use client';

import { AppShell } from "@mantine/core";
import { AdminNavbar } from "./admin-navbar/AdminNavbar";
import { useDisclosure } from '@mantine/hooks';
import { useIsAuthenticated } from '@refinedev/core';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ROUTES } from "../../../../config/routes.config";
import { DebugMenu } from "../../shared/common/debug";
import { useIsSidebarCollapsed } from "../../../store/ui.store";

interface AdminShellProps {
    children: React.ReactNode;
    aside?: React.ReactNode;
    asideWidth?: number;
}

export function AdminShell({ children, aside, asideWidth = 400 }: AdminShellProps) {
    const [opened, { toggle }] = useDisclosure();
    const isSidebarCollapsed = useIsSidebarCollapsed();
    const { data: { authenticated } = {}, isLoading: isAuthLoading } = useIsAuthenticated();
    const router = useRouter();

    // The server layout (`src/app/admin/layout.tsx`) already verifies
    // `sh_auth` exists and calls `/auth/user-data`. This effect only handles
    // the *mid-session expiry* case: Refine sees a 401 from the BFF and
    // returns `authenticated === false`, so we bounce the user to login.
    useEffect(() => {
        if (!isAuthLoading && authenticated === false) {
            router.replace(ROUTES.LOGIN);
        }
    }, [authenticated, isAuthLoading, router]);

    if (authenticated === false) {
        return null;
    }

    return (
        <>
            <AppShell
                navbar={{
                    width: 300,
                    breakpoint: 'sm',
                    // `mobile`: burger toggle (transient, useDisclosure).
                    // `desktop`: persisted user pref in the UI store so the
                    //            chosen layout survives navigation + reloads.
                    collapsed: { mobile: !opened, desktop: isSidebarCollapsed },
                }}
                aside={aside ? {
                    width: asideWidth,
                    breakpoint: 'md',
                    collapsed: { mobile: true, desktop: false }
                } : undefined}
                padding={0}
            >
                <AppShell.Navbar>
                    <AdminNavbar />
                </AppShell.Navbar>
                <AppShell.Main className="max-h-screen">
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