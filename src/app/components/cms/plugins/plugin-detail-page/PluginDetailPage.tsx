/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

/**
 * Plugin detail page — implements the §24.2 tab matrix from the plan.
 *
 * Tabs (left to right):
 *   1.  Overview          — identity, status, badges
 *   2.  Manifest          — full cached plugin.json (read-only)
 *   3.  Changelog         — manifest.changelog (markdown when available)
 *   4.  Files             — package + bundle locations
 *   5.  Dependencies      — manifest.dependencies plus host singletons
 *   6.  Conflicts         — manifest.conflicts
 *   7.  Permissions       — host permissions the plugin requires
 *   8.  Capabilities      — granted plugin-API capabilities
 *   9.  Styles            — frontend / mobile styles contributed
 *   10. API routes        — backend routes contributed
 *   11. Migrations        — Doctrine migrations the plugin ships
 *   12. Feature flags     — toggleable flags + their scopes
 *   13. Realtime topics   — Mercure topic descriptors
 *   14. Lookups           — lookup rows the plugin contributes
 *   15. Data ownership    — ownedTables + ownedDataTablePrefix
 *   16. Operation history — install/update/uninstall/rollback log
 *   17. Logs              — runtime log entries (aggregated)
 *   18. Health            — per-plugin health check report
 *
 * The page is fully data-driven: every tab pulls from the cached
 * `IAdminPluginDetail.manifest` payload that the backend already
 * serves, plus the dedicated health endpoint. Where a manifest does
 * not declare a section we render a clearly-labelled "—" so admins
 * can tell at a glance that the plugin has nothing to contribute
 * there (vs. data missing from the server).
 */

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
    Alert,
    Anchor,
    Badge,
    Box,
    Button,
    Card,
    Code,
    Divider,
    Grid,
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
import { notifications } from '@mantine/notifications';
import {
    IconActivity,
    IconAlertTriangle,
    IconApi,
    IconArrowLeft,
    IconCheck,
    IconClock,
    IconDatabase,
    IconFile,
    IconFileText,
    IconFlag,
    IconHistory,
    IconKey,
    IconLink,
    IconList,
    IconPackage,
    IconPalette,
    IconReceipt,
    IconRouter,
    IconShield,
    IconShieldLock,
    IconStethoscope,
    IconTrash,
    IconUpload,
} from '@tabler/icons-react';
import {
    useAdminPlugin,
    useAdminPluginDisable,
    useAdminPluginEnable,
    useAdminPluginFeatureFlagSet,
    useAdminPluginFinalizeUpdate,
    useAdminPluginHealth,
    useAdminPluginOperations,
    useAdminPluginPurge,
    useAdminPluginRequestUpdate,
    useAdminPluginRollback,
    useAdminPluginUninstall,
} from '../hooks/useAdminPlugins';
import type {
    IAdminPluginCompatibility,
    IAdminPluginFeatureFlag,
    IAdminPluginOperation,
} from '../../../../../types/responses/admin/plugins.types';

interface IPluginDetailPageProps {
    pluginId: string;
}

function CompatibilityBadge({ compat }: { compat?: IAdminPluginCompatibility | null }) {
    if (!compat) return <Badge color="gray">unknown</Badge>;
    const color = compat.severity === 'ok' ? 'green' : compat.severity === 'warning' ? 'yellow' : 'red';
    return (
        <Tooltip
            multiline
            w={320}
            label={compat.reasons && compat.reasons.length > 0 ? compat.reasons.join('\n') : 'No issues reported'}
        >
            <Badge color={color} variant="filled">
                {compat.severity}
            </Badge>
        </Tooltip>
    );
}

function StatusRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <Group justify="space-between" wrap="nowrap" align="flex-start">
            <Text c="dimmed" w={180}>{label}</Text>
            <Box style={{ flex: 1 }}>{value}</Box>
        </Group>
    );
}

function EmptyTab({ message }: { message: string }) {
    return (
        <Stack align="center" justify="center" py="xl">
            <Text c="dimmed">{message}</Text>
        </Stack>
    );
}

export function PluginDetailPage({ pluginId }: IPluginDetailPageProps) {
    const detail = useAdminPlugin(pluginId);
    const health = useAdminPluginHealth(pluginId);
    const operations = useAdminPluginOperations(pluginId);
    const enableMutation = useAdminPluginEnable();
    const disableMutation = useAdminPluginDisable();
    const uninstallMutation = useAdminPluginUninstall();
    const purgeMutation = useAdminPluginPurge();
    const rollbackMutation = useAdminPluginRollback();
    const requestUpdate = useAdminPluginRequestUpdate();
    const finalizeUpdate = useAdminPluginFinalizeUpdate();
    const setFlag = useAdminPluginFeatureFlagSet();

    const [purgeOpen, setPurgeOpen] = useState(false);
    const [purgeConfirm, setPurgeConfirm] = useState('');
    const [updateOpen, setUpdateOpen] = useState(false);
    const [updateManifest, setUpdateManifest] = useState('');
    const [updateForceMajor, setUpdateForceMajor] = useState(false);
    const [updatePendingOperationId, setUpdatePendingOperationId] = useState<number | null>(null);

    const manifest = (detail.data?.manifest ?? {}) as Record<string, unknown>;

    const dependencies = useMemo(() => {
        const deps = (manifest.dependencies as Record<string, string> | undefined) ?? {};
        return Object.entries(deps);
    }, [manifest]);

    const conflicts = useMemo(() => {
        const list = (manifest.conflicts as Array<{ pluginId?: string; version?: string; reason?: string }> | undefined) ?? [];
        return list;
    }, [manifest]);

    const requestedPermissions = useMemo(() => {
        const perms = (manifest.requestedPermissions as string[] | undefined) ?? [];
        return perms;
    }, [manifest]);

    const stylesContributed = useMemo(() => {
        const list = (manifest.styles as Array<{ name?: string; type?: string; group?: string }> | undefined) ?? [];
        return list;
    }, [manifest]);

    const apiRoutes = useMemo(() => {
        const list = (manifest.apiRoutes as Array<{ name?: string; method?: string; path?: string; controller?: string }> | undefined) ?? [];
        return list;
    }, [manifest]);

    const migrations = useMemo(() => {
        const list = (manifest.migrations as Array<{ version?: string; description?: string }> | undefined) ?? [];
        return list;
    }, [manifest]);

    const realtimeTopics = useMemo(() => {
        const topics = manifest.realtime as { topics?: Array<{ topicKey?: string; topicTemplate?: string; description?: string }> } | undefined;
        return topics?.topics ?? [];
    }, [manifest]);

    const lookups = useMemo(() => {
        const list = (manifest.lookups as Array<{ typeCode?: string; lookupCode?: string; lookupValue?: string }> | undefined) ?? [];
        return list;
    }, [manifest]);

    const dataAccess = (manifest.dataAccess as { ownedTables?: string[]; ownedDataTablePrefix?: string; readOnlyTables?: string[]; writeTables?: string[] } | undefined) ?? {};

    const changelog = useMemo(() => {
        const raw = manifest.changelog;
        if (typeof raw === 'string') return raw;
        if (Array.isArray(raw)) {
            return (raw as Array<{ version?: string; date?: string; notes?: string }>)
                .map((entry) => `## ${entry.version ?? '—'}${entry.date ? ` (${entry.date})` : ''}\n\n${entry.notes ?? ''}`)
                .join('\n\n---\n\n');
        }
        return null;
    }, [manifest]);

    const files = useMemo(() => {
        const summary = detail.data;
        const items: Array<{ label: string; value: string }> = [];
        if (summary?.frontendPackage) items.push({ label: 'Frontend package', value: `${summary.frontendPackage}@${summary.frontendPackageVersion ?? '—'}` });
        if (summary?.mobilePackage) items.push({ label: 'Mobile package', value: `${summary.mobilePackage}@${summary.mobilePackageVersion ?? '—'}` });
        const backendBundle = manifest.backend as { bundleClass?: string; package?: string } | undefined;
        if (backendBundle?.bundleClass) items.push({ label: 'Backend bundle', value: backendBundle.bundleClass });
        if (backendBundle?.package) items.push({ label: 'Backend composer package', value: backendBundle.package });
        const manifestPath = manifest.manifestPath as string | undefined;
        if (manifestPath) items.push({ label: 'Manifest path', value: manifestPath });
        return items;
    }, [detail.data, manifest]);

    const onEnable = async () => {
        try {
            await enableMutation.mutateAsync(pluginId);
            notifications.show({ color: 'green', title: 'Plugin enabled', message: pluginId });
        } catch (err) {
            notifications.show({ color: 'red', title: 'Enable failed', message: err instanceof Error ? err.message : String(err) });
        }
    };

    const onDisable = async () => {
        try {
            await disableMutation.mutateAsync(pluginId);
            notifications.show({ color: 'yellow', title: 'Plugin disabled', message: pluginId });
        } catch (err) {
            notifications.show({ color: 'red', title: 'Disable failed', message: err instanceof Error ? err.message : String(err) });
        }
    };

    const onUninstall = async () => {
        try {
            await uninstallMutation.mutateAsync(pluginId);
            notifications.show({ color: 'green', title: 'Plugin uninstalled', message: pluginId });
        } catch (err) {
            notifications.show({ color: 'red', title: 'Uninstall failed', message: err instanceof Error ? err.message : String(err) });
        }
    };

    const onPurgeConfirm = async () => {
        try {
            await purgeMutation.mutateAsync({ pluginId, confirmedPluginId: purgeConfirm });
            notifications.show({ color: 'green', title: 'Plugin purged', message: pluginId });
            setPurgeOpen(false);
            setPurgeConfirm('');
        } catch (err) {
            notifications.show({ color: 'red', title: 'Purge failed', message: err instanceof Error ? err.message : String(err) });
        }
    };

    const onUpdateRequest = async () => {
        let parsed: Record<string, unknown>;
        try {
            parsed = JSON.parse(updateManifest);
        } catch (err) {
            notifications.show({ color: 'red', title: 'Manifest is not valid JSON', message: err instanceof Error ? err.message : String(err) });
            return;
        }
        try {
            const op = await requestUpdate.mutateAsync({ pluginId, manifest: parsed, forceMajor: updateForceMajor });
            setUpdatePendingOperationId(op.data?.id ?? null);
            notifications.show({ color: 'blue', title: 'Update requested', message: `Operation ${op.data?.id} created.` });
        } catch (err) {
            notifications.show({ color: 'red', title: 'Update request failed', message: err instanceof Error ? err.message : String(err) });
        }
    };

    const onUpdateFinalize = async () => {
        if (updatePendingOperationId === null) return;
        let parsed: Record<string, unknown>;
        try {
            parsed = JSON.parse(updateManifest);
        } catch (err) {
            notifications.show({ color: 'red', title: 'Manifest is not valid JSON', message: err instanceof Error ? err.message : String(err) });
            return;
        }
        try {
            await finalizeUpdate.mutateAsync({ pluginId, operationId: updatePendingOperationId, manifest: parsed });
            notifications.show({ color: 'green', title: 'Update finalized', message: pluginId });
            setUpdateOpen(false);
            setUpdatePendingOperationId(null);
            setUpdateManifest('');
        } catch (err) {
            notifications.show({ color: 'red', title: 'Update finalize failed', message: err instanceof Error ? err.message : String(err) });
        }
    };

    const onRollbackOperation = async (op: IAdminPluginOperation) => {
        try {
            await rollbackMutation.mutateAsync(op.id);
            notifications.show({ color: 'green', title: 'Rollback issued', message: `Operation #${op.id} rolled back.` });
        } catch (err) {
            notifications.show({ color: 'red', title: 'Rollback failed', message: err instanceof Error ? err.message : String(err) });
        }
    };

    const onFlagToggle = async (flag: IAdminPluginFeatureFlag) => {
        try {
            await setFlag.mutateAsync({
                pluginId,
                flagKey: flag.flagKey,
                scope: flag.scope,
                scopeValue: flag.scopeValue,
                enabled: !flag.enabled,
            });
            notifications.show({ color: 'blue', title: 'Flag updated', message: flag.flagKey });
        } catch (err) {
            notifications.show({ color: 'red', title: 'Flag update failed', message: err instanceof Error ? err.message : String(err) });
        }
    };

    if (detail.isLoading) {
        return (
            <Stack align="center" mt="xl">
                <Loader size="lg" />
                <Text>Loading plugin…</Text>
            </Stack>
        );
    }

    if (detail.error || !detail.data) {
        return (
            <Alert color="red" title={`Failed to load plugin: ${pluginId}`}>
                {detail.error instanceof Error ? detail.error.message : 'Plugin not found.'}
            </Alert>
        );
    }

    const p = detail.data;

    return (
        <Stack gap="lg">
            <Group justify="space-between" wrap="nowrap" align="flex-start">
                <Stack gap={2}>
                    <Group gap="xs">
                        <Anchor component={Link} href="/admin/plugins" size="sm">
                            <Group gap={4} align="center">
                                <IconArrowLeft size={14} />
                                Back to plugins
                            </Group>
                        </Anchor>
                    </Group>
                    <Group gap="sm">
                        <Title order={2}>{p.name}</Title>
                        <Code>{p.pluginId}</Code>
                        <Badge color={p.enabled ? 'green' : 'gray'} variant="filled">
                            {p.enabled ? 'enabled' : 'disabled'}
                        </Badge>
                        <CompatibilityBadge compat={p.compatibility ?? null} />
                    </Group>
                    {p.description && <Text c="dimmed">{p.description}</Text>}
                </Stack>

                <Group gap="xs" wrap="nowrap">
                    {p.enabled ? (
                        <Button variant="default" loading={disableMutation.isPending} onClick={onDisable}>
                            Disable
                        </Button>
                    ) : (
                        <Button loading={enableMutation.isPending} onClick={onEnable}>
                            Enable
                        </Button>
                    )}
                    <Button variant="light" leftSection={<IconUpload size={14} />} onClick={() => setUpdateOpen(true)}>
                        Update…
                    </Button>
                    <Tooltip label="Removes packages; preserves data">
                        <Button variant="light" color="yellow" loading={uninstallMutation.isPending} onClick={onUninstall}>
                            Uninstall
                        </Button>
                    </Tooltip>
                    <Tooltip label="Destructive: drops plugin-owned tables and tagged rows">
                        <Button variant="light" color="red" leftSection={<IconTrash size={14} />} onClick={() => setPurgeOpen(true)}>
                            Purge…
                        </Button>
                    </Tooltip>
                </Group>
            </Group>

            <Tabs defaultValue="overview" variant="outline">
                <Tabs.List style={{ flexWrap: 'wrap' }}>
                    <Tabs.Tab value="overview" leftSection={<IconReceipt size={14} />}>Overview</Tabs.Tab>
                    <Tabs.Tab value="manifest" leftSection={<IconFileText size={14} />}>Manifest</Tabs.Tab>
                    <Tabs.Tab value="changelog" leftSection={<IconHistory size={14} />}>Changelog</Tabs.Tab>
                    <Tabs.Tab value="files" leftSection={<IconFile size={14} />}>Files</Tabs.Tab>
                    <Tabs.Tab value="dependencies" leftSection={<IconPackage size={14} />}>Dependencies</Tabs.Tab>
                    <Tabs.Tab value="conflicts" leftSection={<IconAlertTriangle size={14} />}>Conflicts</Tabs.Tab>
                    <Tabs.Tab value="permissions" leftSection={<IconShield size={14} />}>Permissions</Tabs.Tab>
                    <Tabs.Tab value="capabilities" leftSection={<IconShieldLock size={14} />}>Capabilities</Tabs.Tab>
                    <Tabs.Tab value="styles" leftSection={<IconPalette size={14} />}>Styles</Tabs.Tab>
                    <Tabs.Tab value="api-routes" leftSection={<IconApi size={14} />}>API routes</Tabs.Tab>
                    <Tabs.Tab value="migrations" leftSection={<IconDatabase size={14} />}>Migrations</Tabs.Tab>
                    <Tabs.Tab value="feature-flags" leftSection={<IconFlag size={14} />}>Feature flags</Tabs.Tab>
                    <Tabs.Tab value="realtime" leftSection={<IconRouter size={14} />}>Realtime</Tabs.Tab>
                    <Tabs.Tab value="lookups" leftSection={<IconList size={14} />}>Lookups</Tabs.Tab>
                    <Tabs.Tab value="data-ownership" leftSection={<IconKey size={14} />}>Data ownership</Tabs.Tab>
                    <Tabs.Tab value="operations" leftSection={<IconHistory size={14} />}>Operation history</Tabs.Tab>
                    <Tabs.Tab value="logs" leftSection={<IconClock size={14} />}>Logs</Tabs.Tab>
                    <Tabs.Tab value="health" leftSection={<IconStethoscope size={14} />}>Health</Tabs.Tab>
                </Tabs.List>

                {/* 1) Overview */}
                <Tabs.Panel value="overview" pt="md">
                    <Grid>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                            <Card withBorder>
                                <Stack gap="xs">
                                    <Title order={5}>Identity</Title>
                                    <StatusRow label="Plugin ID" value={<Code>{p.pluginId}</Code>} />
                                    <StatusRow label="Name" value={p.name} />
                                    <StatusRow label="Version" value={p.version} />
                                    <StatusRow label="Plugin API version" value={p.pluginApiVersion} />
                                    <StatusRow label="Trust level" value={<Badge color={p.trustLevel === 'official' ? 'green' : p.trustLevel === 'reviewed' ? 'blue' : 'gray'}>{p.trustLevel}</Badge>} />
                                    <StatusRow label="Install mode" value={<Badge variant="outline">{p.installMode}</Badge>} />
                                </Stack>
                            </Card>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                            <Card withBorder>
                                <Stack gap="xs">
                                    <Title order={5}>Lifecycle</Title>
                                    <StatusRow label="Installed at" value={p.installedAt} />
                                    <StatusRow label="Updated at" value={p.updatedAt} />
                                    <StatusRow label="Enabled at" value={p.enabledAt ?? '—'} />
                                    <StatusRow label="Disabled at" value={p.disabledAt ?? '—'} />
                                    <StatusRow label="Capabilities" value={(p.capabilities ?? []).length === 0 ? '—' : (p.capabilities ?? []).join(', ')} />
                                    <StatusRow label="Compatibility" value={<CompatibilityBadge compat={p.compatibility ?? null} />} />
                                </Stack>
                            </Card>
                        </Grid.Col>
                    </Grid>
                </Tabs.Panel>

                {/* 2) Manifest */}
                <Tabs.Panel value="manifest" pt="md">
                    <JsonInput
                        value={JSON.stringify(manifest, null, 2)}
                        readOnly
                        minRows={20}
                        autosize
                        formatOnBlur
                    />
                </Tabs.Panel>

                {/* 3) Changelog */}
                <Tabs.Panel value="changelog" pt="md">
                    {changelog ? (
                        <Card withBorder>
                            <ScrollArea h={400}>
                                <Box component="pre" style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                                    {changelog}
                                </Box>
                            </ScrollArea>
                        </Card>
                    ) : (
                        <EmptyTab message="Manifest does not declare a changelog." />
                    )}
                </Tabs.Panel>

                {/* 4) Files */}
                <Tabs.Panel value="files" pt="md">
                    {files.length === 0 ? (
                        <EmptyTab message="No package locations reported." />
                    ) : (
                        <Card withBorder>
                            <Stack gap="xs">
                                {files.map((f) => (
                                    <StatusRow key={f.label} label={f.label} value={<Code>{f.value}</Code>} />
                                ))}
                            </Stack>
                        </Card>
                    )}
                </Tabs.Panel>

                {/* 5) Dependencies */}
                <Tabs.Panel value="dependencies" pt="md">
                    {dependencies.length === 0 ? (
                        <EmptyTab message="Plugin does not declare any dependencies." />
                    ) : (
                        <Table withTableBorder striped>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Plugin / Package</Table.Th>
                                    <Table.Th>Version range</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {dependencies.map(([name, range]) => (
                                    <Table.Tr key={name}>
                                        <Table.Td><Code>{name}</Code></Table.Td>
                                        <Table.Td>{range}</Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    )}
                </Tabs.Panel>

                {/* 6) Conflicts */}
                <Tabs.Panel value="conflicts" pt="md">
                    {conflicts.length === 0 ? (
                        <EmptyTab message="No conflicts declared." />
                    ) : (
                        <Table withTableBorder striped>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Plugin</Table.Th>
                                    <Table.Th>Version</Table.Th>
                                    <Table.Th>Reason</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {conflicts.map((c, idx) => (
                                    <Table.Tr key={`${c.pluginId ?? 'conflict'}-${idx}`}>
                                        <Table.Td><Code>{c.pluginId ?? '—'}</Code></Table.Td>
                                        <Table.Td>{c.version ?? '—'}</Table.Td>
                                        <Table.Td>{c.reason ?? '—'}</Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    )}
                </Tabs.Panel>

                {/* 7) Permissions */}
                <Tabs.Panel value="permissions" pt="md">
                    {requestedPermissions.length === 0 ? (
                        <EmptyTab message="Plugin does not request any host permissions." />
                    ) : (
                        <Stack gap="xs">
                            {requestedPermissions.map((perm) => (
                                <Group key={perm} justify="space-between">
                                    <Code>{perm}</Code>
                                    <Badge color="blue" variant="light">requested</Badge>
                                </Group>
                            ))}
                        </Stack>
                    )}
                </Tabs.Panel>

                {/* 8) Capabilities */}
                <Tabs.Panel value="capabilities" pt="md">
                    {(p.capabilities ?? []).length === 0 ? (
                        <EmptyTab message="Plugin has no granted capabilities." />
                    ) : (
                        <Stack gap="xs">
                            {(p.capabilities ?? []).map((cap) => (
                                <Group key={cap} justify="space-between">
                                    <Code>{cap}</Code>
                                    <Badge color="green" variant="light">granted</Badge>
                                </Group>
                            ))}
                        </Stack>
                    )}
                </Tabs.Panel>

                {/* 9) Styles */}
                <Tabs.Panel value="styles" pt="md">
                    {stylesContributed.length === 0 ? (
                        <EmptyTab message="Plugin does not contribute any styles." />
                    ) : (
                        <Table withTableBorder striped>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Style name</Table.Th>
                                    <Table.Th>Type</Table.Th>
                                    <Table.Th>Group</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {stylesContributed.map((s, idx) => (
                                    <Table.Tr key={`${s.name ?? 'style'}-${idx}`}>
                                        <Table.Td><Code>{s.name ?? '—'}</Code></Table.Td>
                                        <Table.Td>{s.type ?? '—'}</Table.Td>
                                        <Table.Td>{s.group ?? '—'}</Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    )}
                </Tabs.Panel>

                {/* 10) API routes */}
                <Tabs.Panel value="api-routes" pt="md">
                    {apiRoutes.length === 0 ? (
                        <EmptyTab message="Plugin does not contribute any API routes." />
                    ) : (
                        <Table withTableBorder striped>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Route name</Table.Th>
                                    <Table.Th>Method</Table.Th>
                                    <Table.Th>Path</Table.Th>
                                    <Table.Th>Controller</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {apiRoutes.map((r, idx) => (
                                    <Table.Tr key={`${r.name ?? 'route'}-${idx}`}>
                                        <Table.Td><Code>{r.name ?? '—'}</Code></Table.Td>
                                        <Table.Td><Badge variant="light">{r.method ?? '—'}</Badge></Table.Td>
                                        <Table.Td><Code>{r.path ?? '—'}</Code></Table.Td>
                                        <Table.Td><Text size="xs" c="dimmed">{r.controller ?? '—'}</Text></Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    )}
                </Tabs.Panel>

                {/* 11) Migrations */}
                <Tabs.Panel value="migrations" pt="md">
                    {migrations.length === 0 ? (
                        <EmptyTab message="Plugin does not ship any database migrations." />
                    ) : (
                        <Table withTableBorder striped>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Version</Table.Th>
                                    <Table.Th>Description</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {migrations.map((m, idx) => (
                                    <Table.Tr key={`${m.version ?? 'migration'}-${idx}`}>
                                        <Table.Td><Code>{m.version ?? '—'}</Code></Table.Td>
                                        <Table.Td>{m.description ?? '—'}</Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    )}
                </Tabs.Panel>

                {/* 12) Feature flags */}
                <Tabs.Panel value="feature-flags" pt="md">
                    {(p.featureFlags ?? []).length === 0 ? (
                        <EmptyTab message="Plugin does not declare any feature flags." />
                    ) : (
                        <Stack gap="xs">
                            {(p.featureFlags ?? []).map((flag) => (
                                <Card key={`${flag.flagKey}|${flag.scope}|${flag.scopeValue}`} withBorder>
                                    <Group justify="space-between">
                                        <Stack gap={2}>
                                            <Text fw={600}>{flag.flagKey}</Text>
                                            <Text size="xs" c="dimmed">
                                                scope={flag.scope}{flag.scopeValue ? ` / ${flag.scopeValue}` : ''}
                                            </Text>
                                        </Stack>
                                        <Switch
                                            checked={flag.enabled}
                                            onChange={() => onFlagToggle(flag)}
                                            label={flag.enabled ? 'on' : 'off'}
                                        />
                                    </Group>
                                </Card>
                            ))}
                        </Stack>
                    )}
                </Tabs.Panel>

                {/* 13) Realtime topics */}
                <Tabs.Panel value="realtime" pt="md">
                    {realtimeTopics.length === 0 ? (
                        <EmptyTab message="Plugin does not declare any Mercure realtime topics." />
                    ) : (
                        <Stack gap="xs">
                            {realtimeTopics.map((t, idx) => (
                                <Card key={`${t.topicKey ?? 'topic'}-${idx}`} withBorder>
                                    <Group justify="space-between" wrap="nowrap">
                                        <Stack gap={2}>
                                            <Group gap="xs">
                                                <IconRouter size={14} />
                                                <Code>{t.topicKey ?? '—'}</Code>
                                            </Group>
                                            <Text size="xs" c="dimmed">{t.description ?? '—'}</Text>
                                        </Stack>
                                        <Code>{t.topicTemplate ?? '—'}</Code>
                                    </Group>
                                </Card>
                            ))}
                        </Stack>
                    )}
                </Tabs.Panel>

                {/* 14) Lookups */}
                <Tabs.Panel value="lookups" pt="md">
                    {lookups.length === 0 ? (
                        <EmptyTab message="Plugin does not contribute any lookup rows." />
                    ) : (
                        <Table withTableBorder striped>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Type code</Table.Th>
                                    <Table.Th>Lookup code</Table.Th>
                                    <Table.Th>Value</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {lookups.map((l, idx) => (
                                    <Table.Tr key={`${l.typeCode ?? 'lookup'}-${idx}`}>
                                        <Table.Td><Code>{l.typeCode ?? '—'}</Code></Table.Td>
                                        <Table.Td>{l.lookupCode ?? '—'}</Table.Td>
                                        <Table.Td>{l.lookupValue ?? '—'}</Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    )}
                </Tabs.Panel>

                {/* 15) Data ownership */}
                <Tabs.Panel value="data-ownership" pt="md">
                    <Card withBorder>
                        <Stack gap="xs">
                            <StatusRow label="Owned data table prefix" value={dataAccess.ownedDataTablePrefix ? <Code>{dataAccess.ownedDataTablePrefix}</Code> : '—'} />
                            <Divider />
                            <Text c="dimmed">Owned tables</Text>
                            {(dataAccess.ownedTables ?? []).length === 0 ? (
                                <Text c="dimmed">—</Text>
                            ) : (
                                <Stack gap={4}>
                                    {(dataAccess.ownedTables ?? []).map((tableName) => (
                                        <Code key={tableName}>{tableName}</Code>
                                    ))}
                                </Stack>
                            )}
                            <Divider />
                            <Text c="dimmed">Write access (host tables the plugin may insert into)</Text>
                            {(dataAccess.writeTables ?? []).length === 0 ? (
                                <Text c="dimmed">—</Text>
                            ) : (
                                <Stack gap={4}>
                                    {(dataAccess.writeTables ?? []).map((tableName) => (
                                        <Code key={tableName}>{tableName}</Code>
                                    ))}
                                </Stack>
                            )}
                            <Divider />
                            <Text c="dimmed">Read-only access</Text>
                            {(dataAccess.readOnlyTables ?? []).length === 0 ? (
                                <Text c="dimmed">—</Text>
                            ) : (
                                <Stack gap={4}>
                                    {(dataAccess.readOnlyTables ?? []).map((tableName) => (
                                        <Code key={tableName}>{tableName}</Code>
                                    ))}
                                </Stack>
                            )}
                        </Stack>
                    </Card>
                </Tabs.Panel>

                {/* 16) Operation history */}
                <Tabs.Panel value="operations" pt="md">
                    {operations.isLoading ? (
                        <Loader />
                    ) : (operations.data ?? []).length === 0 ? (
                        <EmptyTab message="No operations recorded for this plugin." />
                    ) : (
                        <Table withTableBorder striped>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>#</Table.Th>
                                    <Table.Th>Type</Table.Th>
                                    <Table.Th>Status</Table.Th>
                                    <Table.Th>From → To</Table.Th>
                                    <Table.Th>Created</Table.Th>
                                    <Table.Th>Finished</Table.Th>
                                    <Table.Th>Actions</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {(operations.data ?? []).map((op) => (
                                    <Table.Tr key={op.id}>
                                        <Table.Td>{op.id}</Table.Td>
                                        <Table.Td><Badge variant="light">{op.type}</Badge></Table.Td>
                                        <Table.Td>
                                            <Badge color={op.status === 'succeeded' ? 'green' : op.status === 'failed' ? 'red' : op.status === 'running' ? 'blue' : 'gray'}>
                                                {op.status}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>{op.fromVersion ?? '—'} → {op.toVersion ?? '—'}</Table.Td>
                                        <Table.Td>{op.createdAt}</Table.Td>
                                        <Table.Td>{op.finishedAt ?? '—'}</Table.Td>
                                        <Table.Td>
                                            {op.status === 'succeeded' && op.type !== 'rollback' && (
                                                <Button size="xs" variant="light" color="yellow" leftSection={<IconHistory size={12} />} loading={rollbackMutation.isPending} onClick={() => onRollbackOperation(op)}>
                                                    Rollback
                                                </Button>
                                            )}
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    )}
                </Tabs.Panel>

                {/* 17) Logs */}
                <Tabs.Panel value="logs" pt="md">
                    {operations.isLoading ? (
                        <Loader />
                    ) : (
                        (() => {
                            const allLogs = (operations.data ?? [])
                                .flatMap((op) => (op.logs ?? []).map((entry) => ({ ...entry, operationId: op.id, operationType: op.type })))
                                .sort((a, b) => (b.at ?? '').localeCompare(a.at ?? ''));
                            if (allLogs.length === 0) return <EmptyTab message="No log entries available." />;
                            return (
                                <ScrollArea h={400}>
                                    <Stack gap="xs">
                                        {allLogs.map((entry, idx) => (
                                            <Card key={`${entry.operationId}-${idx}`} withBorder padding="xs">
                                                <Group gap="xs">
                                                    <Code>#{entry.operationId}</Code>
                                                    <Badge variant="light">{entry.operationType}</Badge>
                                                    {entry.stage && <Badge variant="outline">{entry.stage}</Badge>}
                                                    <Text size="xs" c="dimmed">{entry.at}</Text>
                                                </Group>
                                                {entry.data !== undefined && (
                                                    <Box component="pre" style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: 11 }}>
                                                        {JSON.stringify(entry.data, null, 2)}
                                                    </Box>
                                                )}
                                            </Card>
                                        ))}
                                    </Stack>
                                </ScrollArea>
                            );
                        })()
                    )}
                </Tabs.Panel>

                {/* 18) Health */}
                <Tabs.Panel value="health" pt="md">
                    {health.isLoading ? (
                        <Loader />
                    ) : health.error || !health.data ? (
                        <Alert color="yellow" title="Health check unavailable" icon={<IconAlertTriangle size={16} />}>
                            {health.error instanceof Error ? health.error.message : 'No health endpoint registered for this plugin.'}
                        </Alert>
                    ) : (
                        <Stack gap="xs">
                            {(health.data.checks ?? []).map((check, idx) => (
                                <Card key={`${check.name}-${idx}`} withBorder>
                                    <Group justify="space-between">
                                        <Stack gap={2}>
                                            <Group gap="xs">
                                                {check.status === 'ok' ? (
                                                    <IconCheck size={14} color="green" />
                                                ) : check.status === 'warning' ? (
                                                    <IconAlertTriangle size={14} color="orange" />
                                                ) : (
                                                    <IconAlertTriangle size={14} color="red" />
                                                )}
                                                <Text fw={600}>{check.name}</Text>
                                            </Group>
                                            <Text size="xs" c="dimmed">{check.message}</Text>
                                        </Stack>
                                        <Badge color={check.status === 'ok' ? 'green' : check.status === 'warning' ? 'yellow' : 'red'}>
                                            {check.status}
                                        </Badge>
                                    </Group>
                                </Card>
                            ))}
                            {(health.data.checks ?? []).length === 0 && (
                                <EmptyTab message="Plugin reported no health checks." />
                            )}
                        </Stack>
                    )}
                </Tabs.Panel>
            </Tabs>

            <Modal opened={purgeOpen} onClose={() => { setPurgeOpen(false); setPurgeConfirm(''); }} title={`Purge ${pluginId}`} size="lg">
                <Stack gap="sm">
                    <Alert color="red" title="Destructive operation" icon={<IconAlertTriangle size={16} />}>
                        Purging drops every plugin-owned table and deletes every row tagged with this plugin. Plugin data is unrecoverable unless you took a backup first.
                    </Alert>
                    <TextInput
                        label={`Type "${pluginId}" to confirm`}
                        value={purgeConfirm}
                        onChange={(e) => setPurgeConfirm(e.currentTarget.value)}
                        placeholder={pluginId}
                    />
                    <Group justify="flex-end">
                        <Button variant="default" onClick={() => { setPurgeOpen(false); setPurgeConfirm(''); }}>Cancel</Button>
                        <Button color="red" disabled={purgeConfirm !== pluginId} loading={purgeMutation.isPending} onClick={onPurgeConfirm}>
                            Purge plugin
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            <Modal opened={updateOpen} onClose={() => { setUpdateOpen(false); setUpdateManifest(''); setUpdatePendingOperationId(null); }} title={`Update ${pluginId}`} size="xl">
                <Stack gap="sm">
                    <Alert color="blue" icon={<IconLink size={16} />}>
                        Paste the target version&apos;s <Code>plugin.json</Code>. The host runs the <Code>update-policy</Code> check and creates a staged operation;
                        you confirm with <strong>Finalize</strong> when the staged operation reports <Code>requested</Code>.
                    </Alert>
                    <JsonInput
                        label="Target plugin.json"
                        value={updateManifest}
                        onChange={setUpdateManifest}
                        minRows={12}
                        autosize
                        validationError="Invalid JSON"
                        formatOnBlur
                    />
                    <Switch
                        label="Force major version bump (use with caution)"
                        checked={updateForceMajor}
                        onChange={(e) => setUpdateForceMajor(e.currentTarget.checked)}
                    />
                    {updatePendingOperationId !== null && (
                        <Alert color="green" icon={<IconActivity size={16} />}>
                            Operation <Code>#{updatePendingOperationId}</Code> created. Click <strong>Finalize</strong> below to apply.
                        </Alert>
                    )}
                    <Group justify="flex-end">
                        <Button variant="default" onClick={() => { setUpdateOpen(false); setUpdateManifest(''); setUpdatePendingOperationId(null); }}>Cancel</Button>
                        {updatePendingOperationId === null ? (
                            <Button loading={requestUpdate.isPending} onClick={onUpdateRequest}>Request update</Button>
                        ) : (
                            <Button color="green" loading={finalizeUpdate.isPending} onClick={onUpdateFinalize}>Finalize</Button>
                        )}
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}
