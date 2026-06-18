/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { AdminShell } from "./AdminShell";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { ROUTES } from '../../../../config/routes.config';
import { LoadingOverlay } from "@mantine/core";
interface AdminShellWrapperProps {
    children: React.ReactNode;
    aside?: React.ReactNode;
    asideWidth?: number;
}

export function AdminShellWrapper({ children, aside, asideWidth }: AdminShellWrapperProps) {
    const { isAuthenticated, hasAdminAccess, isLoading } = useAuth();
    const router = useRouter();

    // Navigation is a side effect, so the redirect stays in an effect.
    useEffect(() => {
        // If still loading authentication data, wait
        if (isLoading) {
            return;
        }

        // Authentication state is now determined
        if (!isAuthenticated) {
            // Not logged in
            router.replace(ROUTES.LOGIN);
        } else if (!hasAdminAccess()) {
            // Logged in but doesn't have admin access
            router.replace(ROUTES.NO_ACCESS);
        }
    }, [hasAdminAccess, isAuthenticated, isLoading, router]);

    // Show the loading overlay while auth is resolving and while a redirect is
    // pending (not authenticated or no admin access). Once resolved with admin
    // access, render the shell. This mirrors the previous isChecking gate
    // without a set-state-in-effect.
    const willRedirect = !isLoading && (!isAuthenticated || !hasAdminAccess());
    if (isLoading || willRedirect) {
        return <LoadingOverlay visible={true} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />;
    }

    return (
        <AdminShell aside={aside} asideWidth={asideWidth}>
            {children}
        </AdminShell>
    );
}
