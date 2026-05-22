/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

/**
 * Admin UI "Available plugins" tab. Renders every plugin advertised by
 * the enabled `PluginSource`s (`GET /admin/plugins/available`) and
 * offers a one-click "Install" button that:
 *
 *   1. POSTs the registry entry's `manifest` (or fetches it from
 *      `manifestUrl` first) to `/admin/plugins` to create a staged
 *      install operation.
 *   2. Calls `/admin/plugins/{id}/finalize-install` with the same
 *      manifest to run the in-process installer.
 *   3. Enables the plugin if the operator left the "Enable after
 *      install" switch on (the default).
 *
 * The component intentionally keeps no local cache of the registry
 * list — React Query owns the cache and the Mercure
 * `selfhelp/plugins/state` topic invalidates it whenever a plugin
 * install/uninstall/enable/disable event is published.
 */

import { useState } from 'react';
import {
    Alert,
    Anchor,
    Badge,
    Button,
    Group,
    Loader,
    ScrollArea,
    Stack,
    Switch,
    Table,
    Text,
    Tooltip,
} from '@mantine/core';
import { IconDownload, IconExternalLink, IconRefresh } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
    useAdminPluginEnable,
    useAdminPluginFinalizeInstall,
    useAdminPluginRequestInstall,
    useAdminPluginsAvailable,
} from '../hooks/useAdminPlugins';
import type { IAdminPluginAvailable } from '../../../../../types/responses/admin/plugins.types';

interface IAvailablePluginsPanelProps {
    sourcesCount: number;
}

function formatTrustLabel(trustLevel: string): string {
    if (trustLevel === 'official') return 'Official';
    if (trustLevel === 'reviewed') return 'Reviewed';
    if (trustLevel === 'untrusted') return 'Untrusted';
    return trustLevel;
}

export function AvailablePluginsPanel({ sourcesCount }: IAvailablePluginsPanelProps) {
    const { data, isLoading, error, refetch, isFetching } = useAdminPluginsAvailable(sourcesCount > 0);
    const requestInstall = useAdminPluginRequestInstall();
    const finalizeInstall = useAdminPluginFinalizeInstall();
    const enableMutation = useAdminPluginEnable();
    const [enableAfterInstall, setEnableAfterInstall] = useState(true);
    const [installingId, setInstallingId] = useState<string | null>(null);

    const items = data?.plugins ?? [];

    const handleInstall = async (entry: IAdminPluginAvailable) => {
        if (installingId !== null) return;

        let manifest: Record<string, unknown> | null = entry.manifest ?? null;
        if (!manifest && entry.manifestUrl) {
            try {
                const resp = await fetch(entry.manifestUrl);
                if (!resp.ok) {
                    throw new Error(`Manifest download failed (HTTP ${resp.status}).`);
                }
                manifest = (await resp.json()) as Record<string, unknown>;
            } catch (err) {
                notifications.show({
                    color: 'red',
                    title: 'Failed to download manifest',
                    message: err instanceof Error ? err.message : String(err),
                });
                return;
            }
        }
        if (!manifest) {
            notifications.show({
                color: 'red',
                title: 'Registry entry incomplete',
                message: `${entry.pluginId} has neither an embedded manifest nor a manifestUrl.`,
            });
            return;
        }

        setInstallingId(entry.pluginId);
        try {
            const op = await requestInstall.mutateAsync({
                manifest,
                registryEntry: {
                    sourceName: entry.sourceName,
                    pluginId: entry.pluginId,
                    version: entry.version,
                    trustLevel: entry.trustLevel,
                },
            });
            const opId = op.data?.id;
            if (typeof opId !== 'number') {
                throw new Error('Install request did not return an operation id.');
            }
            const result = await finalizeInstall.mutateAsync({ pluginId: entry.pluginId, operationId: opId, manifest });
            notifications.show({
                color: 'green',
                title: 'Plugin installed',
                message: `${entry.name} v${entry.version}`,
            });
            if (enableAfterInstall && result.data?.pluginId) {
                try {
                    await enableMutation.mutateAsync(result.data.pluginId);
                } catch (enableErr) {
                    notifications.show({
                        color: 'yellow',
                        title: 'Installed but not enabled',
                        message: enableErr instanceof Error ? enableErr.message : String(enableErr),
                    });
                }
            }
            await refetch();
        } catch (err) {
            notifications.show({
                color: 'red',
                title: 'Install failed',
                message: err instanceof Error ? err.message : String(err),
            });
        } finally {
            setInstallingId(null);
        }
    };

    if (sourcesCount === 0) {
        return (
            <Alert color="blue" title="No registry sources configured">
                Add at least one source in the <strong>Sources</strong> tab to browse plugins from a registry.
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
                            const isBusy = installingId === entry.pluginId;
                            return (
                                <Table.Tr key={`${entry.sourceName}::${entry.pluginId}`}>
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
                                    <Table.Td>{entry.version}</Table.Td>
                                    <Table.Td>
                                        <Badge color={
                                            entry.trustLevel === 'official'
                                                ? 'green'
                                                : entry.trustLevel === 'reviewed'
                                                    ? 'blue'
                                                    : 'gray'
                                        } tt="none">
                                            {formatTrustLabel(entry.trustLevel)}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm" fw={500}>
                                            {entry.sourceName}
                                        </Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Tooltip label="Stages the install operation, finalizes it, then enables the plugin (if the switch above is on)">
                                            <Button
                                                size="xs"
                                                leftSection={<IconDownload size={14} />}
                                                loading={isBusy}
                                                disabled={installingId !== null && !isBusy}
                                                onClick={() => handleInstall(entry)}
                                            >
                                                {isBusy ? 'Installing…' : 'Install'}
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
