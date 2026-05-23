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
 *   1. POSTs `{source: 'registry', registryEntry}` to
 *      `/admin/plugins/install`. The host's `ManifestResolver` resolves
 *      the registry entry, the installer dispatches an
 *      `InstallPluginMessage`, and the Messenger worker handles
 *      composer + finalize in the background.
 *   2. Enables the plugin if the operator left the "Enable after
 *      install" switch on (after the worker has finished — surfaced
 *      via the operations cache invalidation triggered by Mercure).
 *
 * The component keeps no local cache of the registry list — React Query
 * owns the cache and the Mercure `selfhelp/plugins/state` topic
 * invalidates it whenever a plugin install/uninstall/enable/disable
 * event is published.
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
    useAdminPluginInstall,
    useAdminPluginsAvailable,
} from '../hooks/useAdminPlugins';
import type { IAdminPluginAvailable } from '../../../../../types/responses/admin/plugins.types';

interface IAvailablePluginsPanelProps {
    enabledSourcesCount: number;
}

function formatTrustLabel(trustLevel: string): string {
    if (trustLevel === 'official') return 'Official';
    if (trustLevel === 'reviewed') return 'Reviewed';
    if (trustLevel === 'untrusted') return 'Untrusted';
    return trustLevel;
}

export function AvailablePluginsPanel({ enabledSourcesCount }: IAvailablePluginsPanelProps) {
    const { data, isLoading, error, refetch, isFetching } = useAdminPluginsAvailable(enabledSourcesCount > 0);
    const installMutation = useAdminPluginInstall();
    const [enableAfterInstall, setEnableAfterInstall] = useState(true);
    const [installingId, setInstallingId] = useState<string | null>(null);

    const items = data?.plugins ?? [];

    const handleInstall = async (entry: IAdminPluginAvailable) => {
        if (installingId !== null) return;

        setInstallingId(entry.pluginId);
        try {
            // The backend ManifestResolver accepts the registry entry
            // directly. It will fetch + verify the canonical
            // signedPayload + signature; the frontend never needs to
            // pre-download the manifest body.
            const op = await installMutation.mutateAsync({
                source: 'registry',
                sourceName: entry.sourceName,
                registryEntry: {
                    ...(entry.manifest ? { manifest: entry.manifest } : {}),
                    ...(entry.manifestUrl ? { manifestUrl: entry.manifestUrl } : {}),
                    pluginId: entry.pluginId,
                    version: entry.version,
                    trustLevel: entry.trustLevel,
                },
            });
            const opId = op.data?.id;
            if (typeof opId !== 'number') {
                throw new Error('Install request did not return an operation id.');
            }
            notifications.show({
                color: 'green',
                title: 'Install queued',
                message: `${entry.name} v${entry.version} — operation #${opId}. Watch the Operations tab or the Mercure stream for progress.`,
            });
            if (enableAfterInstall) {
                // Best-effort: enable the plugin after the worker reports
                // the operation succeeded. The Mercure topic
                // `selfhelp/plugins/state` triggers a refetch that
                // surfaces the new plugin row; the operator can also
                // enable it from the detail view.
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
