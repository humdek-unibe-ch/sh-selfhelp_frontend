/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Button, Tooltip } from '@mantine/core';
import { IconPencil } from '@tabler/icons-react';
import Link from 'next/link';
import { adminPageEditorPath } from './cmsAppPages.utils';

export interface ICmsAppPageEditorButtonProps {
    pageKeyword: string | null | undefined;
    canOpen: boolean;
    size?: 'xs' | 'sm' | 'md';
    /** Shorter label for tight headers (e.g. modal title row). */
    compact?: boolean;
}

export function CmsAppPageEditorButton({
    pageKeyword,
    canOpen,
    size = 'sm',
    compact = false,
}: ICmsAppPageEditorButtonProps) {
    const keyword = pageKeyword?.trim();
    if (!canOpen || !keyword) {
        return null;
    }

    const label = compact ? 'Page sections' : 'Edit page';

    return (
        <Tooltip label="Open page sections editor">
            <Button
                component={Link}
                href={adminPageEditorPath(keyword)}
                variant="light"
                color="grape"
                size={size}
                leftSection={<IconPencil size="0.9rem" />}
                aria-label={`${label} (${keyword})`}
            >
                {label}
            </Button>
        </Tooltip>
    );
}
