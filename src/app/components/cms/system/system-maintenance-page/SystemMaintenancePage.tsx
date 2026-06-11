/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * System Maintenance / Update page (instance-scoped).
 *
 * Shows the current instance version facts + installed-plugin compatibility,
 * lets an admin run a compatibility preflight for a target version, and request
 * an update for THIS instance. Hard rules enforced in the UI:
 *   - the browser never sends an `instance_id` (the backend derives it);
 *   - a "blocked" preflight disables the request;
 *   - a destructive DB migration requires the typed confirmation + the accepted
 *     migration-risk checkbox before the request button enables;
 *   - the request button is hidden unless the admin holds `admin.system.update`.
 * The SelfHelp Manager (not the CMS) performs the actual Docker work.
 */
'use client';

import { useState } from 'react';
import {
    Paper, Stack, Grid, Group, Title, Text, Badge, Table, TextInput, Button,
    Checkbox, Alert, Progress, Code, LoadingOverlay, Divider, List, Autocomplete,
} from '@mantine/core';
import {
    IconInfoCircle, IconAlertTriangle, IconRefresh, IconShieldCheck, IconCircleCheck,
} from '@tabler/icons-react';
import { PageHeader } from '../../../shared/common/PageHeader';
import { useAuth } from '../../../../../hooks/useAuth';
import {
    useSystemVersion, useSystemHealth, useSystemAdvisories, useUpdatePreflight, useUpdateStatus,
    useRequestUpdateMutation, useSystemMaintenance, useSetMaintenanceMutation, useUpdateReleases,
} from '../../../../../hooks/useSystem';
import type {
    TUpdatePreflightStatus, TUpdateCheckSeverity, TUpdateOperationStatus,
    TSystemHealthOverall, TSystemComponentStatus, TSystemAdvisorySeverity,
} from '../../../../../types/responses/admin/system.types';

const PREFLIGHT_COLOR: Record<TUpdatePreflightStatus, string> = {
    ok: 'green',
    warning: 'yellow',
    blocked: 'red',
};

const SEVERITY_COLOR: Record<TUpdateCheckSeverity, string> = {
    info: 'blue',
    warning: 'yellow',
    error: 'red',
};

const OPERATION_COLOR: Record<TUpdateOperationStatus, string> = {
    idle: 'gray',
    requested: 'blue',
    approved: 'cyan',
    accepted: 'cyan',
    running: 'indigo',
    preflight_running: 'indigo',
    preflight_failed: 'red',
    backup_running: 'indigo',
    update_running: 'indigo',
    migration_running: 'indigo',
    health_check_running: 'indigo',
    succeeded: 'green',
    failed: 'red',
    rollback_running: 'orange',
    rolled_back: 'orange',
    rollback_failed: 'red',
    rejected: 'gray',
};

const HEALTH_OVERALL_COLOR: Record<TSystemHealthOverall, string> = {
    healthy: 'green',
    degraded: 'yellow',
    down: 'red',
};

const COMPONENT_COLOR: Record<TSystemComponentStatus, string> = {
    ok: 'green',
    configured: 'teal',
    degraded: 'yellow',
    down: 'red',
    not_configured: 'gray',
    unknown: 'gray',
};

const ADVISORY_SEVERITY_COLOR: Record<TSystemAdvisorySeverity, string> = {
    low: 'gray',
    medium: 'yellow',
    high: 'orange',
    critical: 'red',
};

/**
 * The frontend's own package version, inlined at build time (next.config.mjs).
 * Used as a self-reported fallback when the backend reports `unknown` (i.e.
 * SELFHELP_FRONTEND_VERSION is not set on the backend — typical for dev).
 */
const SELF_REPORTED_FRONTEND_VERSION = process.env.NEXT_PUBLIC_FRONTEND_VERSION ?? 'unknown';

// Statuses for which the operation is still in flight, so the UI keeps polling.
const ACTIVE_STATUSES: TUpdateOperationStatus[] = [
    'requested',
    'approved',
    'accepted',
    'running',
    'preflight_running',
    'backup_running',
    'update_running',
    'migration_running',
    'health_check_running',
    'rollback_running',
];

export function SystemMaintenancePage() {
    const { permissionChecker } = useAuth();
    const canUpdate = permissionChecker?.canUpdateSystem() ?? false;
    const canManageMaintenance = permissionChecker?.canManageMaintenance() ?? false;

    const [targetInput, setTargetInput] = useState('');
    const [checkedTarget, setCheckedTarget] = useState<string | null>(null);
    const [acceptedRisk, setAcceptedRisk] = useState(false);
    const [typedConfirmation, setTypedConfirmation] = useState('');
    const [maintMessage, setMaintMessage] = useState('');

    const version = useSystemVersion();
    const health = useSystemHealth(true, 15000);
    const advisories = useSystemAdvisories();
    const maintenance = useSystemMaintenance();
    const setMaintenance = useSetMaintenanceMutation();
    const preflight = useUpdatePreflight(checkedTarget);
    const requestUpdate = useRequestUpdateMutation();
    const releases = useUpdateReleases();

    const versionData = version.data;
    const healthData = health.data;
    const advisoriesData = advisories.data;
    const maintenanceData = maintenance.data;
    const preflightData = preflight.data;
    const releasesData = releases.data;

    // Registry-published core versions for the picker (newest first), excluding
    // the version this instance already runs. Blocked releases stay listed —
    // the preflight is what surfaces and enforces the block.
    const releaseOptions = (releasesData?.releases ?? [])
        .filter((r) => r.version !== releasesData?.current_version)
        .map((r) => r.version);

    // Poll the status while an operation is active.
    const status = useUpdateStatus(true, undefined);
    const statusData = status.data;
    const isActive = !!statusData && statusData.operation_id !== '' && ACTIVE_STATUSES.includes(statusData.status);
    const liveStatus = useUpdateStatus(isActive, isActive ? 4000 : false);
    const currentStatus = liveStatus.data ?? statusData;

    const destructive = preflightData?.database.destructive ?? false;
    const confirmationOk = !destructive || (acceptedRisk && typedConfirmation.trim() === checkedTarget);
    const canRequest =
        canUpdate &&
        !!preflightData &&
        preflightData.status !== 'blocked' &&
        confirmationOk &&
        !requestUpdate.isPending;

    function handleCheck() {
        const next = targetInput.trim();
        if (next === '') return;
        setAcceptedRisk(false);
        setTypedConfirmation('');
        setCheckedTarget(next);
    }

    function handleToggleMaintenance() {
        if (!maintenanceData) return;
        const next = !maintenanceData.enabled;
        setMaintenance.mutate({
            enabled: next,
            message: next && maintMessage.trim() !== '' ? maintMessage.trim() : undefined,
        });
    }

    function handleRequest() {
        if (!preflightData || !checkedTarget) return;
        requestUpdate.mutate({
            target_version: checkedTarget,
            preflight_id: preflightData.preflight_id,
            accepted_migration_risk: acceptedRisk,
            typed_confirmation: typedConfirmation.trim() === '' ? undefined : typedConfirmation.trim(),
        });
    }

    return (
        <Paper p="md" radius="md" pos="relative">
            <LoadingOverlay visible={version.isLoading} />
            <Stack gap="md">
                <PageHeader
                    title="System Maintenance"
                    subtitle="View this instance's version and request connected, signed updates. The SelfHelp Manager performs the Docker work; the CMS only records the request for THIS instance."
                />

                {version.isError && (
                    <Alert icon={<IconInfoCircle size={16} />} color="red" variant="light" title="Failed to load version">
                        Could not load the instance version summary. Try refreshing the page.
                    </Alert>
                )}

                <Grid>
                    {/* Version summary */}
                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <Paper p="md" radius="md" withBorder>
                            <Group justify="space-between" mb="sm">
                                <Title order={4}>Current instance</Title>
                                <Group gap="xs">
                                    {versionData?.maintenance_mode && <Badge color="orange" variant="light">Maintenance</Badge>}
                                    {versionData?.safe_mode && <Badge color="red" variant="light">Safe mode</Badge>}
                                </Group>
                            </Group>
                            {versionData && (
                                <Table withRowBorders={false} verticalSpacing="xs">
                                    <Table.Tbody>
                                        <Table.Tr>
                                            <Table.Td><Text size="sm" c="dimmed">SelfHelp version</Text></Table.Td>
                                            <Table.Td><Code>{versionData.selfhelp_version}</Code></Table.Td>
                                        </Table.Tr>
                                        <Table.Tr>
                                            <Table.Td><Text size="sm" c="dimmed">Backend</Text></Table.Td>
                                            <Table.Td><Code>{versionData.backend_version}</Code></Table.Td>
                                        </Table.Tr>
                                        <Table.Tr>
                                            <Table.Td><Text size="sm" c="dimmed">Frontend</Text></Table.Td>
                                            <Table.Td>
                                                {versionData.frontend_version === 'unknown' ? (
                                                    <Group gap="xs">
                                                        <Code>{SELF_REPORTED_FRONTEND_VERSION}</Code>
                                                        <Text size="xs" c="dimmed">
                                                            self-reported — the backend has no SELFHELP_FRONTEND_VERSION set
                                                        </Text>
                                                    </Group>
                                                ) : (
                                                    <Code>{versionData.frontend_version}</Code>
                                                )}
                                            </Table.Td>
                                        </Table.Tr>
                                        <Table.Tr>
                                            <Table.Td><Text size="sm" c="dimmed">Plugin API</Text></Table.Td>
                                            <Table.Td><Code>{versionData.plugin_api_version}</Code></Table.Td>
                                        </Table.Tr>
                                        <Table.Tr>
                                            <Table.Td><Text size="sm" c="dimmed">DB migration</Text></Table.Td>
                                            <Table.Td><Code>{versionData.database_migration_version}</Code></Table.Td>
                                        </Table.Tr>
                                        <Table.Tr>
                                            <Table.Td><Text size="sm" c="dimmed">Instance</Text></Table.Td>
                                            <Table.Td><Code>{versionData.instance_id}</Code></Table.Td>
                                        </Table.Tr>
                                        <Table.Tr>
                                            <Table.Td><Text size="sm" c="dimmed">Deployment</Text></Table.Td>
                                            <Table.Td>
                                                {versionData.deployment === 'docker' ? (
                                                    <Badge color="blue" variant="light">Docker image</Badge>
                                                ) : (
                                                    <Group gap="xs">
                                                        <Badge color="grape" variant="light">Source checkout</Badge>
                                                        <Text size="xs" c="dimmed">dev / composer setup — not a managed install</Text>
                                                    </Group>
                                                )}
                                            </Table.Td>
                                        </Table.Tr>
                                    </Table.Tbody>
                                </Table>
                            )}
                        </Paper>
                    </Grid.Col>

                    {/* Installed plugin compatibility */}
                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <Paper p="md" radius="md" withBorder>
                            <Title order={4} mb="sm">Installed plugins</Title>
                            {versionData && versionData.installed_plugins.length === 0 && (
                                <Text size="sm" c="dimmed">No plugins installed.</Text>
                            )}
                            {versionData && versionData.installed_plugins.length > 0 && (
                                <Table verticalSpacing="xs">
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th>Plugin</Table.Th>
                                            <Table.Th>Version</Table.Th>
                                            <Table.Th>Compatible</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {versionData.installed_plugins.map((p) => (
                                            <Table.Tr key={p.id}>
                                                <Table.Td><Text size="sm">{p.id}</Text></Table.Td>
                                                <Table.Td><Code>{p.version}</Code></Table.Td>
                                                <Table.Td>
                                                    <Badge color={p.compatible ? 'green' : 'red'} variant="light">
                                                        {p.compatible ? 'Yes' : 'No'}
                                                    </Badge>
                                                </Table.Td>
                                            </Table.Tr>
                                        ))}
                                    </Table.Tbody>
                                </Table>
                            )}
                        </Paper>
                    </Grid.Col>
                </Grid>

                {/* Aggregated health / status */}
                <Paper p="md" radius="md" withBorder pos="relative">
                    <LoadingOverlay visible={health.isLoading} />
                    <Group justify="space-between" mb="sm">
                        <Title order={4}>System health</Title>
                        {healthData && (
                            <Badge color={HEALTH_OVERALL_COLOR[healthData.overall]} variant="filled">
                                {healthData.overall.toUpperCase()}
                            </Badge>
                        )}
                    </Group>
                    {health.isError && (
                        <Alert icon={<IconInfoCircle size={16} />} color="red" variant="light">
                            Could not load system health. Try refreshing the page.
                        </Alert>
                    )}
                    {healthData && (
                        <Table verticalSpacing="xs">
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Component</Table.Th>
                                    <Table.Th>Status</Table.Th>
                                    <Table.Th>Detail</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {healthData.components.map((c) => (
                                    <Table.Tr key={c.name}>
                                        <Table.Td><Text size="sm" tt="capitalize">{c.name}</Text></Table.Td>
                                        <Table.Td>
                                            <Badge color={COMPONENT_COLOR[c.status]} variant="light">{c.status}</Badge>
                                        </Table.Td>
                                        <Table.Td><Text size="sm" c="dimmed">{c.detail}</Text></Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    )}
                    {healthData && (
                        <Text size="xs" c="dimmed" mt="xs">
                            Checked at {new Date(healthData.checked_at).toLocaleString()}.
                        </Text>
                    )}
                </Paper>

                {/* Security advisories (registry feed, filtered to installed components) */}
                <Paper p="md" radius="md" withBorder pos="relative">
                    <LoadingOverlay visible={advisories.isLoading} />
                    <Group justify="space-between" mb="sm">
                        <Title order={4}>Security advisories</Title>
                        {advisoriesData && (
                            advisoriesData.advisories.length > 0 ? (
                                <Badge color="red" variant="filled">
                                    {advisoriesData.advisories.length} affecting this instance
                                </Badge>
                            ) : advisoriesData.available ? (
                                <Badge color="green" variant="light">None</Badge>
                            ) : (
                                <Badge color="gray" variant="light">Could not check</Badge>
                            )
                        )}
                    </Group>
                    {advisories.isError && (
                        <Alert icon={<IconInfoCircle size={16} />} color="red" variant="light">
                            Could not load security advisories. Try refreshing the page.
                        </Alert>
                    )}
                    {advisoriesData && !advisoriesData.available && (
                        <Alert icon={<IconInfoCircle size={16} />} color="gray" variant="light">
                            The official registry could not be reached, so advisories could not be checked. This does
                            not block the instance; try again when connectivity is restored.
                        </Alert>
                    )}
                    {advisoriesData && advisoriesData.available && advisoriesData.advisories.length === 0 && (
                        <Alert icon={<IconShieldCheck size={16} />} color="green" variant="light">
                            No known security advisories affect the components installed on this instance.
                        </Alert>
                    )}
                    {advisoriesData && advisoriesData.advisories.length > 0 && (
                        <Stack gap="sm">
                            {advisoriesData.advisories.map((advisory) => (
                                <Alert
                                    key={advisory.id}
                                    icon={<IconAlertTriangle size={16} />}
                                    color={ADVISORY_SEVERITY_COLOR[advisory.severity]}
                                    variant="light"
                                    title={
                                        <Group gap="xs">
                                            <Badge color={ADVISORY_SEVERITY_COLOR[advisory.severity]} variant="filled" size="sm">
                                                {advisory.severity}
                                            </Badge>
                                            <Text fw={600} size="sm">{advisory.id}</Text>
                                            {advisory.blocked && <Badge color="red" variant="light" size="sm">Blocks updates</Badge>}
                                        </Group>
                                    }
                                >
                                    <Stack gap={4}>
                                        <Text size="sm">{advisory.recommended_action}</Text>
                                        <Text size="xs" c="dimmed">
                                            Affects: {advisory.affected.map((a) => `${a.kind} ${a.id} @ ${a.installed_version}`).join(', ')}
                                        </Text>
                                        {advisory.fixed_versions.length > 0 && (
                                            <Text size="xs" c="dimmed">
                                                Fixed in: <Code>{advisory.fixed_versions.join(', ')}</Code>
                                            </Text>
                                        )}
                                        {advisory.details_url && (
                                            <Text size="xs">
                                                <a href={advisory.details_url} target="_blank" rel="noopener noreferrer">Advisory details</a>
                                            </Text>
                                        )}
                                    </Stack>
                                </Alert>
                            ))}
                        </Stack>
                    )}
                </Paper>

                {/* Maintenance + safe mode */}
                <Paper p="md" radius="md" withBorder pos="relative">
                    <LoadingOverlay visible={maintenance.isLoading} />
                    <Group justify="space-between" mb="sm">
                        <Title order={4}>Maintenance mode</Title>
                        {maintenanceData && (
                            <Badge color={maintenanceData.enabled ? 'orange' : 'green'} variant="light">
                                {maintenanceData.enabled ? 'ON' : 'OFF'}
                            </Badge>
                        )}
                    </Group>
                    {maintenance.isError && (
                        <Alert icon={<IconInfoCircle size={16} />} color="red" variant="light">
                            Could not load the maintenance state. Try refreshing the page.
                        </Alert>
                    )}
                    {maintenanceData && (
                        <Stack gap="sm">
                            <Text size="sm" c="dimmed">
                                When enabled, the instance is flagged as under maintenance and the state is surfaced
                                in health/status. The SelfHelp Manager and admin work can still proceed.
                            </Text>

                            {maintenanceData.forced_by_env && (
                                <Alert icon={<IconAlertTriangle size={16} />} color="yellow" variant="light" title="Enforced by server configuration">
                                    Maintenance is enforced by <Code>SELFHELP_MAINTENANCE_MODE</Code> and cannot be
                                    changed from the CMS. Clear it in the instance environment.
                                </Alert>
                            )}

                            {maintenanceData.enabled && maintenanceData.message && (
                                <Text size="sm">Note: {maintenanceData.message}</Text>
                            )}
                            {maintenanceData.enabled && maintenanceData.since && (
                                <Text size="xs" c="dimmed">
                                    Since {new Date(maintenanceData.since).toLocaleString()}
                                    {maintenanceData.updated_by ? ` (${maintenanceData.updated_by})` : ''}.
                                </Text>
                            )}

                            {maintenanceData.safe_mode && (
                                <Alert icon={<IconShieldCheck size={16} />} color="red" variant="light" title="Safe mode is active">
                                    Plugins are disabled (safe mode). This is toggled by the operator via the instance
                                    environment (<Code>SELFHELP_DISABLE_PLUGINS</Code>) or the canonical
                                    {' '}<Code>selfhelp:safe-mode</Code> CLI — not from the CMS.
                                </Alert>
                            )}

                            {canManageMaintenance ? (
                                <>
                                    {!maintenanceData.enabled && !maintenanceData.forced_by_env && (
                                        <TextInput
                                            label="Operator note (optional)"
                                            placeholder="e.g. Upgrading to 8.1.0; back at 14:00 UTC"
                                            value={maintMessage}
                                            onChange={(e) => setMaintMessage(e.currentTarget.value)}
                                        />
                                    )}
                                    <Group justify="flex-end">
                                        <Button
                                            color={maintenanceData.enabled ? 'green' : 'orange'}
                                            variant={maintenanceData.enabled ? 'light' : 'filled'}
                                            loading={setMaintenance.isPending}
                                            disabled={maintenanceData.forced_by_env}
                                            onClick={handleToggleMaintenance}
                                        >
                                            {maintenanceData.enabled ? 'Disable maintenance' : 'Enable maintenance'}
                                        </Button>
                                    </Group>
                                </>
                            ) : (
                                <Alert icon={<IconShieldCheck size={16} />} color="gray" variant="light">
                                    You need the <Code>admin.system.maintenance</Code> permission to change maintenance mode.
                                </Alert>
                            )}
                        </Stack>
                    )}
                </Paper>

                {/* Operations & support guidance (Manager-performed; the CMS never
                    runs Docker/backups itself, so this surfaces the exact steps). */}
                <Paper p="md" radius="md" withBorder>
                    <Title order={4} mb="sm">Backups &amp; support</Title>
                    <Stack gap="sm">
                        <Text size="sm" c="dimmed">
                            Backups and support bundles are produced by the SelfHelp Manager on the server,
                            not from the CMS. Run these from the server host (the operator console):
                        </Text>
                        <List size="sm" spacing="xs">
                            <List.Item>
                                <Text size="sm">
                                    Create a backup before risky changes:{' '}
                                    <Code>sh-manager instance backup {versionData?.instance_id ?? '<instance-id>'}</Code>.
                                    Backups are stored under the instance&apos;s <Code>backups/</Code> directory and
                                    preserve DB, uploads, plugin artifacts, and secrets.
                                </Text>
                            </List.Item>
                            <List.Item>
                                <Text size="sm">
                                    Collect a redacted support bundle (no secrets):{' '}
                                    <Code>sh-manager instance support-bundle {versionData?.instance_id ?? '<instance-id>'}</Code>.
                                </Text>
                            </List.Item>
                            <List.Item>
                                <Text size="sm">
                                    Security advisories from the official registry are evaluated automatically during a
                                    <strong> Check compatibility</strong> preflight below and appear as
                                    {' '}<Badge component="span" size="xs" color="red" variant="light">error</Badge> checks when a blocking
                                    advisory affects the target version.
                                </Text>
                            </List.Item>
                        </List>
                    </Stack>
                </Paper>

                {/* Active operation status */}
                {currentStatus && currentStatus.operation_id !== '' && (
                    <Paper p="md" radius="md" withBorder>
                        <Group justify="space-between" mb="xs">
                            <Title order={4}>Update operation</Title>
                            <Badge color={OPERATION_COLOR[currentStatus.status]} variant="light">
                                {currentStatus.status}
                            </Badge>
                        </Group>
                        <Text size="sm" c="dimmed" mb="xs">
                            Operation <Code>{currentStatus.operation_id}</Code> → <Code>{currentStatus.target_version}</Code>
                        </Text>
                        <Progress value={currentStatus.progress_percent} mb="sm" />
                        {currentStatus.message && <Text size="sm" mb="xs">{currentStatus.message}</Text>}
                        {currentStatus.steps.length > 0 && (
                            <List size="sm" spacing="xs">
                                {currentStatus.steps.map((step) => (
                                    <List.Item key={step.name} icon={<IconCircleCheck size={14} />}>
                                        {step.name} — {step.status}{step.detail ? `: ${step.detail}` : ''}
                                    </List.Item>
                                ))}
                            </List>
                        )}
                    </Paper>
                )}

                <Divider label="Request an update" labelPosition="center" />

                {/* Update request */}
                <Paper p="md" radius="md" withBorder pos="relative">
                    <LoadingOverlay visible={preflight.isFetching || requestUpdate.isPending} />
                    <Stack gap="sm">
                        <Group align="flex-end" gap="sm">
                            <Autocomplete
                                label="Target version"
                                data-testid="target-version-input"
                                placeholder={releaseOptions.length > 0 ? `e.g. ${releaseOptions[0]}` : 'e.g. 0.1.1'}
                                description={
                                    releasesData?.available
                                        ? 'Versions published in the official registry (newest first). You can also type a version manually.'
                                        : 'The registry could not be reached — type the target version manually.'
                                }
                                data={releaseOptions}
                                value={targetInput}
                                onChange={setTargetInput}
                                style={{ flex: 1 }}
                            />
                            <Button
                                leftSection={<IconRefresh size={16} />}
                                onClick={handleCheck}
                                disabled={targetInput.trim() === ''}
                                variant="default"
                            >
                                Check compatibility
                            </Button>
                        </Group>

                        {preflight.isError && (
                            <Alert icon={<IconInfoCircle size={16} />} color="red" variant="light">
                                Preflight failed. Check the target version and try again.
                            </Alert>
                        )}

                        {preflightData && (
                            <Stack gap="sm">
                                <Group gap="xs">
                                    <Text fw={600}>Preflight</Text>
                                    <Badge color={PREFLIGHT_COLOR[preflightData.status]} variant="filled">
                                        {preflightData.status.toUpperCase()}
                                    </Badge>
                                    <Text size="sm" c="dimmed">
                                        <Code>{preflightData.current_version}</Code> → <Code>{preflightData.target_version}</Code>
                                    </Text>
                                </Group>

                                {preflightData.checks.length > 0 && (
                                    <Stack gap={6}>
                                        {preflightData.checks.map((check, idx) => {
                                            const hasCompat = Boolean(
                                                check.component_id ||
                                                    check.required_range ||
                                                    check.current_version ||
                                                    check.target_version,
                                            );
                                            return (
                                                <div key={`${check.code}-${check.component_id ?? idx}`}>
                                                    <Group gap="xs" align="flex-start" wrap="nowrap">
                                                        <Badge size="xs" color={SEVERITY_COLOR[check.severity]} variant="light">
                                                            {check.severity}
                                                        </Badge>
                                                        <Text size="sm">{check.message}</Text>
                                                    </Group>
                                                    {hasCompat && (
                                                        <Group gap="xs" mt={4} ml={28} wrap="wrap">
                                                            {check.component_id && (
                                                                <Badge size="xs" variant="outline" color="gray">
                                                                    {check.component ? `${check.component}: ` : ''}
                                                                    {check.component_id}
                                                                </Badge>
                                                            )}
                                                            {check.required_range && (
                                                                <Text size="xs" c="dimmed">
                                                                    requires <Code>{check.required_range}</Code>
                                                                </Text>
                                                            )}
                                                            {(check.current_version || check.target_version) && (
                                                                <Text size="xs" c="dimmed">
                                                                    <Code>{check.current_version ?? '—'}</Code> →{' '}
                                                                    <Code>{check.target_version ?? '—'}</Code>
                                                                </Text>
                                                            )}
                                                            {check.pinned && (
                                                                <Badge size="xs" color="orange" variant="light">
                                                                    pinned — unpin to update
                                                                </Badge>
                                                            )}
                                                        </Group>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </Stack>
                                )}

                                {destructive && (
                                    <Alert icon={<IconAlertTriangle size={16} />} color="red" variant="light" title="Destructive database migration">
                                        This update contains a destructive migration. A verified backup is required.
                                        Automatic rollback is only available <strong>before</strong> migrations run &mdash; once a
                                        destructive migration has applied, recovery requires restoring the backup.
                                        To proceed, accept the risk and type the target version
                                        (<Code>{preflightData.target_version}</Code>) to confirm.
                                        <Checkbox
                                            mt="sm"
                                            label="I understand this may irreversibly change data and a backup is recommended."
                                            checked={acceptedRisk}
                                            onChange={(e) => setAcceptedRisk(e.currentTarget.checked)}
                                        />
                                        <TextInput
                                            mt="sm"
                                            label="Type the target version to confirm"
                                            placeholder={preflightData.target_version}
                                            value={typedConfirmation}
                                            onChange={(e) => setTypedConfirmation(e.currentTarget.value)}
                                        />
                                    </Alert>
                                )}

                                {preflightData.status === 'blocked' && (
                                    <Alert icon={<IconAlertTriangle size={16} />} color="red" variant="light">
                                        This update is blocked. Resolve the errors above before requesting it.
                                    </Alert>
                                )}

                                {!canUpdate && (
                                    <Alert icon={<IconShieldCheck size={16} />} color="gray" variant="light">
                                        You can view compatibility but need the <Code>admin.system.update</Code> permission to request an update.
                                    </Alert>
                                )}

                                {canUpdate && (
                                    <Group justify="flex-end">
                                        <Button
                                            color="blue"
                                            disabled={!canRequest}
                                            loading={requestUpdate.isPending}
                                            onClick={handleRequest}
                                        >
                                            Request update for this instance
                                        </Button>
                                    </Group>
                                )}
                            </Stack>
                        )}
                    </Stack>
                </Paper>
            </Stack>
        </Paper>
    );
}
