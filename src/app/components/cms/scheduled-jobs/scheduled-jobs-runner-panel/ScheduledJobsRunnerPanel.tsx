/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useState } from 'react';
import {
    Card,
    Group,
    Stack,
    Text,
    Badge,
    Switch,
    NumberInput,
    Button,
    Divider,
    Tooltip,
    Skeleton,
    ActionIcon,
} from '@mantine/core';
import { IconPlayerPlay, IconRefresh, IconAlertTriangle } from '@tabler/icons-react';
import { useAuthUser } from '../../../../../hooks/useUserData';
import { PERMISSIONS } from '../../../../../types/auth/jwt-payload.types';
import {
    useScheduledJobRunnerStatus,
    useToggleRunnerMutation,
    useUpdateRunnerSettingsMutation,
    useRunDueJobsNowMutation,
} from '../../../../../hooks/useScheduledJobs';

/**
 * Map a runner run status code to a Mantine badge colour.
 */
function runStatusColor(status: string | undefined): string {
    switch (status) {
        case 'succeeded':
            return 'green';
        case 'failed':
            return 'red';
        case 'running':
            return 'blue';
        case 'skipped_disabled':
        case 'skipped_interval':
        case 'skipped_locked':
            return 'yellow';
        default:
            return 'gray';
    }
}

/**
 * Compact operational panel for the Docker scheduled-job runner. Shows enabled
 * state, interval/max-jobs settings, last-run summary, queue/health counters,
 * and exposes enable/disable, save-settings, and "run due jobs now" actions.
 *
 * Read is gated by `admin.scheduled_job.read`; settings/enable/disable require
 * `admin.scheduled_job.manage`; run-now requires `admin.scheduled_job.execute`.
 */
export function ScheduledJobsRunnerPanel() {
    const { permissionChecker } = useAuthUser();
    const canRead = permissionChecker?.hasPermission(PERMISSIONS.ADMIN_SCHEDULED_JOB_READ) ?? false;
    const canManage = permissionChecker?.hasPermission(PERMISSIONS.ADMIN_SCHEDULED_JOB_MANAGE) ?? false;
    const canExecute = permissionChecker?.hasPermission(PERMISSIONS.ADMIN_SCHEDULED_JOB_EXECUTE) ?? false;

    const { data: status, isLoading, refetch, isFetching } = useScheduledJobRunnerStatus(canRead);
    const toggleRunner = useToggleRunnerMutation();
    const updateSettings = useUpdateRunnerSettingsMutation();
    const runNow = useRunDueJobsNowMutation();

    // Pending edits default to null so inputs derive from the loaded status until
    // the admin changes them (avoids a setState-in-effect initialization).
    const [pendingInterval, setPendingInterval] = useState<number | string | null>(null);
    const [pendingMaxJobs, setPendingMaxJobs] = useState<number | string | null>(null);

    if (!canRead) {
        return null;
    }

    if (isLoading || !status) {
        return (
            <Card withBorder radius="sm" p="md" mb="md">
                <Skeleton height={120} />
            </Card>
        );
    }

    const { settings, last_run: lastRun, queue, health } = status;
    const intervalValue = pendingInterval ?? settings.interval_seconds;
    const maxJobsValue = pendingMaxJobs ?? settings.max_jobs_per_run ?? 0;

    const handleSaveSettings = () => {
        updateSettings.mutate({
            interval_seconds: typeof intervalValue === 'number' ? intervalValue : parseInt(String(intervalValue), 10),
            max_jobs_per_run: Number(maxJobsValue) > 0 ? Number(maxJobsValue) : null,
        });
    };

    return (
        <Card withBorder radius="sm" p="md" mb="md">
            <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Stack gap={4}>
                    <Group gap="xs">
                        <Text fw={600}>Scheduled-Job Runner</Text>
                        <Badge color={settings.enabled ? 'green' : 'gray'} variant="light">
                            {settings.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                        {health.scheduler_appears_stale && (
                            <Tooltip label="No recent runner tick detected. Check the scheduler container.">
                                <Badge color="orange" variant="light" leftSection={<IconAlertTriangle size={12} />}>
                                    Stale
                                </Badge>
                            </Tooltip>
                        )}
                    </Group>
                    <Text size="sm" c="dimmed">
                        The Docker scheduler runs this every tick; the interval below controls whether jobs execute.
                    </Text>
                </Stack>

                <Group gap="xs">
                    <Tooltip label="Refresh runner status & batch counts">
                        <ActionIcon
                            variant="default"
                            size="lg"
                            aria-label="Refresh runner status"
                            loading={isFetching}
                            onClick={() => { void refetch(); }}
                        >
                            <IconRefresh size={16} />
                        </ActionIcon>
                    </Tooltip>
                    {canManage && (
                        <Switch
                            checked={settings.enabled}
                            onChange={(e) => toggleRunner.mutate(e.currentTarget.checked)}
                            disabled={toggleRunner.isPending}
                            label="Enabled"
                        />
                    )}
                    {canExecute && (
                        <Button
                            size="xs"
                            variant="light"
                            leftSection={<IconPlayerPlay size={14} />}
                            loading={runNow.isPending}
                            onClick={() => runNow.mutate()}
                        >
                            Run due jobs now
                        </Button>
                    )}
                </Group>
            </Group>

            <Divider my="sm" />

            <Group align="flex-end" gap="md" wrap="wrap">
                <div>
                    <Text size="xs" c="dimmed">Next batch (due now)</Text>
                    <Text fw={600}>{queue.due_queued_count}</Text>
                </div>
                <div>
                    <Text size="xs" c="dimmed">Running</Text>
                    <Text fw={600}>{queue.running_count}</Text>
                </div>
                <div>
                    <Text size="xs" c="dimmed">Stale running</Text>
                    <Text fw={600} c={queue.stale_running_count > 0 ? 'orange' : undefined}>
                        {queue.stale_running_count}
                    </Text>
                </div>
                <Divider orientation="vertical" />
                <div>
                    <Text size="xs" c="dimmed">Previous batch</Text>
                    <Group gap={6}>
                        <Badge size="sm" color={runStatusColor(lastRun?.status)} variant="light">
                            {lastRun?.status ?? 'never'}
                        </Badge>
                        {lastRun && (
                            <Text size="xs" c="dimmed">
                                {lastRun.attempted_count} sent / {lastRun.done_count} done / {lastRun.failed_count} failed / {lastRun.skipped_count} skipped
                            </Text>
                        )}
                    </Group>
                </div>
                {health.next_eligible_run_at && (
                    <div>
                        <Text size="xs" c="dimmed">Next eligible</Text>
                        <Text size="sm">{new Date(health.next_eligible_run_at).toLocaleString()}</Text>
                    </div>
                )}
            </Group>

            {health.last_error_message && (
                <Text size="xs" c="red" mt="xs">
                    Last error: {health.last_error_message}
                </Text>
            )}

            {canManage && (
                <>
                    <Divider my="sm" />
                    <Group align="flex-end" gap="md" wrap="wrap">
                        <NumberInput
                            label="Interval (seconds)"
                            description="Minimum 60s in scheduler mode"
                            min={60}
                            value={intervalValue}
                            onChange={setPendingInterval}
                            w={180}
                            size="xs"
                        />
                        <NumberInput
                            label="Max jobs per run"
                            description="0 = no limit"
                            min={0}
                            value={maxJobsValue}
                            onChange={setPendingMaxJobs}
                            w={180}
                            size="xs"
                        />
                        <Button
                            size="xs"
                            variant="default"
                            leftSection={<IconRefresh size={14} />}
                            loading={updateSettings.isPending}
                            onClick={handleSaveSettings}
                        >
                            Save settings
                        </Button>
                    </Group>
                </>
            )}
        </Card>
    );
}
