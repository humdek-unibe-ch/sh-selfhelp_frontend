/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Button } from '@mantine/core';
import { IconShield } from '@tabler/icons-react';
import Link from 'next/link';
import { useAuth } from '../../../../hooks/useAuth';

export function AdminButton() {
    const { hasAdminAccess } = useAuth();

    if (!hasAdminAccess()) return null;

    return (
        <Button
            component={Link}
            href="/admin/users"
            leftSection={<IconShield size={14} />}
            variant="subtle"
            size="sm"
        >
            Admin
        </Button>
    );
}
