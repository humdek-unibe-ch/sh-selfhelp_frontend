/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { Box } from '@mantine/core';

interface IAdminPageContainerProps {
    children: React.ReactNode;
    /** Max content width in px; admin list pages read best when capped. */
    maxWidth?: number;
}

/**
 * Shared outer container for admin content pages (users, roles, groups,
 * cache, …): consistent padding, centered max width, and a bottom spacer so
 * tables never touch the viewport edge. Full-bleed workspaces (page editor,
 * live preview, menu builder) intentionally do not use it.
 */
export function AdminPageContainer({ children, maxWidth = 1600 }: IAdminPageContainerProps) {
    return (
        <Box p="lg" pb="xl" maw={maxWidth} mx="auto" w="100%">
            {children}
        </Box>
    );
}
