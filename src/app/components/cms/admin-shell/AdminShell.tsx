'use client';

import { AppShell, MantineProvider } from "@mantine/core";
import { AdminNavbar } from "./admin-navbar/AdminNavbar";
import { useDisclosure } from '@mantine/hooks';
import { useIsAuthenticated } from '@refinedev/core';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ROUTES } from "../../../../config/routes.config";
import { theme } from "../../../../../theme";

interface AdminShellProps {
    children: React.ReactNode;
    aside?: React.ReactNode;
    asideWidth?: number;
}

export function AdminShell({ children, aside, asideWidth = 400 }: AdminShellProps) {
    const [opened, { toggle }] = useDisclosure();
    const { data: { authenticated } = {}, isLoading: isAuthLoading } = useIsAuthenticated();
    const [localAuth, setLocalAuth] = useState<boolean | null>(null);
    const router = useRouter();

    // Initialize auth state from localStorage
    useEffect(() => {
        const hasToken = Boolean(localStorage.getItem('access_token'));
        setLocalAuth(hasToken);

        if (!hasToken) {
            router.replace(ROUTES.LOGIN);
        }
    }, [router]);

    // Sync server auth state when it changes
    useEffect(() => {
        if (typeof authenticated !== 'undefined') {
            setLocalAuth(authenticated);
            if (!authenticated) {
                // Use replace instead of push to prevent back button issues
                router.replace(ROUTES.LOGIN);
            }
        }
    }, [authenticated, router]);

    // Don't render anything until we have initial auth state
    if (localAuth === null || isAuthLoading) {
        return null;
    }

    // If not authenticated, don't render the admin shell
    if (!localAuth) {
        return null;
    }

    return (
        <MantineProvider theme={theme}>
            <AppShell
                navbar={{
                    width: 300,
                    breakpoint: 'sm',
                    collapsed: { mobile: !opened }
                }}
                aside={aside ? {
                    width: asideWidth,
                    breakpoint: 'md',
                    collapsed: { mobile: true, desktop: false }
                } : undefined}
                padding="md"
            >
                <AppShell.Navbar>
                    <AdminNavbar />
                </AppShell.Navbar>
                <AppShell.Main className="max-h-screen overflow-y-auto">
                    {children}
                </AppShell.Main>
                {aside && (
                    <AppShell.Aside p={0}>
                        {aside}
                    </AppShell.Aside>
                )}
            </AppShell>
        </MantineProvider>
    );
}