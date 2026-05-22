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

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
    Alert,
    Anchor,
    Badge,
    Button,
    Group,
    JsonInput,
    Loader,
    Modal,
    ScrollArea,
    Stack,
    Switch,
    Table,
    Tabs,
    Text,
    TextInput,
    Title,
    Tooltip,
} from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
    useAdminPluginDisable,
    useAdminPluginEnable,
    useAdminPluginFinalizeInstall,
    useAdminPluginPurge,
    useAdminPluginRequestInstall,
    useAdminPluginSources,
    useAdminPluginUninstall,
    useAdminPlugins,
} from '../hooks/useAdminPlugins';
import { PluginSourcesPanel } from '../plugin-sources-panel/PluginSourcesPanel';

export function PluginsPage() {
    const router = useRouter();
    const { data: pluginList, isLoading, error } = useAdminPlugins();
    const { data: sources } = useAdminPluginSources();
    const [purgeFor, setPurgeFor] = useState<string | null>(null);
    const [purgeConfirm, setPurgeConfirm] = useState('');

    const [installOpen, setInstallOpen] = useState(false);
    const [installManifest, setInstallManifest] = useState('');
    const [installEnableOnSuccess, setInstallEnableOnSuccess] = useState(true);
    const [installPendingOperationId, setInstallPendingOperationId] = useState<number | null>(null);

    const enableMutation = useAdminPluginEnable();
    const disableMutation = useAdminPluginDisable();
    const uninstallMutation = useAdminPluginUninstall();
    const purgeMutation = useAdminPluginPurge();
    const requestInstall = useAdminPluginRequestInstall();
    const finalizeInstall = useAdminPluginFinalizeInstall();

    const rows = useMemo(() => pluginList?.plugins ?? [], [pluginList]);
    const installMode = pluginList?.installMode;
    const safeMode = pluginList?.safeMode ?? false;

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
        } catch (err) {
            notifications.show({ color: 'red', title: 'Purge failed', message: err instanceof Error ? err.message : String(err) });
        }
    };

    const onInstallRequest = async () => {
        let parsed: Record<string, unknown>;
        try {
            parsed = JSON.parse(installManifest);
        } catch (err) {
            notifications.show({ color: 'red', title: 'Manifest is not valid JSON', message: err instanceof Error ? err.message : String(err) });
            return;
        }
        try {
            const op = await requestInstall.mutateAsync({ manifest: parsed, registryEntry: null });
            setInstallPendingOperationId(op.data?.id ?? null);
            notifications.show({ color: 'blue', title: 'Install requested', message: `Operation ${op.data?.id} created.` });
        } catch (err) {
            notifications.show({ color: 'red', title: 'Install request failed', message: err instanceof Error ? err.message : String(err) });
        }
    };

    const onInstallFinalize = async () => {
        if (installPendingOperationId === null) return;
        let parsed: Record<string, unknown>;
        try {
            parsed = JSON.parse(installManifest);
        } catch (err) {
            notifications.show({ color: 'red', title: 'Manifest is not valid JSON', message: err instanceof Error ? err.message : String(err) });
            return;
        }
        try {
            const manifestPluginId = typeof parsed?.id === 'string' ? parsed.id : null;
            if (!manifestPluginId) {
                notifications.show({ color: 'red', title: 'Manifest missing id', message: 'The manifest must contain a top-level "id" field.' });
                return;
            }
            const result = await finalizeInstall.mutateAsync({ pluginId: manifestPluginId, operationId: installPendingOperationId, manifest: parsed });
            notifications.show({ color: 'green', title: 'Plugin installed', message: result.data?.pluginId ?? 'unknown' });
            if (installEnableOnSuccess && result.data?.pluginId) {
                try {
                    await enableMutation.mutateAsync(result.data.pluginId);
                } catch (enableErr) {
                    notifications.show({ color: 'yellow', title: 'Installed but not enabled', message: enableErr instanceof Error ? enableErr.message : String(enableErr) });
                }
            }
            setInstallOpen(false);
            setInstallPendingOperationId(null);
            setInstallManifest('');
        } catch (err) {
            notifications.show({ color: 'red', title: 'Install finalize failed', message: err instanceof Error ? err.message : String(err) });
        }
    };

    return (
        <Stack gap="md">
            <Group justify="space-between" align="center">
                <Title order={2}>Plugins</Title>
                <Group gap="xs">
                    {installMode && (
                        <Tooltip label={`Plugin install mode: ${installMode}`}>
                            <Badge variant="light" color={installMode === 'managed' ? 'blue' : installMode === 'development' ? 'orange' : 'grape'}>
                                {installMode}
                            </Badge>
                        </Tooltip>
                    )}
                    <Badge variant="light" color="gray">
                        {rows.length} installed / {sources?.length ?? 0} sources
                    </Badge>
                    <Button leftSection={<IconDownload size={14} />} onClick={() => setInstallOpen(true)}>
                        Install plugin
                    </Button>
                </Group>
            </Group>

            {safeMode && (
                <Alert color="orange" title="Safe mode active">
                    All plugins are disabled at boot. Disable safe mode (CLI: <Text component="span" ff="monospace">php bin/console selfhelp:plugin:safe-mode off</Text>) to resume normal operation.
                </Alert>
            )}

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
                                        onClick={() => router.push(`/admin/plugins/${encodeURIComponent(p.pluginId)}`)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <Table.Td>
                                            <Stack gap={0}>
                                                <Anchor component={Link} href={`/admin/plugins/${encodeURIComponent(p.pluginId)}`} fw={600} onClick={(e) => e.stopPropagation()}>
                                                    {p.name}
                                                </Anchor>
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
                                            <Text c="dimmed" ta="center" py="md">No plugins installed. Click <strong>Install plugin</strong> above to add one.</Text>
                                        </Table.Td>
                                    </Table.Tr>
                                )}
                            </Table.Tbody>
                        </Table>
                    </ScrollArea>
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

            <Modal
                opened={installOpen}
                onClose={() => { setInstallOpen(false); setInstallManifest(''); setInstallPendingOperationId(null); }}
                title="Install plugin"
                size="xl"
            >
                <Stack gap="sm">
                    <Alert color="blue">
                        Paste the plugin&apos;s <strong>plugin.json</strong> manifest. The host validates it against the manifest schema,
                        runs the install-policy check, and creates a staged operation. Click <strong>Finalize</strong> to apply.
                    </Alert>
                    <JsonInput
                        label="Plugin manifest (plugin.json)"
                        placeholder='{ "pluginId": "sh2-shp-...", "version": "1.0.0", ... }'
                        value={installManifest}
                        onChange={setInstallManifest}
                        minRows={14}
                        autosize
                        validationError="Invalid JSON"
                        formatOnBlur
                    />
                    <Switch
                        label="Enable plugin after install succeeds"
                        checked={installEnableOnSuccess}
                        onChange={(e) => setInstallEnableOnSuccess(e.currentTarget.checked)}
                    />
                    {installPendingOperationId !== null && (
                        <Alert color="green">
                            Operation #{installPendingOperationId} created. Click <strong>Finalize</strong> below to apply.
                        </Alert>
                    )}
                    <Group justify="flex-end">
                        <Button variant="default" onClick={() => { setInstallOpen(false); setInstallManifest(''); setInstallPendingOperationId(null); }}>Cancel</Button>
                        {installPendingOperationId === null ? (
                            <Button loading={requestInstall.isPending} onClick={onInstallRequest}>Request install</Button>
                        ) : (
                            <Button color="green" loading={finalizeInstall.isPending} onClick={onInstallFinalize}>Finalize</Button>
                        )}
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}
