'use client';

import { AppShell, MantineProvider } from "@mantine/core";
import { AdminHeader } from "../admin-header/AdminHeader";
import { AdminNavbar } from "../admin-navbar/AdminNavbar";
import { theme } from "../../../../theme";
import { useDisclosure } from '@mantine/hooks';
import { useIsAuthenticated } from '@refinedev/core';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ROUTES } from "@/config/routes.config";

interface AdminShellProps {
    children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
    const [opened, { toggle }] = useDisclosure();
    const { data: { authenticated } = {}, isLoading: isAuthLoading } = useIsAuthenticated();
    const [localAuth, setLocalAuth] = useState<boolean | null>(null);
    const router = useRouter();

    // Initialize auth state from localStorage
    useEffect(() => {
        const hasToken = Boolean(localStorage.getItem('access_token'));
        setLocalAuth(hasToken);

        if (!hasToken) {
            router.push(ROUTES.LOGIN);
        }
    }, [router]);

    // Sync server auth state when it changes
    useEffect(() => {
        if (typeof authenticated !== 'undefined') {
            setLocalAuth(authenticated);
            if (!authenticated) {
                router.push(ROUTES.LOGIN);
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
                header={{ height: 60 }}
                navbar={{
                    width: 300,
                    breakpoint: 'sm',
                    collapsed: { mobile: !opened }
                }}
                padding="md"
            >
                <AppShell.Header>
                    <AdminHeader opened={opened} onToggle={toggle} />
                </AppShell.Header>
                <AppShell.Navbar>
                    <AdminNavbar />
                </AppShell.Navbar>
                <AppShell.Main>
                    {children}
                </AppShell.Main>
            </AppShell>
        </MantineProvider>
    );
}