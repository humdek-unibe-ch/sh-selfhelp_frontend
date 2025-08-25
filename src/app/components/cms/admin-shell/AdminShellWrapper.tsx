'use client';

import { AdminShell } from "./AdminShell";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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
    const [isChecking, setIsChecking] = useState(true);

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
        
        // Authentication check is complete
        setIsChecking(false);
    }, [hasAdminAccess, isAuthenticated, isLoading, router]);

    // Show loading overlay while checking authentication or while auth is loading
    if (isChecking || isLoading) {
        return <LoadingOverlay visible={true} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />;
    }

    // Don't render content if user doesn't have admin access
    if (!hasAdminAccess()) {
        return null;
    }

    return (
        <AdminShell aside={aside} asideWidth={asideWidth}>
            {children}
        </AdminShell>
    );
}
