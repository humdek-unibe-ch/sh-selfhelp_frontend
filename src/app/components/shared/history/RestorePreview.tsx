/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Alert, Badge, Group, Stack, Text } from '@mantine/core';
import { isLanguageIndependent } from '@selfhelp/shared';
import type {
    IFormListHistoricalFile,
    IFormListRestoreBlocker,
    IFormListRestoreChange,
} from '../../../../shared';
import { RESTORE_BLOCKER_WORDS, RESTORE_TEXT, restoreBlockerKey } from './restore-preview';
import styles from './RestorePreview.module.css';

function languageBadge(languageId: number) {
    return !isLanguageIndependent(languageId)
        ? <Badge size="xs" variant="outline">language {languageId}</Badge>
        : null;
}

const ACTION_WORDS: Record<IFormListRestoreChange['action'], string> = {
    set: 'Set',
    remove: 'Remove',
};

function emptyPlaceholder() {
    return <Text span c="dimmed">empty</Text>;
}

function valueOrEmpty(value: string | null) {
    if (value === null || value === '') {
        return emptyPlaceholder();
    }
    return value;
}

function FileNames({ files }: { files: readonly IFormListHistoricalFile[] | undefined }) {
    const list = files ?? [];
    if (list.length === 0) {
        return emptyPlaceholder();
    }
    return (
        <Group gap="xs" wrap="wrap" align="center" component="span">
            {list.map((file) => (
                <Text span key={`${file.index}-${file.name}`} size="sm">
                    {file.name}
                    {!file.available ? (
                        <Text span c="dimmed"> ({RESTORE_TEXT.fileUnavailable})</Text>
                    ) : null}
                </Text>
            ))}
        </Group>
    );
}

interface IRestoreChangesProps {
    changes: readonly IFormListRestoreChange[];
    'data-testid'?: string;
}

/**
 * What a restore would change: current (before) and value after restore (after),
 * one row per field the dry-run already returned as a diff.
 */
export function RestoreChanges({ changes, 'data-testid': testId }: IRestoreChangesProps) {
    if (changes.length === 0) {
        return null;
    }

    return (
        <Stack
            gap="sm"
            component="ul"
            style={{ listStyle: 'none', margin: 0, padding: 0 }}
            data-testid={testId}
        >
            {changes.map((change) => (
                <li key={`${change.field_key}-${change.language_id}-${change.kind}`}>
                    <Group gap="xs" wrap="wrap">
                        <Text fw={600} size="sm" className={styles.value}>
                            {change.field_label ?? change.field_key}
                        </Text>
                        <Badge
                            size="xs"
                            variant="light"
                            color={change.action === 'remove' ? 'red' : 'blue'}
                        >
                            {ACTION_WORDS[change.action]}
                        </Badge>
                        {languageBadge(change.language_id)}
                    </Group>
                    {change.kind === 'file' ? (
                        <Stack gap={2} mt={4}>
                            <Group gap="xs" align="center" wrap="wrap">
                                <Text size="sm">Before:</Text>
                                <FileNames files={change.before_files} />
                            </Group>
                            <Group gap="xs" align="center" wrap="wrap">
                                <Text size="sm">After:</Text>
                                <FileNames files={change.after_files} />
                            </Group>
                        </Stack>
                    ) : (
                        <Stack gap={2} mt={4}>
                            <Text size="sm" className={styles.value}>
                                Before: {valueOrEmpty(change.before)}
                            </Text>
                            <Text size="sm" className={styles.value}>
                                After: {valueOrEmpty(change.after)}
                            </Text>
                        </Stack>
                    )}
                </li>
            ))}
        </Stack>
    );
}

interface IRestoreBlockersProps {
    blockers: readonly IFormListRestoreBlocker[];
    'data-testid'?: string;
}

/** The fields a restore cannot bring back, with the reason the server gave. */
export function RestoreBlockers({ blockers, 'data-testid': testId }: IRestoreBlockersProps) {
    if (blockers.length === 0) {
        return null;
    }
    return (
        <Alert color="orange" title={RESTORE_TEXT.blockedTitle} data-testid={testId}>
            <ul style={{ margin: 0, paddingInlineStart: '1.25rem' }}>
                {blockers.map((blocker) => (
                    <li key={restoreBlockerKey(blocker.field_key, blocker.language_id)}>
                        {blocker.field_label ?? blocker.field_key}: {RESTORE_BLOCKER_WORDS[blocker.reason]}
                    </li>
                ))}
            </ul>
        </Alert>
    );
}
