/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

/**
 * `PluginsPage` — top-level admin page rendering installed plugins
 * with detail tabs (installed / available / sources) and a single
 * install modal that exposes all four install sources:
 *   1. From registry — handled inline by the AvailablePluginsPanel tab.
 *   2. From URL — paste a direct `plugin.json` URL.
 *   3. Upload .shplugin — drag-and-drop / file picker, the main manual
 *      install path. Pre-validated via `/admin/plugins/inspect-archive`.
 *   4. Paste JSON / Developer mode — Monaco editor, explicitly labelled
 *      developer / debugging only.
 *
 * All four paths POST to `/admin/plugins/install` and dispatch a single
 * `InstallPluginMessage`. The Mercure-driven invalidation surfaces the
 * resulting `plugin_operations` row on the Available tab.
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
    useAdminPluginInspectArchive,
    useAdminPluginInstall,
    useAdminPluginPurge,
    useAdminPluginSources,
    useAdminPluginUninstall,
    useAdminPlugins,
} from '../hooks/useAdminPlugins';
import { PluginSourcesPanel } from '../plugin-sources-panel/PluginSourcesPanel';
import { AvailablePluginsPanel } from '../available-plugins-panel/AvailablePluginsPanel';
import { UpdatesPanel } from '../updates-panel/UpdatesPanel';
import { PluginVersionMismatchBanner } from '../plugin-version-mismatch-banner/PluginVersionMismatchBanner';

type TPluginsTab = 'installed' | 'available' | 'updates' | 'sources';
const PLUGINS_TABS: readonly TPluginsTab[] = ['installed', 'available', 'updates', 'sources'];

type TInstallSourceTab = 'registry' | 'url' | 'archive' | 'paste';

export function PluginsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { data: pluginList, isLoading, error } = useAdminPlugins();
    const { data: sources } = useAdminPluginSources();
    const [purgeFor, setPurgeFor] = useState<string | null>(null);
    const [purgeConfirm, setPurgeConfirm] = useState('');

    const [installOpen, setInstallOpen] = useState(false);
    const [installSourceTab, setInstallSourceTab] = useState<TInstallSourceTab>('archive');
    const [installArchive, setInstallArchive] = useState<File | null>(null);
    const [installArchivePreview, setInstallArchivePreview] = useState<{
        manifest: Record<string, unknown>;
        compatibility: { severity: 'ok' | 'warning' | 'blocking'; reasons: string[] };
        capabilities: string[];
        signatureStatus: string;
    } | null>(null);
    const [installUrl, setInstallUrl] = useState('');
    const [installManifest, setInstallManifest] = useState('');
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

    const enableMutation = useAdminPluginEnable();
    const disableMutation = useAdminPluginDisable();
    const uninstallMutation = useAdminPluginUninstall();
    const purgeMutation = useAdminPluginPurge();
    const installMutation = useAdminPluginInstall();
    const inspectArchive = useAdminPluginInspectArchive();

    const onManifestFile = useCallback(async (file: File | null) => {
        if (!file) return;
        try {
            const text = await file.text();
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

    const onArchiveFile = useCallback(async (file: File | null) => {
        setInstallArchive(file);
        setInstallArchivePreview(null);
        if (!file) return;
        try {
            const result = await inspectArchive.mutateAsync(file);
            setInstallArchivePreview({
                manifest: result.data.manifest,
                compatibility: result.data.compatibility,
                capabilities: result.data.capabilities,
                signatureStatus: result.data.signatureStatus,
            });
            notifications.show({ color: 'green', title: '.shplugin verified', message: file.name });
        } catch (err) {
            notifications.show({
                color: 'red',
                title: 'Archive rejected',
                message: err instanceof Error ? err.message : String(err),
            });
        }
    }, [inspectArchive]);

    const rows = useMemo(() => pluginList?.plugins ?? [], [pluginList]);
    const installMode = pluginList?.installMode;
    const safeMode = pluginList?.safeMode ?? false;
    const enabledSourcesCount = useMemo(
        () => (sources ?? []).filter((source) => source.enabled).length,
        [sources],
    );

    useEffect(() => {
        if (!installOpen) {
            setInstallSourceTab('archive');
            setInstallArchive(null);
            setInstallArchivePreview(null);
            setInstallUrl('');
            setInstallManifest('');
            setInstallManifestFileName(null);
        }
    }, [installOpen]);

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

    const onInstallSubmit = async () => {
        try {
            let op;
            if (installSourceTab === 'archive') {
                if (!installArchive) {
                    notifications.show({ color: 'red', title: 'No .shplugin selected', message: 'Drop or pick a .shplugin file to install.' });
                    return;
                }
                op = await installMutation.mutateAsync({ source: 'archive', archive: installArchive });
            } else if (installSourceTab === 'url') {
                const url = installUrl.trim();
                if (url === '') {
                    notifications.show({ color: 'red', title: 'No URL', message: 'Enter a plugin.json URL.' });
                    return;
                }
                op = await installMutation.mutateAsync({ source: 'url', manifestUrl: url });
            } else if (installSourceTab === 'paste') {
                let parsed: Record<string, unknown>;
                try {
                    parsed = JSON.parse(installManifest);
                } catch (err) {
                    notifications.show({ color: 'red', title: 'Manifest is not valid JSON', message: err instanceof Error ? err.message : String(err) });
                    return;
                }
                op = await installMutation.mutateAsync({ source: 'paste', manifest: parsed });
            } else {
                notifications.show({ color: 'blue', title: 'Use the Available tab', message: 'Switch to the Available tab to install from a registry source.' });
                return;
            }
            notifications.show({
                color: 'green',
                title: 'Install queued',
                message: `Operation #${op.data?.id} dispatched. Watch the Operations tab for progress.`,
            });
            setInstallOpen(false);
        } catch (err) {
            notifications.show({ color: 'red', title: 'Install failed', message: err instanceof Error ? err.message : String(err) });
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
                    <Tabs.Tab value="updates">Updates</Tabs.Tab>
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

                <Tabs.Panel value="updates" pt="md">
                    <UpdatesPanel active={activeTab === 'updates'} />
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
                onClose={() => setInstallOpen(false)}
                title="Install plugin"
                size="xl"
                scrollAreaHeight={620}
                onCancel={() => setInstallOpen(false)}
                customActions={
                    installSourceTab === 'registry' ? null : (
                        <Button
                            loading={installMutation.isPending}
                            onClick={onInstallSubmit}
                            disabled={
                                installSourceTab === 'archive' ? !installArchive
                                    : installSourceTab === 'url' ? installUrl.trim() === ''
                                    : installSourceTab === 'paste' ? installManifest.trim() === ''
                                    : true
                            }
                        >
                            Install
                        </Button>
                    )
                }
            >
                <Stack gap="md">
                    <Tabs value={installSourceTab} onChange={(v) => setInstallSourceTab((v ?? 'archive') as TInstallSourceTab)}>
                        <Tabs.List>
                            <Tabs.Tab value="registry">From registry</Tabs.Tab>
                            <Tabs.Tab value="url">From URL</Tabs.Tab>
                            <Tabs.Tab value="archive">Upload .shplugin</Tabs.Tab>
                            <Tabs.Tab value="paste" color="gray">Paste JSON (developer)</Tabs.Tab>
                        </Tabs.List>

                        <Tabs.Panel value="registry" pt="md">
                            <Alert color="blue" title="Use the Available tab">
                                Browse and install plugins listed in your enabled registries from the
                                <strong> Available</strong> tab on the main page.
                            </Alert>
                        </Tabs.Panel>

                        <Tabs.Panel value="url" pt="md">
                            <Stack gap="sm">
                                <Text size="sm">Paste a direct URL to a published <code>plugin.json</code>. The host downloads, verifies the canonical signed payload, and dispatches the install operation.</Text>
                                <TextInput
                                    placeholder="https://example.com/path/to/plugin.json"
                                    value={installUrl}
                                    onChange={(e) => setInstallUrl(e.currentTarget.value)}
                                />
                            </Stack>
                        </Tabs.Panel>

                        <Tabs.Panel value="archive" pt="md">
                            <Stack gap="sm">
                                <Alert color="blue" title="Recommended for manual install">
                                    Drop the publisher&apos;s <strong>.shplugin</strong> archive. The host extracts it, verifies the
                                    Ed25519 signature + SHA-256 checksums, and dispatches the install operation. Drop the
                                    file or click to browse.
                                </Alert>
                                <Dropzone
                                    onDrop={(files: FileWithPath[]) => onArchiveFile(files[0] ?? null)}
                                    onReject={() => notifications.show({ color: 'red', title: 'Rejected', message: 'Only .shplugin files are accepted.' })}
                                    accept={['.shplugin']}
                                    maxFiles={1}
                                    multiple={false}
                                    maxSize={20 * 1024 * 1024}
                                >
                                    <Group justify="center" gap="md" mih={100} style={{ pointerEvents: 'none' }}>
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
                                                {installArchive?.name ?? 'Drop .shplugin here or click to browse'}
                                            </Text>
                                            <Text size="xs" c="dimmed">
                                                Accepts a single .shplugin archive up to 20 MB.
                                            </Text>
                                        </Stack>
                                    </Group>
                                </Dropzone>
                                <FileButton onChange={onArchiveFile} accept=".shplugin">
                                    {(props) => (
                                        <Button {...props} size="xs" variant="light" leftSection={<IconFileUpload size={14} />}>
                                            Choose file…
                                        </Button>
                                    )}
                                </FileButton>
                                {inspectArchive.isPending && (
                                    <Group gap="xs"><Loader size="xs" /><Text size="sm" c="dimmed">Verifying archive…</Text></Group>
                                )}
                                {installArchivePreview && (
                                    <Paper withBorder p="md">
                                        <Stack gap={4}>
                                            <Text size="sm" fw={600}>
                                                {String(installArchivePreview.manifest.name ?? installArchivePreview.manifest.id)} v{String(installArchivePreview.manifest.version)}
                                            </Text>
                                            <Group gap={6}>
                                                <Badge color={installArchivePreview.compatibility.severity === 'ok' ? 'green' : installArchivePreview.compatibility.severity === 'warning' ? 'yellow' : 'red'}>
                                                    {installArchivePreview.compatibility.severity}
                                                </Badge>
                                                <Badge color={installArchivePreview.signatureStatus === 'verified' ? 'green' : 'red'}>
                                                    {installArchivePreview.signatureStatus}
                                                </Badge>
                                                <Badge variant="light">{installArchivePreview.capabilities.length} capabilities</Badge>
                                            </Group>
                                            {installArchivePreview.compatibility.reasons.length > 0 && (
                                                <Text size="xs" c="dimmed">{installArchivePreview.compatibility.reasons.join('; ')}</Text>
                                            )}
                                        </Stack>
                                    </Paper>
                                )}
                            </Stack>
                        </Tabs.Panel>

                        <Tabs.Panel value="paste" pt="md">
                            <Stack gap="sm">
                                <Alert color="gray" title="Developer / debugging only">
                                    Pasting a raw <code>plugin.json</code> skips the publisher&apos;s signed archive. Use
                                    this only for local development of an in-progress plugin.
                                </Alert>
                                <Group justify="space-between" align="center">
                                    <Text size="sm" fw={600}>plugin.json</Text>
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
                                        height={320}
                                    />
                                </Paper>
                                {installManifestFileName && (
                                    <Text size="xs" c="dimmed">Loaded {installManifestFileName}</Text>
                                )}
                            </Stack>
                        </Tabs.Panel>
                    </Tabs>
                </Stack>
            </ModalWrapper>
        </Stack>
    );
}
