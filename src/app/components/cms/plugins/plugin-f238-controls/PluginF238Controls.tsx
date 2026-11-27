/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Button, Group } from '@mantine/core';
import { pluginAdminRights } from '../hooks/pluginAdminRights';

interface IPluginF238ControlsProps {
    permissionChecker: { hasPermission(permission: string): boolean } | null | undefined;
    /** Execute-family controls (enable / disable / uninstall / repair / …). */
    executeControls?: React.ReactNode;
    /** Manage-family controls (inspect archive, settings entry). */
    manageControls?: React.ReactNode;
    /** Purge control. */
    purgeControls?: React.ReactNode;
}

/**
 * Renders Plugins-screen control groups only for holders of the matching right (F238).
 * Used by the list page and detail page; the A4 test mounts this with stub buttons.
 */
export function PluginF238Controls({
    permissionChecker,
    executeControls,
    manageControls,
    purgeControls,
}: IPluginF238ControlsProps) {
    const { canExecute, canManage, canPurge } = pluginAdminRights(permissionChecker);

    return (
        <Group gap="xs" wrap="wrap" data-testid="plugin-f238-controls">
            {canExecute ? <div data-testid="plugin-execute-controls">{executeControls}</div> : null}
            {canManage ? <div data-testid="plugin-manage-controls">{manageControls}</div> : null}
            {canPurge ? <div data-testid="plugin-purge-controls">{purgeControls}</div> : null}
        </Group>
    );
}

/** Tiny demo buttons used only in the F238 component test. */
export function PluginF238DemoButtons({
    permissionChecker,
}: {
    permissionChecker: { hasPermission(permission: string): boolean } | null | undefined;
}) {
    return (
        <PluginF238Controls
            permissionChecker={permissionChecker}
            executeControls={<Button data-testid="demo-enable">Enable</Button>}
            manageControls={
                <>
                    <Button data-testid="demo-inspect">Inspect archive</Button>
                    <Button data-testid="demo-settings">Settings</Button>
                </>
            }
            purgeControls={<Button data-testid="demo-purge">Purge</Button>}
        />
    );
}
