/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useEffect, useState } from 'react';
import { notifications } from '@mantine/notifications';
import {
    Alert,
    Badge,
    Button,
    Checkbox,
    Group,
    Loader,
    Pagination,
    Paper,
    Stack,
    Text,
    Title,
} from '@mantine/core';
import {
    getFormListFailure,
    getFormListRestoreBlocked,
    getFormStaleVersion,
    type IFormListHistoricalFile,
    type IFormListRestoreBlocker,
    type IFormListRestorePreview,
    type IFormListRestoreResult,
    type IFormListRevision,
    type TFormListChange,
} from '../../../../../shared';
import { FormListApi } from '../../../../../api/frontend/form-list.api';
import { usePreviewMode } from '../../../contexts/PreviewModeContext';
import {
    useFormListCompare,
    useFormListHistory,
    useFormListRestoreMutation,
    useFormListVersion,
} from '../../../../../hooks/useFormList';
import { formatEntryDate } from '../../../../../utils/form-list.utils';
import { formatContentRef } from '../../../../../utils/content-ref.utils';
import { FormListChanges } from './FormListChanges';
import { FormListConfirmDialog } from './FormListConfirmDialog';
import { FORM_LIST_TEXT } from './form-list.constants';
import styles from './FormList.module.css';
import { RestoreBlockers, RestoreChanges, restorableFieldKeys } from '../../../shared/history';

const OPERATION_WORDS: Record<IFormListRevision['operation'], string> = {
    create: 'Created',
    update: 'Updated',
    delete: 'Deleted',
    restore: 'Restored',
    baseline: 'Earlier state',
};

const SOURCE_WORDS: Record<IFormListRevision['source'], string> = {
    form: 'form',
    admin: 'administration',
    quick_action: 'quick action',
    job: 'scheduled job',
    import: 'import',
    system: 'system',
    plugin: 'plugin',
};


interface IFormListHistoryProps {
    pageId: number;
    sectionId: number;
    recordId: number;
    /** The viewer may change the record, so restoring a version is offered. */
    canRestore: boolean;
    /** A restore was applied: the caller refreshes what it shows. */
    onRestored: (result: IFormListRestoreResult) => void;
}

function describe(revision: IFormListRevision): string {
    const actor = revision.actor?.name ?? (revision.actor ? `user ${revision.actor.id}` : 'unknown');
    const by = revision.impersonated_by ? `${actor} (by ${revision.impersonated_by.name ?? `user ${revision.impersonated_by.id}`})` : actor;
    const restored = revision.operation === 'restore' && revision.restored_from_version !== null
        ? ` from version ${revision.restored_from_version}`
        : '';
    return `${OPERATION_WORDS[revision.operation]}${restored} by ${by} via ${SOURCE_WORDS[revision.source]}`;
}

/**
 * The versions of one record: who changed it and when, what one version
 * changed, a comparison of two versions, and a validated restore.
 *
 * The server decides what the viewer may see: hidden fields and unreadable
 * files are left out of the changes and cannot be restored by this viewer.
 * A restore never rewinds history; it is a new version.
 */
export function FormListHistory({ pageId, sectionId, recordId, canRestore, onRestored }: IFormListHistoryProps) {
    const target = { pageId, sectionId, recordId };
    // A historical file is read on the page version the history itself was read on.
    const { isPreviewMode } = usePreviewMode();
    const [page, setPage] = useState(1);
    const [picked, setPicked] = useState<number[]>([]);
    const [detail, setDetail] = useState<number | null>(null);
    const [compare, setCompare] = useState<{ from: number; to: number } | null>(null);
    const [restoreOf, setRestoreOf] = useState<number | null>(null);

    const history = useFormListHistory(target, page);
    const currentVersion = history.data?.current_version ?? null;
    const version = useFormListVersion(target, detail);
    const comparison = useFormListCompare(target, compare?.from ?? null, compare?.to ?? null);

    if (history.isLoading) {
        return <Loader size="sm" aria-label={FORM_LIST_TEXT.loading} />;
    }
    if (history.error || !history.data) {
        const failure = getFormListFailure(history.error);
        return (
            <Alert color="red" title={FORM_LIST_TEXT.history}>
                {failure?.status === 403 ? FORM_LIST_TEXT.historyDenied : FORM_LIST_TEXT.loadFailed}
            </Alert>
        );
    }

    const data = history.data;
    const totalPages = Math.max(1, Math.ceil(data.total / data.page_size));

    const togglePick = (versionNumber: number) => {
        setPicked((current) => {
            if (current.includes(versionNumber)) {
                return current.filter((item) => item !== versionNumber);
            }
            return [...current, versionNumber].slice(-2);
        });
    };

    const fileHref = (versionNumber: number) =>
        (change: TFormListChange, file: IFormListHistoricalFile): string =>
            file.url
                ? FormListApi.fileHref(file.url)
                : FormListApi.versionFileHref(sectionId, recordId, versionNumber, change.field_key, pageId, {
                    fileLanguage: change.language_id,
                    index: file.index,
                    preview: isPreviewMode,
                });

    return (
        <Stack gap="md" data-testid="form-list-history">
            {data.items.length === 0 && <Text c="dimmed">{FORM_LIST_TEXT.historyEmpty}</Text>}

            <Stack gap="xs" component="ol" style={{ listStyle: 'none', margin: 0, padding: 0 }} aria-label={FORM_LIST_TEXT.history}>
                {data.items.map((revision) => {
                    const isCurrent = revision.version === data.current_version;
                    return (
                        <li key={revision.version}>
                            <Paper withBorder p="sm" data-version={revision.version}>
                                <Group justify="space-between" align="flex-start" wrap="wrap" gap="xs">
                                    <Group gap="sm" align="flex-start" wrap="nowrap">
                                        <Checkbox
                                            checked={picked.includes(revision.version)}
                                            onChange={() => togglePick(revision.version)}
                                            aria-label={`${FORM_LIST_TEXT.historyChecks}: version ${revision.version}`}
                                            mt={2}
                                        />
                                        <div>
                                            <Group gap="xs" wrap="wrap">
                                                <Text fw={600}>Version {revision.version}</Text>
                                                {isCurrent && <Badge size="xs">{FORM_LIST_TEXT.historyCurrent}</Badge>}
                                                {revision.is_checkpoint && <Badge size="xs" variant="outline">checkpoint</Badge>}
                                            </Group>
                                            <Text size="sm" className={styles.changeValue}>{describe(revision)}</Text>
                                            <Text size="xs" c="dimmed" data-testid="content-ref-revision">
                                                Content version: {formatContentRef(revision.content_ref)}
                                            </Text>
                                            <Text size="xs" c="dimmed">
                                                {formatEntryDate(revision.created_at)} UTC
                                                {revision.changed_fields > 0 ? `, ${revision.changed_fields} field${revision.changed_fields === 1 ? '' : 's'} changed` : ''}
                                            </Text>
                                        </div>
                                    </Group>
                                    <Group gap="xs" wrap="wrap">
                                        <Button
                                            size="compact-xs"
                                            variant="light"
                                            onClick={() => { setCompare(null); setDetail(revision.version); }}
                                            aria-label={`${FORM_LIST_TEXT.details} of version ${revision.version}`}
                                        >
                                            {FORM_LIST_TEXT.details}
                                        </Button>
                                        {!isCurrent && currentVersion !== null && (
                                            <Button
                                                size="compact-xs"
                                                variant="light"
                                                onClick={() => { setDetail(null); setCompare({ from: revision.version, to: currentVersion }); }}
                                                aria-label={`${FORM_LIST_TEXT.historyCompareCurrent}: version ${revision.version}`}
                                            >
                                                {FORM_LIST_TEXT.historyCompareCurrent}
                                            </Button>
                                        )}
                                        {canRestore && !isCurrent && revision.operation !== 'delete' && (
                                            <Button
                                                size="compact-xs"
                                                variant="light"
                                                color="orange"
                                                onClick={() => setRestoreOf(revision.version)}
                                                aria-label={`${FORM_LIST_TEXT.historyRestore}: version ${revision.version}`}
                                            >
                                                {FORM_LIST_TEXT.historyRestore}
                                            </Button>
                                        )}
                                    </Group>
                                </Group>
                            </Paper>
                        </li>
                    );
                })}
            </Stack>

            <Group justify="space-between" wrap="wrap" gap="sm">
                <Button
                    size="compact-sm"
                    variant="default"
                    disabled={picked.length !== 2}
                    onClick={() => {
                        const [first, second] = [...picked].sort((a, b) => a - b);
                        setDetail(null);
                        setCompare({ from: first, to: second });
                    }}
                >
                    {FORM_LIST_TEXT.historyCompare}
                </Button>
                {totalPages > 1 && (
                    <Pagination total={totalPages} value={page} onChange={setPage} size="sm" />
                )}
            </Group>

            {detail !== null && (
                <Paper withBorder p="md" aria-live="polite" data-testid="form-list-history-version">
                    <Title order={5} mb="xs">Version {detail}</Title>
                    {version.isLoading && <Loader size="sm" aria-label={FORM_LIST_TEXT.loading} />}
                    {version.error ? <Alert color="red">{FORM_LIST_TEXT.loadFailed}</Alert> : null}
                    {version.data && (
                        <Stack gap="md">
                            <div>
                                <Text fw={600} size="sm" mb={4}>What this version changed</Text>
                                <FormListChanges
                                    changes={version.data.revision.changes}
                                    fileHref={fileHref(detail)}
                                />
                            </div>
                            <div>
                                <Text fw={600} size="sm" mb={4}>The entry after this version</Text>
                                <Stack gap={4} component="dl" style={{ margin: 0 }}>
                                    {version.data.state.fields.map((field) => (
                                        <div key={`${field.field_key}-${field.language_id}`}>
                                            <Text component="dt" size="xs" c="dimmed">{field.field_label ?? field.field_key}</Text>
                                            <Text component="dd" size="sm" style={{ margin: 0 }} className={styles.changeValue}>
                                                {field.kind === 'file'
                                                    ? (field.files.length === 0 ? '-' : field.files.map((file) => file.name).join(', '))
                                                    : (field.value ?? '-')}
                                            </Text>
                                        </div>
                                    ))}
                                </Stack>
                            </div>
                        </Stack>
                    )}
                </Paper>
            )}

            {compare !== null && (
                <Paper withBorder p="md" aria-live="polite" data-testid="form-list-history-compare">
                    <Title order={5} mb="xs">Version {compare.from} compared with version {compare.to}</Title>
                    {comparison.isLoading && <Loader size="sm" aria-label={FORM_LIST_TEXT.loading} />}
                    {comparison.error ? <Alert color="red">{FORM_LIST_TEXT.loadFailed}</Alert> : null}
                    {comparison.data && <FormListChanges changes={comparison.data.changes} />}
                </Paper>
            )}

            {restoreOf !== null && (
                <RestoreDialog
                    pageId={pageId}
                    sectionId={sectionId}
                    recordId={recordId}
                    version={restoreOf}
                    currentVersion={data.current_version}
                    onClose={() => setRestoreOf(null)}
                    onRestored={(result) => {
                        setRestoreOf(null);
                        setPicked([]);
                        setDetail(null);
                        setCompare(null);
                        onRestored(result);
                    }}
                    onStale={() => { void history.refetch(); }}
                />
            )}
        </Stack>
    );
}

interface IRestoreDialogProps {
    pageId: number;
    sectionId: number;
    recordId: number;
    version: number;
    currentVersion: number;
    onClose: () => void;
    onRestored: (result: IFormListRestoreResult) => void;
    onStale: () => void;
}

/** The dry run of a restore (what it would change, what blocks it) and the confirmed restore. */
function RestoreDialog({ pageId, sectionId, recordId, version, currentVersion, onClose, onRestored, onStale }: IRestoreDialogProps) {
    const preview = useFormListRestoreMutation(pageId, sectionId);
    const apply = useFormListRestoreMutation(pageId, sectionId);
    const [blockedByServer, setBlockedByServer] = useState<IFormListRestoreBlocker[] | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const { mutate: runPreview } = preview;

    useEffect(() => {
        runPreview({ recordId, version, dry_run: true });
    }, [runPreview, recordId, version]);

    const previewData: IFormListRestorePreview | null = preview.data && preview.data.dry_run ? preview.data : null;
    const blockers = blockedByServer ?? previewData?.blockers ?? [];
    const allowedFields = previewData ? restorableFieldKeys(previewData.changes, blockers) : [];
    const partial = blockers.length > 0 && allowedFields.length > 0;
    const nothing = previewData !== null && previewData.changes.length === 0 && blockers.length === 0;
    const canConfirm = previewData !== null && !nothing && (blockers.length === 0 || partial);

    const confirm = () => {
        setNotice(null);
        apply.mutate(
            {
                recordId,
                version,
                expected_version: currentVersion,
                ...(partial ? { field_keys: allowedFields } : {}),
            },
            {
                onSuccess: (result) => {
                    if (!result.dry_run) {
                        notifications.show({ title: FORM_LIST_TEXT.history, message: `Version ${version} was restored.`, color: 'green' });
                        onRestored(result);
                    }
                },
                onError: (error) => {
                    if (getFormStaleVersion(error) !== null) {
                        setNotice(FORM_LIST_TEXT.conflictDeleteBody);
                        onStale();
                        return;
                    }
                    const blocked = getFormListRestoreBlocked(error);
                    if (blocked !== null) {
                        setBlockedByServer(blocked.blockers);
                        return;
                    }
                    setNotice(FORM_LIST_TEXT.loadFailed);
                },
            },
        );
    };

    const failure = preview.error ? getFormListFailure(preview.error) : null;

    return (
        <FormListConfirmDialog
            opened
            title={`${FORM_LIST_TEXT.historyRestore} (${version})`}
            confirmLabel={partial ? FORM_LIST_TEXT.historyRestoreOnlyPossible : FORM_LIST_TEXT.historyRestoreConfirm}
            cancelLabel={FORM_LIST_TEXT.cancel}
            confirmColor="orange"
            busy={apply.isPending}
            hideConfirm={!canConfirm}
            onConfirm={confirm}
            onCancel={onClose}
            notice={
                <>
                    {notice !== null && <Alert color="orange">{notice}</Alert>}
                    <RestoreBlockers blockers={blockers} />
                </>
            }
        >
            {preview.isPending && <Loader size="sm" aria-label={FORM_LIST_TEXT.loading} />}
            {failure !== null && <Text c="red">{failure.status === 403 ? FORM_LIST_TEXT.historyDenied : FORM_LIST_TEXT.loadFailed}</Text>}
            {nothing && <Text>{FORM_LIST_TEXT.historyNothingToRestore}</Text>}
            {previewData !== null && previewData.changes.length > 0 && (
                <Stack gap="xs">
                    <Text fw={600} size="sm">{FORM_LIST_TEXT.historyRestorePreview}</Text>
                    <RestoreChanges changes={previewData.changes} data-testid="form-list-restore-changes" />
                </Stack>
            )}
        </FormListConfirmDialog>
    );
}
