'use client';

import { LoadingOverlay } from "@mantine/core";
import { AdminShell } from "./AdminShell";
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AdminShellWrapperProps {
    children: React.ReactNode;
}

export function AdminShellWrapper({ children }: AdminShellWrapperProps) {
    const { hasAccess, isLoading } = useAdminAccess();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !hasAccess) {
            router.replace('/auth/login');
        }
    }, [hasAccess, isLoading, router]);

    if (isLoading) {
        return <LoadingOverlay visible={true} />;
    }

    if (!hasAccess) {
        return null;
    }

    return (
        <AdminShell>
            {children}
        </AdminShell>
    );
}
