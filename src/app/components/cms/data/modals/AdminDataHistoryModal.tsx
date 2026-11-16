/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Badge, Button, Group, Loader, Stack, Text } from '@mantine/core';
import { ModalWrapper } from '../../../shared/common/CustomModal/CustomModal';
import { AdminDataHistoryApi } from '../../../../../api/admin/data-history.api';
import type { IFormListRevision } from '../../../../../shared';

interface IAdminDataHistoryModalProps {
    opened: boolean;
    onClose: () => void;
    tableName: string;
    recordId: number;
    /** Current row version for restore concurrency. */
    expectedVersion?: number;
}

export function AdminDataHistoryModal({
    opened,
    onClose,
    tableName,
    recordId,
    expectedVersion,
}: IAdminDataHistoryModalProps) {
    const queryClient = useQueryClient();
    const historyQuery = useQuery({
        queryKey: ['admin-data-history', tableName, recordId],
        queryFn: () => AdminDataHistoryApi.history(tableName, recordId),
        enabled: opened && recordId > 0,
    });

    const restore = async (version: number, dryRun: boolean) => {
        await AdminDataHistoryApi.restore(tableName, recordId, {
            version,
            dry_run: dryRun,
            expected_version: dryRun ? undefined : expectedVersion ?? historyQuery.data?.current_version,
        });
        if (!dryRun) {
            await queryClient.invalidateQueries({ queryKey: ['admin-data-history', tableName, recordId] });
            await queryClient.invalidateQueries({ queryKey: ['data-rows'] });
        }
    };

    return (
        <ModalWrapper
            opened={opened}
            onClose={onClose}
            title={`History · record ${recordId}`}
            size="lg"
            onCancel={onClose}
        >
            <Stack gap="sm" data-testid="admin-data-history">
                {historyQuery.isLoading && <Loader size="sm" />}
                {historyQuery.isError && (
                    <Alert color="red">Could not load history for this record.</Alert>
                )}
                {historyQuery.data && (
                    <>
                        <Text size="sm" c="dimmed">
                            Current version {historyQuery.data.current_version} · {historyQuery.data.total} revision
                            {historyQuery.data.total === 1 ? '' : 's'}
                        </Text>
                        <Stack gap="xs">
                            {historyQuery.data.items.map((revision: IFormListRevision) => (
                                <Group key={revision.version} justify="space-between" wrap="wrap" gap="xs" data-version={revision.version}>
                                    <Group gap="xs">
                                        <Text fw={600}>v{revision.version}</Text>
                                        {revision.version === historyQuery.data.current_version && (
                                            <Badge size="xs">current</Badge>
                                        )}
                                        <Text size="sm" c="dimmed">
                                            {revision.operation} · {revision.source} · {revision.changed_fields} field
                                            {revision.changed_fields === 1 ? '' : 's'}
                                        </Text>
                                    </Group>
                                    <Group gap="xs">
                                        <Button
                                            size="compact-xs"
                                            variant="light"
                                            onClick={() => void restore(revision.version, true)}
                                        >
                                            Preview restore
                                        </Button>
                                        <Button
                                            size="compact-xs"
                                            onClick={() => void restore(revision.version, false)}
                                            disabled={revision.version === historyQuery.data.current_version}
                                        >
                                            Restore
                                        </Button>
                                    </Group>
                                </Group>
                            ))}
                        </Stack>
                    </>
                )}
            </Stack>
        </ModalWrapper>
    );
}
