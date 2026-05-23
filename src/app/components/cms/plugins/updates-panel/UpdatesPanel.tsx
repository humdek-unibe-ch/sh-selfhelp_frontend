/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

/**
 * `UpdatesPanel` — admin "Updates" tab.
 *
 * Cross-references installed plugins against every enabled registry
 * source and surfaces upgradeable rows. Each row shows the installed
 * version, the available registry version, the semantic diff
 * (`patch` / `minor` / `major`), the originating source, and a single
 * Update button that dispatches `POST /admin/plugins/{id}/update`
 * (source=`registry`). The Messenger worker handles Composer and the
 * lock file update; Mercure invalidates this query when the operation
 * resolves so the row drops off automatically.
 *
 * Major updates are flagged with a tooltip explaining they may require
 * additional manual steps and force a `forceMajor=true` payload.
 */

import { useMemo } from 'react';
import { Alert, Badge, Button, Group, Loader, ScrollArea, Stack, Table, Text, Tooltip } from '@mantine/core';
import { IconCircleCheck, IconRefresh } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAdminPluginUpdate, useAdminPluginUpdates } from '../hooks/useAdminPlugins';

const DIFF_COLORS: Record<string, string> = {
    patch: 'green',
    minor: 'blue',
    major: 'red',
    unknown: 'gray',
};

interface IUpdatesPanelProps {
    active: boolean;
}

export function UpdatesPanel({ active }: IUpdatesPanelProps) {
    const { data, isLoading, error, refetch } = useAdminPluginUpdates(active);
    const updateMutation = useAdminPluginUpdate();
    const rows = useMemo(() => data?.updates ?? [], [data]);

    const onUpdate = async (row: { pluginId: string; diffKind: string; registryEntry: Record<string, unknown>; sourceName: string }) => {
        try {
            const op = await updateMutation.mutateAsync({
                pluginId: row.pluginId,
                body: {
                    source: 'registry',
                    sourceName: row.sourceName,
                    registryEntry: row.registryEntry,
                    forceMajor: row.diffKind === 'major',
                },
            });
            notifications.show({
                color: 'green',
                title: 'Update queued',
                message: `Operation #${op.data?.id} dispatched for ${row.pluginId}.`,
            });
        } catch (err) {
            notifications.show({
                color: 'red',
                title: 'Update failed',
                message: err instanceof Error ? err.message : String(err),
            });
        }
    };

    if (isLoading) {
        return (
            <Stack align="center" mt="md">
                <Loader size="md" />
                <Text>Checking registries for updates…</Text>
            </Stack>
        );
    }

    if (error) {
        return (
            <Alert color="red" title="Could not load updates">
                {error instanceof Error ? error.message : 'Unknown error.'}
            </Alert>
        );
    }

    if (rows.length === 0) {
        return (
            <Alert color="green" icon={<IconCircleCheck size={16} />} title="All up-to-date">
                Every installed plugin matches the newest version advertised by your enabled registry sources.
                <Group mt="sm" gap="xs">
                    <Button variant="default" leftSection={<IconRefresh size={14} />} onClick={() => refetch()}>
                        Refresh
                    </Button>
                </Group>
            </Alert>
        );
    }

    return (
        <Stack gap="sm">
            <Group justify="space-between">
                <Text size="sm" c="dimmed">
                    {rows.length} update{rows.length === 1 ? '' : 's'} available.
                </Text>
                <Button variant="default" size="xs" leftSection={<IconRefresh size={14} />} onClick={() => refetch()}>
                    Refresh
                </Button>
            </Group>
            <ScrollArea>
                <Table withTableBorder striped highlightOnHover stickyHeader>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Plugin</Table.Th>
                            <Table.Th>Installed</Table.Th>
                            <Table.Th>Available</Table.Th>
                            <Table.Th>Change</Table.Th>
                            <Table.Th>Source</Table.Th>
                            <Table.Th>Trust</Table.Th>
                            <Table.Th>Action</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {rows.map((row) => (
                            <Table.Tr key={row.pluginId}>
                                <Table.Td>
                                    <Stack gap={0}>
                                        <Text fw={600}>{row.name}</Text>
                                        <Text size="xs" c="dimmed">{row.pluginId}</Text>
                                    </Stack>
                                </Table.Td>
                                <Table.Td>{row.installedVersion}</Table.Td>
                                <Table.Td>{row.availableVersion}</Table.Td>
                                <Table.Td>
                                    <Badge color={DIFF_COLORS[row.diffKind] ?? 'gray'}>{row.diffKind}</Badge>
                                </Table.Td>
                                <Table.Td>{row.sourceName}</Table.Td>
                                <Table.Td>
                                    <Badge color={row.trustLevel === 'official' ? 'green' : row.trustLevel === 'reviewed' ? 'blue' : 'gray'}>
                                        {row.trustLevel}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    {row.diffKind === 'major' ? (
                                        <Tooltip label="Major upgrade — review breaking changes in the changelog before applying." position="left">
                                            <Button
                                                size="xs"
                                                color="red"
                                                loading={updateMutation.isPending}
                                                onClick={() => onUpdate(row)}
                                            >
                                                Force update
                                            </Button>
                                        </Tooltip>
                                    ) : (
                                        <Button
                                            size="xs"
                                            loading={updateMutation.isPending}
                                            onClick={() => onUpdate(row)}
                                        >
                                            Update
                                        </Button>
                                    )}
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </ScrollArea>
        </Stack>
    );
}
