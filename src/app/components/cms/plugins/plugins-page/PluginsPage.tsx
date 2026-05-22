/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

/**
 * `PluginsPage` — top-level admin page rendering installed plugins with
 * detail tabs (overview / operations / feature flags / sources).
 *
 * The page is driven by `useAdminPlugins()` so the data flows through
 * React Query; Mercure subscriptions hooked elsewhere keep the cache
 * fresh without polling.
 */

import { useMemo, useState } from 'react';
import {
    Alert,
    Badge,
    Button,
    Group,
    Loader,
    Modal,
    ScrollArea,
    Stack,
    Table,
    Tabs,
    Text,
    TextInput,
    Title,
    Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
    useAdminPlugin,
    useAdminPluginDisable,
    useAdminPluginEnable,
    useAdminPluginOperations,
    useAdminPluginPurge,
    useAdminPluginSources,
    useAdminPluginUninstall,
    useAdminPlugins,
} from '../hooks/useAdminPlugins';
import { PluginSourcesPanel } from '../plugin-sources-panel/PluginSourcesPanel';

export function PluginsPage() {
    const { data: plugins, isLoading, error } = useAdminPlugins();
    const { data: sources } = useAdminPluginSources();
    const [selectedPluginId, setSelectedPluginId] = useState<string | null>(null);
    const [purgeFor, setPurgeFor] = useState<string | null>(null);
    const [purgeConfirm, setPurgeConfirm] = useState('');

    const selected = useAdminPlugin(selectedPluginId);
    const operations = useAdminPluginOperations(selectedPluginId ?? undefined);

    const enableMutation = useAdminPluginEnable();
    const disableMutation = useAdminPluginDisable();
    const uninstallMutation = useAdminPluginUninstall();
    const purgeMutation = useAdminPluginPurge();

    const rows = useMemo(() => plugins ?? [], [plugins]);

    if (isLoading) {
        return (
            <Stack align="center" mt="xl">
                <Loader size="lg" />
                <Text>Loading plugins…</Text>
            </Stack>
        );
    }

    if (error) {
        return (
            <Alert color="red" title="Failed to load plugins">
                {error instanceof Error ? error.message : 'Unknown error.'}
            </Alert>
        );
    }

    const onEnable = async (pluginId: string) => {
        try {
            await enableMutation.mutateAsync(pluginId);
            notifications.show({ color: 'green', title: 'Plugin enabled', message: pluginId });
        } catch (err) {
            notifications.show({ color: 'red', title: 'Enable failed', message: err instanceof Error ? err.message : String(err) });
        }
    };
    const onDisable = async (pluginId: string) => {
        try {
            await disableMutation.mutateAsync(pluginId);
            notifications.show({ color: 'yellow', title: 'Plugin disabled', message: pluginId });
        } catch (err) {
            notifications.show({ color: 'red', title: 'Disable failed', message: err instanceof Error ? err.message : String(err) });
        }
    };
    const onUninstall = async (pluginId: string) => {
        try {
            await uninstallMutation.mutateAsync(pluginId);
            notifications.show({ color: 'green', title: 'Plugin uninstalled', message: pluginId });
            if (selectedPluginId === pluginId) setSelectedPluginId(null);
        } catch (err) {
            notifications.show({ color: 'red', title: 'Uninstall failed', message: err instanceof Error ? err.message : String(err) });
        }
    };

    const onPurgeConfirm = async () => {
        if (purgeFor === null) return;
        try {
            await purgeMutation.mutateAsync({ pluginId: purgeFor, confirmedPluginId: purgeConfirm });
            notifications.show({ color: 'green', title: 'Plugin purged', message: purgeFor });
            setPurgeFor(null);
            setPurgeConfirm('');
            if (selectedPluginId === purgeFor) setSelectedPluginId(null);
        } catch (err) {
            notifications.show({ color: 'red', title: 'Purge failed', message: err instanceof Error ? err.message : String(err) });
        }
    };

    return (
        <Stack gap="md">
            <Group justify="space-between" align="center">
                <Title order={2}>Plugins</Title>
                <Badge variant="light" color="gray">
                    {rows.length} installed / {sources?.length ?? 0} sources
                </Badge>
            </Group>

            <Tabs defaultValue="installed">
                <Tabs.List>
                    <Tabs.Tab value="installed">Installed</Tabs.Tab>
                    <Tabs.Tab value="sources">Sources</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="installed" pt="md">
                    <ScrollArea>
                        <Table withTableBorder striped highlightOnHover stickyHeader>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Plugin</Table.Th>
                                    <Table.Th>Version</Table.Th>
                                    <Table.Th>Trust</Table.Th>
                                    <Table.Th>Mode</Table.Th>
                                    <Table.Th>Status</Table.Th>
                                    <Table.Th>Compatibility</Table.Th>
                                    <Table.Th>Actions</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {rows.map((p) => (
                                    <Table.Tr
                                        key={p.pluginId}
                                        onClick={() => setSelectedPluginId(p.pluginId)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <Table.Td>
                                            <Stack gap={0}>
                                                <Text fw={600}>{p.name}</Text>
                                                <Text size="xs" c="dimmed">{p.pluginId}</Text>
                                            </Stack>
                                        </Table.Td>
                                        <Table.Td>{p.version}</Table.Td>
                                        <Table.Td>
                                            <Badge color={p.trustLevel === 'official' ? 'green' : p.trustLevel === 'reviewed' ? 'blue' : 'gray'}>
                                                {p.trustLevel}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>{p.installMode}</Table.Td>
                                        <Table.Td>
                                            <Badge color={p.enabled ? 'green' : 'gray'}>
                                                {p.enabled ? 'enabled' : 'disabled'}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge color={
                                                p.compatibility?.severity === 'ok'
                                                    ? 'green'
                                                    : p.compatibility?.severity === 'warning'
                                                        ? 'yellow'
                                                        : 'red'
                                            }>
                                                {p.compatibility?.severity ?? 'unknown'}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap="xs" onClick={(e) => e.stopPropagation()}>
                                                {p.enabled ? (
                                                    <Button size="xs" variant="default" loading={disableMutation.isPending} onClick={() => onDisable(p.pluginId)}>
                                                        Disable
                                                    </Button>
                                                ) : (
                                                    <Button size="xs" loading={enableMutation.isPending} onClick={() => onEnable(p.pluginId)}>
                                                        Enable
                                                    </Button>
                                                )}
                                                <Tooltip label="Removes packages; preserves data">
                                                    <Button size="xs" variant="light" color="yellow" loading={uninstallMutation.isPending} onClick={() => onUninstall(p.pluginId)}>
                                                        Uninstall
                                                    </Button>
                                                </Tooltip>
                                                <Tooltip label="Destructive: drops tables and tagged rows">
                                                    <Button size="xs" variant="light" color="red" onClick={() => setPurgeFor(p.pluginId)}>
                                                        Purge…
                                                    </Button>
                                                </Tooltip>
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                                {rows.length === 0 && (
                                    <Table.Tr>
                                        <Table.Td colSpan={7}>
                                            <Text c="dimmed" ta="center" py="md">No plugins installed.</Text>
                                        </Table.Td>
                                    </Table.Tr>
                                )}
                            </Table.Tbody>
                        </Table>
                    </ScrollArea>

                    {selectedPluginId && (
                        <Stack gap="xs" mt="lg">
                            <Title order={4}>Details — {selectedPluginId}</Title>
                            {selected.isLoading ? (
                                <Loader />
                            ) : selected.data ? (
                                <Tabs defaultValue="overview">
                                    <Tabs.List>
                                        <Tabs.Tab value="overview">Overview</Tabs.Tab>
                                        <Tabs.Tab value="operations">Operations</Tabs.Tab>
                                        <Tabs.Tab value="feature-flags">Feature flags</Tabs.Tab>
                                    </Tabs.List>

                                    <Tabs.Panel value="overview" pt="md">
                                        <Stack gap="xs">
                                            <Text>Name: <strong>{selected.data.name}</strong></Text>
                                            <Text>Description: {selected.data.description ?? '—'}</Text>
                                            <Text>Trust level: {selected.data.trustLevel}</Text>
                                            <Text>Install mode: {selected.data.installMode}</Text>
                                            <Text>Backend bundle: {String(selected.data.manifest?.backend ?? '—')}</Text>
                                            <Text>Frontend package: {selected.data.frontendPackage ?? '—'} v{selected.data.frontendPackageVersion ?? '—'}</Text>
                                            <Text>Mobile package: {selected.data.mobilePackage ?? '—'} v{selected.data.mobilePackageVersion ?? '—'}</Text>
                                            <Text>Capabilities: {(selected.data.capabilities ?? []).join(', ') || '—'}</Text>
                                        </Stack>
                                    </Tabs.Panel>

                                    <Tabs.Panel value="operations" pt="md">
                                        <ScrollArea>
                                            <Table>
                                                <Table.Thead>
                                                    <Table.Tr>
                                                        <Table.Th>#</Table.Th>
                                                        <Table.Th>Type</Table.Th>
                                                        <Table.Th>Status</Table.Th>
                                                        <Table.Th>Versions</Table.Th>
                                                        <Table.Th>Started</Table.Th>
                                                        <Table.Th>Finished</Table.Th>
                                                    </Table.Tr>
                                                </Table.Thead>
                                                <Table.Tbody>
                                                    {(operations.data ?? []).map((op) => (
                                                        <Table.Tr key={op.id}>
                                                            <Table.Td>{op.id}</Table.Td>
                                                            <Table.Td>{op.type}</Table.Td>
                                                            <Table.Td>
                                                                <Badge color={
                                                                    op.status === 'succeeded'
                                                                        ? 'green'
                                                                        : op.status === 'failed'
                                                                            ? 'red'
                                                                            : op.status === 'running'
                                                                                ? 'blue'
                                                                                : 'gray'
                                                                }>
                                                                    {op.status}
                                                                </Badge>
                                                            </Table.Td>
                                                            <Table.Td>{op.fromVersion ?? '—'} → {op.toVersion ?? '—'}</Table.Td>
                                                            <Table.Td>{op.startedAt ?? '—'}</Table.Td>
                                                            <Table.Td>{op.finishedAt ?? '—'}</Table.Td>
                                                        </Table.Tr>
                                                    ))}
                                                    {(operations.data ?? []).length === 0 && (
                                                        <Table.Tr>
                                                            <Table.Td colSpan={6}>
                                                                <Text c="dimmed" ta="center" py="md">No operations recorded.</Text>
                                                            </Table.Td>
                                                        </Table.Tr>
                                                    )}
                                                </Table.Tbody>
                                            </Table>
                                        </ScrollArea>
                                    </Tabs.Panel>

                                    <Tabs.Panel value="feature-flags" pt="md">
                                        <Stack gap="xs">
                                            {(selected.data.featureFlags ?? []).length === 0 ? (
                                                <Text c="dimmed">Plugin does not declare any feature flags.</Text>
                                            ) : (
                                                (selected.data.featureFlags ?? []).map((flag) => (
                                                    <Group key={`${flag.flagKey}|${flag.scope}|${flag.scopeValue}`} justify="space-between">
                                                        <Stack gap={0}>
                                                            <Text fw={600}>{flag.flagKey}</Text>
                                                            <Text size="xs" c="dimmed">
                                                                scope={flag.scope}{flag.scopeValue ? ` / ${flag.scopeValue}` : ''}
                                                            </Text>
                                                        </Stack>
                                                        <Badge color={flag.enabled ? 'green' : 'gray'}>
                                                            {flag.enabled ? 'enabled' : 'disabled'}
                                                        </Badge>
                                                    </Group>
                                                ))
                                            )}
                                        </Stack>
                                    </Tabs.Panel>
                                </Tabs>
                            ) : (
                                <Text c="dimmed">Plugin details unavailable.</Text>
                            )}
                        </Stack>
                    )}
                </Tabs.Panel>

                <Tabs.Panel value="sources" pt="md">
                    <PluginSourcesPanel />
                </Tabs.Panel>
            </Tabs>

            <Modal opened={purgeFor !== null} onClose={() => { setPurgeFor(null); setPurgeConfirm(''); }} title={`Purge ${purgeFor ?? ''}`}>
                <Stack gap="sm">
                    <Alert color="red" title="Destructive operation">
                        Purging drops every plugin-owned table and deletes every row tagged with this plugin. Plugin data is unrecoverable unless you took a backup first.
                    </Alert>
                    <TextInput
                        label={`Type "${purgeFor ?? ''}" to confirm`}
                        value={purgeConfirm}
                        onChange={(e) => setPurgeConfirm(e.currentTarget.value)}
                    />
                    <Group justify="flex-end">
                        <Button variant="default" onClick={() => { setPurgeFor(null); setPurgeConfirm(''); }}>Cancel</Button>
                        <Button color="red" disabled={purgeConfirm !== purgeFor} loading={purgeMutation.isPending} onClick={onPurgeConfirm}>
                            Purge plugin
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}
