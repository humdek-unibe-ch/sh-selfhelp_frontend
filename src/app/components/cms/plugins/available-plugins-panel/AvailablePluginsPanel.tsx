/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

/**
 * Admin UI "Available plugins" tab. Renders every plugin advertised by
 * the enabled `PluginSource`s (`GET /admin/plugins/available`).
 *
 * Unified registry sources publish MULTIPLE versions per plugin, so each row
 * is a version PICKER, not a single fixed version. The backend resolver
 * (`PluginReleaseResolver`) classifies every published version against this
 * SelfHelp's core/plugin-API version and the row surfaces those states so the
 * operator never confuses "latest overall" with "latest compatible":
 *
 *   - the picker defaults to `selectedVersion` (newest COMPATIBLE);
 *   - `latest-compatible` / `compatible` / `incompatible` are badged per option;
 *   - when a newer-but-incompatible version exists, a "newer incompatible" hint
 *     explains why the install is pinned to an older compatible version;
 *   - when nothing is compatible, the standardized `compatibilityError`
 *     (same shape as the core-update preflight) is shown and Install is blocked.
 *
 * Install POSTs `{source: 'registry', sourceName, registryEntry}` for the
 * CHOSEN version's `registryEntry` (carrying its `releaseUrl`); the host's
 * `ManifestResolver` follows the signed release, downloads + verifies the
 * `.shplugin`, and the Messenger worker finalizes in the background.
 *
 * React Query owns the cache; the Mercure `selfhelp/plugins/state` topic
 * invalidates it on any install/uninstall/enable/disable event.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Anchor,
    Badge,
    Button,
    Group,
    Loader,
    ScrollArea,
    Select,
    Stack,
    Switch,
    Table,
    Text,
    Tooltip,
} from '@mantine/core';
import { IconAlertTriangle, IconDownload, IconExternalLink, IconRefresh } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
    useAdminPluginInstall,
    useAdminPluginOperations,
    useAdminPluginsAvailable,
} from '../hooks/useAdminPlugins';
import {
    activePluginOperationFor,
    hasActivePluginOperation,
    pluginOperationBusyLabel,
} from '../hooks/plugin-operation-polling';
import type {
    IAdminPluginAvailable,
    IAdminPluginAvailableVersion,
} from '../../../../../types/responses/admin/plugins.types';

interface IAvailablePluginsPanelProps {
    enabledSourcesCount: number;
}

function formatTrustLabel(trustLevel: string): string {
    if (trustLevel === 'official') return 'Official';
    if (trustLevel === 'reviewed') return 'Reviewed';
    if (trustLevel === 'untrusted') return 'Untrusted';
    return trustLevel;
}

function trustColor(trustLevel: string): string {
    if (trustLevel === 'official') return 'green';
    if (trustLevel === 'reviewed') return 'blue';
    return 'gray';
}

function entryKey(entry: IAdminPluginAvailable): string {
    return `${entry.sourceName}::${entry.pluginId}`;
}

/**
 * The versions list the picker renders. Unified entries already ship one; legacy
 * single-version entries collapse to a synthetic single row so the UI is uniform.
 */
function versionsOf(entry: IAdminPluginAvailable): IAdminPluginAvailableVersion[] {
    if (entry.versions && entry.versions.length > 0) return entry.versions;
    return [
        {
            version: entry.version,
            official: entry.trustLevel === 'official',
            compatible: true,
            blocking: false,
            selected: true,
            requiredRange: '*',
            requiredPluginApiRange: '*',
            reason: null,
            releaseUrl: null,
            state: 'selected',
            registryEntry: entry.registryEntry,
        },
    ];
}

function optionLabel(v: IAdminPluginAvailableVersion): string {
    if (v.state === 'latest-compatible') return `${v.version} • latest compatible`;
    if (!v.compatible) return `${v.version} • incompatible`;
    return v.version;
}

export function AvailablePluginsPanel({ enabledSourcesCount }: IAvailablePluginsPanelProps) {
    const { data, isLoading, error, refetch, isFetching } = useAdminPluginsAvailable(enabledSourcesCount > 0);
    const operations = useAdminPluginOperations();
    const installMutation = useAdminPluginInstall();
    const [enableAfterInstall, setEnableAfterInstall] = useState(true);
    // Local latch covering ONLY the brief window between clicking Install and the
    // backend operation becoming visible. Once the operation appears it owns the
    // busy state (see the handoff effect below), so the button stays disabled +
    // "Installing…" for the WHOLE background worker run — surviving polling
    // refetches and reloads — and can never be clicked twice.
    const [installingId, setInstallingId] = useState<string | null>(null);
    const pendingOpIdRef = useRef<number | null>(null);
    // Per-row chosen version (keyed by source::pluginId). Defaults resolve from
    // the backend's `selectedVersion` (newest compatible) on first render.
    const [picked, setPicked] = useState<Record<string, string>>({});

    const items = data?.plugins ?? [];
    const ops = operations.data;
    // Any lifecycle operation in flight (this plugin or another). The backend
    // serializes plugin operations, so we disable every Install while one runs.
    const anyOperationActive = installingId !== null || hasActivePluginOperation(ops);

    // Hand the local latch off to the backend operation as soon as it appears,
    // matched by the id the install returned. This closes the POST→operation gap
    // (no flicker back to "Install") without ever matching a stale prior op.
    useEffect(() => {
        const opId = pendingOpIdRef.current;
        if (opId === null) return;
        if (Array.isArray(ops) && ops.some((op) => op.id === opId)) {
            pendingOpIdRef.current = null;
            setInstallingId(null);
        }
    }, [ops]);

    const defaultVersionFor = useMemo(() => {
        return (entry: IAdminPluginAvailable): string => {
            const versions = versionsOf(entry);
            const selected = entry.selectedVersion
                ?? versions.find((v) => v.selected)?.version
                ?? versions[0]?.version
                ?? entry.version;
            return selected;
        };
    }, []);

    const handleInstall = async (entry: IAdminPluginAvailable, version: IAdminPluginAvailableVersion) => {
        if (anyOperationActive) return;
        const registryEntry = version.registryEntry ?? entry.registryEntry;
        if (!registryEntry) {
            notifications.show({ color: 'red', title: 'Cannot install', message: 'This version has no installable registry entry.' });
            return;
        }

        setInstallingId(entry.pluginId);
        try {
            const op = await installMutation.mutateAsync({
                source: 'registry',
                sourceName: entry.sourceName,
                registryEntry,
            });
            const result = op.data;
            if (result?.installAction === 'already_installed') {
                notifications.show({ color: 'gray', title: 'Already installed', message: result.message });
                setInstallingId(null);
                await refetch();
                return;
            }
            const opId = result?.id;
            if (typeof opId !== 'number') {
                throw new Error('Install request did not return an operation id.');
            }
            const isUpdate = result?.installAction === 'update_dispatched';
            notifications.show({
                color: 'green',
                title: isUpdate ? 'Update queued' : 'Install queued',
                message: isUpdate
                    ? `${entry.name}: ${result?.existingVersion} → v${version.version} — operation #${opId}.`
                    : `${entry.name} v${version.version} — operation #${opId}. Watch the Operations tab or the Mercure stream for progress.`,
            });
            // Keep the latch set: the handoff effect releases it once operation
            // #opId is visible, so the button never reverts to a clickable
            // "Install" while the worker is still running.
            pendingOpIdRef.current = opId;
            await refetch();
        } catch (err) {
            pendingOpIdRef.current = null;
            setInstallingId(null);
            notifications.show({
                color: 'red',
                title: 'Install failed',
                message: err instanceof Error ? err.message : String(err),
            });
        }
    };

    if (enabledSourcesCount === 0) {
        return (
            <Alert color="blue" title="No enabled registry sources">
                Enable at least one source in the <strong>Sources</strong> tab to browse plugins from a registry.
                For local testing you can also paste a <code>plugin.json</code> with the <strong>Install plugin</strong>
                button at the top right.
            </Alert>
        );
    }

    if (isLoading) {
        return (
            <Stack align="center" mt="md">
                <Loader />
                <Text size="sm" c="dimmed">Loading registry indexes…</Text>
            </Stack>
        );
    }

    if (error) {
        return (
            <Alert color="red" title="Failed to fetch registry">
                {error instanceof Error ? error.message : 'Unknown error.'}
            </Alert>
        );
    }

    return (
        <Stack gap="sm">
            <Group justify="space-between">
                <Group gap="md">
                    <Badge variant="light">{items.length} available</Badge>
                    <Switch
                        label="Enable plugin after install"
                        checked={enableAfterInstall}
                        onChange={(e) => setEnableAfterInstall(e.currentTarget.checked)}
                    />
                </Group>
                <Button
                    variant="default"
                    leftSection={<IconRefresh size={14} />}
                    onClick={() => refetch()}
                    loading={isFetching}
                >
                    Refresh
                </Button>
            </Group>

            <ScrollArea>
                <Table withTableBorder striped highlightOnHover stickyHeader>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Plugin</Table.Th>
                            <Table.Th>Version</Table.Th>
                            <Table.Th>Trust</Table.Th>
                            <Table.Th>Source</Table.Th>
                            <Table.Th>Action</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {items.map((entry) => {
                            const key = entryKey(entry);
                            const versions = versionsOf(entry);
                            const currentVersion = picked[key] ?? defaultVersionFor(entry);
                            const selectedVer = versions.find((v) => v.version === currentVersion) ?? versions[0];
                            // Busy = the local latch (request just fired) OR a backend
                            // operation in flight for this plugin. The latter keeps the
                            // button locked for the entire background install/update.
                            const rowActiveOp = activePluginOperationFor(ops, entry.pluginId);
                            const isBusy = installingId === entry.pluginId || rowActiveOp !== null;
                            const noCompatible = entry.hasCompatibleVersion === false;
                            const installable = Boolean(selectedVer?.compatible && (selectedVer?.registryEntry ?? entry.registryEntry));
                            const trustForRow = selectedVer?.official ? 'official' : entry.trustLevel;

                            return (
                                <Table.Tr key={key}>
                                    <Table.Td>
                                        <Stack gap={0}>
                                            <Text fw={600}>{entry.name}</Text>
                                            <Text size="xs" c="dimmed">{entry.pluginId}</Text>
                                            {entry.description && (
                                                <Text size="xs" c="dimmed" lineClamp={2}>
                                                    {entry.description}
                                                </Text>
                                            )}
                                            {entry.homepage && (
                                                <Anchor href={entry.homepage} target="_blank" rel="noopener" size="xs">
                                                    <Group gap={4} wrap="nowrap">
                                                        <IconExternalLink size={12} />
                                                        Homepage
                                                    </Group>
                                                </Anchor>
                                            )}
                                        </Stack>
                                    </Table.Td>
                                    <Table.Td>
                                        <Stack gap={4}>
                                            <Select
                                                size="xs"
                                                w={220}
                                                allowDeselect={false}
                                                comboboxProps={{ withinPortal: true }}
                                                data={versions.map((v) => ({ value: v.version, label: optionLabel(v) }))}
                                                value={currentVersion}
                                                onChange={(v) => v && setPicked((prev) => ({ ...prev, [key]: v }))}
                                                aria-label={`Choose ${entry.name} version`}
                                            />
                                            <Group gap={4} wrap="wrap">
                                                {selectedVer?.state === 'latest-compatible' && (
                                                    <Badge size="xs" color="green" variant="light" tt="none">latest compatible</Badge>
                                                )}
                                                {selectedVer && !selectedVer.compatible && (
                                                    <Badge size="xs" color="red" variant="light" tt="none">incompatible</Badge>
                                                )}
                                                {entry.newerExistsButIncompatible && selectedVer?.compatible && (
                                                    <Tooltip
                                                        label={`A newer version (${entry.latestVersion}) is published but is not compatible with this SelfHelp version.`}
                                                        multiline
                                                        w={260}
                                                    >
                                                        <Badge size="xs" color="yellow" variant="light" tt="none">
                                                            newer incompatible
                                                        </Badge>
                                                    </Tooltip>
                                                )}
                                            </Group>
                                            {selectedVer && !selectedVer.compatible && selectedVer.reason && (
                                                <Text size="xs" c="red.7">{selectedVer.reason}</Text>
                                            )}
                                            {noCompatible && entry.compatibilityError && (
                                                <Group gap={4} wrap="nowrap" align="flex-start">
                                                    <IconAlertTriangle size={14} color="var(--mantine-color-red-6)" />
                                                    <Text size="xs" c="red.7">
                                                        {entry.compatibilityError.message}
                                                        {entry.compatibilityError.required_range
                                                            ? ` (requires ${entry.compatibilityError.required_range})`
                                                            : ''}
                                                    </Text>
                                                </Group>
                                            )}
                                        </Stack>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge color={trustColor(trustForRow)} tt="none">
                                            {formatTrustLabel(trustForRow)}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm" fw={500}>
                                            {entry.sourceName}
                                        </Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Tooltip
                                            label={
                                                installable
                                                    ? 'Stages + finalizes the install of the selected version, then enables it (if the switch above is on)'
                                                    : 'The selected version is not compatible with this SelfHelp version'
                                            }
                                        >
                                            <Button
                                                size="xs"
                                                leftSection={<IconDownload size={14} />}
                                                loading={isBusy}
                                                disabled={!installable || anyOperationActive}
                                                onClick={() => selectedVer && handleInstall(entry, selectedVer)}
                                                data-disabled={!installable ? true : undefined}
                                            >
                                                {isBusy
                                                    ? rowActiveOp
                                                        ? pluginOperationBusyLabel(rowActiveOp.type)
                                                        : 'Installing…'
                                                    : 'Install'}
                                            </Button>
                                        </Tooltip>
                                    </Table.Td>
                                </Table.Tr>
                            );
                        })}
                        {items.length === 0 && (
                            <Table.Tr>
                                <Table.Td colSpan={5}>
                                    <Text c="dimmed" ta="center" py="md">
                                        No new plugins advertised by the configured registries. Configure another
                                        source in the <strong>Sources</strong> tab or check that your existing
                                        registry index is reachable.
                                    </Text>
                                </Table.Td>
                            </Table.Tr>
                        )}
                    </Table.Tbody>
                </Table>
            </ScrollArea>
        </Stack>
    );
}
