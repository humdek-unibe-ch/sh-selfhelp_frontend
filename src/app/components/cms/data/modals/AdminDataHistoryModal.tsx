/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { Alert, Badge, Button, Group, Loader, Paper, Stack, Text } from '@mantine/core';
import {
    getFormListRestoreBlocked,
    getFormStaleVersion,
    type IFormListRestoreBlocker,
    type IFormListRestorePreview,
    type IFormListRevision,
} from '../../../../../shared';
import { ModalWrapper } from '../../../shared/common/CustomModal/CustomModal';
import { AdminDataHistoryApi } from '../../../../../api/admin/data-history.api';
import { getApiErrorText } from '../../../../../utils/mutation-error-handler';
import { formatContentRef } from '../../../../../utils/content-ref.utils';
import {
    RESTORE_TEXT,
    RestoreBlockers,
    RestoreChanges,
    restorableFieldKeys,
} from '../../../shared/history';

const STALE_TEXT = 'This record changed since you opened its history. The list was reloaded; preview again.';

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
    const [previewVersion, setPreviewVersion] = useState<number | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState<string | null>(null);
    const [previewData, setPreviewData] = useState<IFormListRestorePreview | null>(null);
    const [blockedByServer, setBlockedByServer] = useState<IFormListRestoreBlocker[] | null>(null);
    const [restoreBusy, setRestoreBusy] = useState(false);
    const [restoreError, setRestoreError] = useState<string | null>(null);
    /** Only the answer to the latest preview request may fill the panel. */
    const previewRequest = useRef(0);

    const historyQuery = useQuery({
        queryKey: ['admin-data-history', tableName, recordId],
        queryFn: () => AdminDataHistoryApi.history(tableName, recordId),
        enabled: opened && recordId > 0,
    });

    const resetPreview = () => {
        previewRequest.current += 1;
        setPreviewVersion(null);
        setPreviewLoading(false);
        setPreviewError(null);
        setPreviewData(null);
        setBlockedByServer(null);
    };

    /** Closing forgets the preview, so the next opening starts clean. */
    const close = () => {
        resetPreview();
        setRestoreBusy(false);
        setRestoreError(null);
        onClose();
    };

    const invalidateAfterRestore = async () => {
        await queryClient.invalidateQueries({ queryKey: ['admin-data-history', tableName, recordId] });
        await queryClient.invalidateQueries({ queryKey: ['data-rows'] });
    };

    const previewRestore = async (version: number) => {
        const request = ++previewRequest.current;
        setPreviewVersion(version);
        setPreviewLoading(true);
        setPreviewError(null);
        setPreviewData(null);
        setBlockedByServer(null);
        setRestoreError(null);
        try {
            const data = await AdminDataHistoryApi.restore(tableName, recordId, {
                version,
                dry_run: true,
            });
            if (request !== previewRequest.current) {
                return;
            }
            if (data.dry_run) {
                setPreviewData(data);
            } else {
                setPreviewError('The server did not return a restore preview.');
            }
        } catch (error) {
            if (request === previewRequest.current) {
                setPreviewError(getApiErrorText(error) ?? 'Could not load restore preview.');
            }
        } finally {
            if (request === previewRequest.current) {
                setPreviewLoading(false);
            }
        }
    };

    const blockers = blockedByServer ?? previewData?.blockers ?? [];
    const allowedFields = previewData ? restorableFieldKeys(previewData.changes, blockers) : [];
    const partial = blockers.length > 0 && allowedFields.length > 0;
    const nothing = previewData !== null && previewData.changes.length === 0 && blockers.length === 0;
    const canRestore = previewData !== null && !nothing && (blockers.length === 0 || partial);

    const restore = async (version: number) => {
        setRestoreError(null);
        setRestoreBusy(true);
        try {
            await AdminDataHistoryApi.restore(tableName, recordId, {
                version,
                dry_run: false,
                expected_version: expectedVersion ?? historyQuery.data?.current_version,
                ...(partial ? { field_keys: allowedFields } : {}),
            });
            notifications.show({
                title: 'History',
                message: `Version ${version} was restored.`,
                color: 'green',
            });
            resetPreview();
            await invalidateAfterRestore();
        } catch (error) {
            if (getFormStaleVersion(error) !== null) {
                setRestoreError(STALE_TEXT);
                resetPreview();
                await invalidateAfterRestore();
                return;
            }
            const blocked = getFormListRestoreBlocked(error);
            if (blocked !== null) {
                setBlockedByServer(blocked.blockers);
                return;
            }
            setRestoreError(getApiErrorText(error) ?? `Could not restore version ${version}.`);
        } finally {
            setRestoreBusy(false);
        }
    };

    return (
        <ModalWrapper
            opened={opened}
            onClose={close}
            title={`History · record ${recordId}`}
            size="lg"
            onCancel={close}
        >
            <Stack gap="sm" data-testid="admin-data-history">
                {historyQuery.isLoading && <Loader size="sm" />}
                {historyQuery.isError && (
                    <Alert color="red">Could not load history for this record.</Alert>
                )}
                {restoreError !== null && <Alert color="red">{restoreError}</Alert>}
                {historyQuery.data && (
                    <>
                        <Text size="sm" c="dimmed">
                            Current version {historyQuery.data.current_version} · {historyQuery.data.total} revision
                            {historyQuery.data.total === 1 ? '' : 's'}
                        </Text>
                        <Stack gap="xs">
                            {historyQuery.data.items.map((revision: IFormListRevision) => {
                                const isCurrent = revision.version === historyQuery.data.current_version;
                                return (
                                    <Group key={revision.version} justify="space-between" wrap="wrap" gap="xs" data-version={revision.version}>
                                        <Group gap="xs">
                                            <Text fw={600}>v{revision.version}</Text>
                                            {isCurrent && (
                                                <Badge size="xs">current</Badge>
                                            )}
                                            <Text size="sm" c="dimmed">
                                                {revision.operation} · {revision.source} · {revision.changed_fields} field
                                                {revision.changed_fields === 1 ? '' : 's'}
                                            </Text>
                                            <Text size="sm" c="dimmed" data-testid="content-ref-revision">
                                                Content version: {formatContentRef(revision.content_ref)}
                                            </Text>
                                        </Group>
                                        <Button
                                            size="compact-xs"
                                            variant="light"
                                            loading={previewLoading && previewVersion === revision.version}
                                            disabled={isCurrent || restoreBusy}
                                            onClick={() => void previewRestore(revision.version)}
                                        >
                                            Preview restore
                                        </Button>
                                    </Group>
                                );
                            })}
                        </Stack>
                        {previewVersion !== null && (
                            <Paper withBorder p="sm" data-testid="admin-data-restore-preview">
                                <Stack gap="xs">
                                    <Text fw={600} size="sm">
                                        Restore preview · version {previewVersion}
                                    </Text>
                                    {previewLoading && <Loader size="sm" aria-label="Loading restore preview" />}
                                    {previewError !== null && <Alert color="red">{previewError}</Alert>}
                                    {nothing && <Text>{RESTORE_TEXT.nothing}</Text>}
                                    <RestoreBlockers blockers={blockers} data-testid="admin-data-restore-blockers" />
                                    {previewData !== null && previewData.changes.length > 0 && (
                                        <>
                                            <Text fw={600} size="sm">{RESTORE_TEXT.preview}</Text>
                                            <RestoreChanges
                                                changes={previewData.changes}
                                                data-testid="admin-data-restore-changes"
                                            />
                                        </>
                                    )}
                                    {canRestore && (
                                        <Group justify="flex-end">
                                            <Button
                                                size="xs"
                                                color="orange"
                                                loading={restoreBusy}
                                                onClick={() => void restore(previewVersion)}
                                            >
                                                {partial ? RESTORE_TEXT.onlyPossible : RESTORE_TEXT.confirm}
                                            </Button>
                                        </Group>
                                    )}
                                </Stack>
                            </Paper>
                        )}
                    </>
                )}
            </Stack>
        </ModalWrapper>
    );
}
