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
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Anchor,
    Badge,
    Button,
    FileButton,
    Group,
    Loader,
    Paper,
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
import { Dropzone, type FileWithPath } from '@mantine/dropzone';
import { IconDownload, IconFileUpload, IconUpload, IconX } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { ModalWrapper } from '../../../shared/common/CustomModal/CustomModal';
import { MonacoFieldEditor } from '../../shared/monaco-field-editor/MonacoFieldEditor';
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
import { AvailablePluginsPanel } from '../available-plugins-panel/AvailablePluginsPanel';
import { PluginVersionMismatchBanner } from '../plugin-version-mismatch-banner/PluginVersionMismatchBanner';

type TPluginsTab = 'installed' | 'available' | 'sources';
const PLUGINS_TABS: readonly TPluginsTab[] = ['installed', 'available', 'sources'];

export function PluginsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { data: pluginList, isLoading, error } = useAdminPlugins();
    const { data: sources } = useAdminPluginSources();
    const [purgeFor, setPurgeFor] = useState<string | null>(null);
    const [purgeConfirm, setPurgeConfirm] = useState('');

    const [installOpen, setInstallOpen] = useState(false);
    const [installManifest, setInstallManifest] = useState('');
    const [installEnableOnSuccess, setInstallEnableOnSuccess] = useState(true);
    const [installPendingOperationId, setInstallPendingOperationId] = useState<number | null>(null);
    const [installManifestFileName, setInstallManifestFileName] = useState<string | null>(null);

    // Tabs are persisted to the URL so refresh / bookmark / share all
    // land on the same tab. Mantine's `Tabs` is controlled here against
    // the `?tab=` search param.
    const activeTab: TPluginsTab = useMemo(() => {
        const raw = searchParams.get('tab');
        return PLUGINS_TABS.includes(raw as TPluginsTab) ? (raw as TPluginsTab) : 'installed';
    }, [searchParams]);

    const setActiveTab = useCallback((next: string | null) => {
        const tab = (next ?? 'installed') as TPluginsTab;
        const sp = new URLSearchParams(searchParams);
        if (tab === 'installed') sp.delete('tab');
        else sp.set('tab', tab);
        router.replace(`${pathname}${sp.toString() ? `?${sp.toString()}` : ''}`, { scroll: false });
    }, [pathname, router, searchParams]);

    const onManifestFile = useCallback(async (file: File | null) => {
        if (!file) return;
        try {
            const text = await file.text();
            // Pretty-print so Monaco's JSON validator can give nicer
            // gutter hints. If the file isn't valid JSON, leave it as
            // typed so the user can see the parse error inline.
            try {
                const parsed = JSON.parse(text);
                setInstallManifest(JSON.stringify(parsed, null, 4));
            } catch {
                setInstallManifest(text);
            }
            setInstallManifestFileName(file.name);
            notifications.show({ color: 'blue', title: 'Manifest loaded', message: file.name });
        } catch (err) {
            notifications.show({ color: 'red', title: 'Could not read file', message: err instanceof Error ? err.message : String(err) });
        }
    }, []);

    const enableMutation = useAdminPluginEnable();
    const disableMutation = useAdminPluginDisable();
    const uninstallMutation = useAdminPluginUninstall();
    const purgeMutation = useAdminPluginPurge();
    const requestInstall = useAdminPluginRequestInstall();
    const finalizeInstall = useAdminPluginFinalizeInstall();

    const rows = useMemo(() => pluginList?.plugins ?? [], [pluginList]);
    const installMode = pluginList?.installMode;
    const safeMode = pluginList?.safeMode ?? false;
    const enabledSourcesCount = useMemo(
        () => (sources ?? []).filter((source) => source.enabled).length,
        [sources],
    );

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
        const manifestPluginId = typeof parsed?.id === 'string' ? parsed.id : null;
        if (!manifestPluginId) {
            notifications.show({ color: 'red', title: 'Manifest missing id', message: 'The manifest must contain a top-level "id" field.' });
            return;
        }
        try {
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

            <PluginVersionMismatchBanner />

            <Tabs value={activeTab} onChange={setActiveTab} keepMounted={false}>
                <Tabs.List>
                    <Tabs.Tab value="installed">Installed</Tabs.Tab>
                    <Tabs.Tab value="available">Available</Tabs.Tab>
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

                <Tabs.Panel value="available" pt="md">
                    <AvailablePluginsPanel enabledSourcesCount={enabledSourcesCount} />
                </Tabs.Panel>

                <Tabs.Panel value="sources" pt="md">
                    <PluginSourcesPanel />
                </Tabs.Panel>
            </Tabs>

            <ModalWrapper
                opened={purgeFor !== null}
                onClose={() => { setPurgeFor(null); setPurgeConfirm(''); }}
                title={`Purge ${purgeFor ?? ''}`}
                size="md"
                onDelete={onPurgeConfirm}
                deleteLabel="Purge plugin"
                onCancel={() => { setPurgeFor(null); setPurgeConfirm(''); }}
                isLoading={purgeMutation.isPending}
                disabled={purgeConfirm !== purgeFor}
            >
                <Stack gap="sm">
                    <Alert color="red" title="Destructive operation">
                        Purging drops every plugin-owned table and deletes every row tagged with this plugin. Plugin data is unrecoverable unless you took a backup first.
                    </Alert>
                    <TextInput
                        label={`Type "${purgeFor ?? ''}" to confirm`}
                        value={purgeConfirm}
                        onChange={(e) => setPurgeConfirm(e.currentTarget.value)}
                    />
                </Stack>
            </ModalWrapper>

            <ModalWrapper
                opened={installOpen}
                onClose={() => {
                    setInstallOpen(false);
                    setInstallManifest('');
                    setInstallPendingOperationId(null);
                    setInstallManifestFileName(null);
                }}
                title="Install plugin"
                size="xl"
                scrollAreaHeight={560}
                onCancel={() => {
                    setInstallOpen(false);
                    setInstallManifest('');
                    setInstallPendingOperationId(null);
                    setInstallManifestFileName(null);
                }}
                customActions={
                    installPendingOperationId === null ? (
                        <Button loading={requestInstall.isPending} onClick={onInstallRequest} disabled={!installManifest.trim()}>
                            Request install
                        </Button>
                    ) : (
                        <Button color="green" loading={finalizeInstall.isPending} onClick={onInstallFinalize}>
                            Finalize
                        </Button>
                    )
                }
            >
                <Stack gap="sm">
                    <Alert color="blue" title="Two ways to load the manifest">
                        Drop the plugin&apos;s <strong>plugin.json</strong> on the upload area below, click <strong>Choose file</strong>,
                        or paste the JSON directly into the editor. The host validates it against the manifest schema,
                        runs the install-policy check, and creates a staged operation. Click <strong>Finalize</strong> to apply.
                    </Alert>

                    <Dropzone
                        onDrop={(files: FileWithPath[]) => onManifestFile(files[0] ?? null)}
                        onReject={() => notifications.show({ color: 'red', title: 'Rejected', message: 'Only .json files are accepted.' })}
                        accept={{ 'application/json': ['.json'] }}
                        maxFiles={1}
                        multiple={false}
                        maxSize={2 * 1024 * 1024}
                    >
                        <Group justify="center" gap="md" mih={80} style={{ pointerEvents: 'none' }}>
                            <Dropzone.Accept>
                                <IconUpload size={32} stroke={1.5} />
                            </Dropzone.Accept>
                            <Dropzone.Reject>
                                <IconX size={32} stroke={1.5} />
                            </Dropzone.Reject>
                            <Dropzone.Idle>
                                <IconFileUpload size={32} stroke={1.5} />
                            </Dropzone.Idle>
                            <Stack gap={2} align="flex-start">
                                <Text size="sm" fw={600}>
                                    {installManifestFileName ?? 'Drop plugin.json here or click to browse'}
                                </Text>
                                <Text size="xs" c="dimmed">
                                    Accepts a single .json file up to 2&nbsp;MB.
                                </Text>
                            </Stack>
                        </Group>
                    </Dropzone>

                    <Group justify="space-between" align="center">
                        <Text size="sm" fw={600}>Plugin manifest (plugin.json)</Text>
                        <FileButton onChange={onManifestFile} accept="application/json,.json">
                            {(props) => (
                                <Button {...props} size="xs" variant="light" leftSection={<IconFileUpload size={14} />}>
                                    Choose file…
                                </Button>
                            )}
                        </FileButton>
                    </Group>

                    <Paper withBorder p={0} style={{ overflow: 'hidden' }}>
                        <MonacoFieldEditor
                            value={installManifest}
                            onChange={setInstallManifest}
                            language="json"
                            height={360}
                        />
                    </Paper>

                    <Switch
                        label="Enable plugin after install succeeds"
                        checked={installEnableOnSuccess}
                        onChange={(e) => setInstallEnableOnSuccess(e.currentTarget.checked)}
                    />
                    {installPendingOperationId !== null && (
                        <Alert color="green">
                            Operation #{installPendingOperationId} created. Click <strong>Finalize</strong> above to apply.
                        </Alert>
                    )}
                </Stack>
            </ModalWrapper>
        </Stack>
    );
}
