/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Group } from '@mantine/core';
import { SelfHelpLogo, PreviewModeToggle } from '../../../shared';
import { DebugMenu } from '../../../shared/common/debug';
import classes from './AdminNavbar.module.css';

/**
 * Brand row for the admin sidebar: spider + SelfHelp on the left,
 * preview and debug icon buttons on the right.
 */
export function AdminNavbarHeader() {
    return (
        <Group
            justify="space-between"
            align="center"
            wrap="nowrap"
            className={classes.headerRow}
            h={40}
            data-testid="admin-navbar-header"
        >
            <SelfHelpLogo variant="compact" />
            <Group gap={4} wrap="nowrap">
                <PreviewModeToggle variant="icon" />
                <DebugMenu variant="inline" />
            </Group>
        </Group>
    );
}
