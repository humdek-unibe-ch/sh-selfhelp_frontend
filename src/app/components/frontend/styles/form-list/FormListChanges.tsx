/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Anchor, Badge, Group, Image, Stack, Text } from '@mantine/core';
import { isLanguageIndependent } from '@selfhelp/shared';
import type {
    IFormListHistoricalFile,
    TFormListChange,
} from '../../../../../shared';
import { FORM_LIST_TEXT } from './form-list.constants';
import styles from './FormList.module.css';

/** The language of a cell is worth naming only when it is a real language. */
function languageBadge(languageId: number) {
    return !isLanguageIndependent(languageId)
        ? <Badge size="xs" variant="outline">language {languageId}</Badge>
        : null;
}

const CHANGE_WORDS: Record<TFormListChange['change'], string> = {
    added: 'Added',
    changed: 'Changed',
    removed: 'Removed',
};

const IMAGE_NAME = /\.(jpe?g|png|gif|webp)$/i;

function looksLikeImage(file: IFormListHistoricalFile): boolean {
    return IMAGE_NAME.test(file.name);
}

function FileNames({ files, hrefOf }: { files: readonly IFormListHistoricalFile[]; hrefOf?: (file: IFormListHistoricalFile) => string }) {
    if (files.length === 0) {
        return <Text span c="dimmed">no file</Text>;
    }
    return (
        <Group gap="xs" wrap="wrap" align="center">
            {files.map((file) => {
                const href = file.available && hrefOf ? hrefOf(file) : null;
                if (looksLikeImage(file) && href) {
                    return (
                        <Anchor
                            key={`${file.index}-${file.name}`}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={file.name}
                        >
                            <Image
                                src={href}
                                alt={file.name}
                                w={48}
                                h={48}
                                fit="cover"
                                radius="sm"
                                data-testid="form-list-history-thumb"
                            />
                        </Anchor>
                    );
                }
                return (
                    <span key={`${file.index}-${file.name}`}>
                        {href ? (
                            <Anchor href={href} target="_blank" rel="noopener noreferrer" size="sm">{file.name}</Anchor>
                        ) : (
                            <>{file.name}{!file.available ? <Text span c="dimmed"> ({FORM_LIST_TEXT.historyAvailableNo})</Text> : null}</>
                        )}
                    </span>
                );
            })}
        </Group>
    );
}

interface IFormListChangesProps {
    changes: readonly TFormListChange[];
    /** Where an available file of the earlier state can be downloaded; omitted when the changes span two versions. */
    fileHref?: (change: TFormListChange, file: IFormListHistoricalFile, side: 'before' | 'after') => string;
}

/**
 * What changed between two states of a record: one row per field, with the
 * value before and after. The server already left out fields and files the
 * viewer may not see; this draws what it sent.
 */
export function FormListChanges({ changes, fileHref }: IFormListChangesProps) {
    if (changes.length === 0) {
        return <Text c="dimmed" size="sm">Nothing changed.</Text>;
    }

    return (
        <Stack gap="sm" component="ul" style={{ listStyle: 'none', margin: 0, padding: 0 }} data-testid="form-list-changes">
            {changes.map((change) => (
                <li key={`${change.field_key}-${change.language_id}-${change.kind}`}>
                    <Group gap="xs" wrap="wrap">
                        <Text fw={600} size="sm" className={styles.changeValue}>{change.field_label ?? change.field_key}</Text>
                        <Badge size="xs" variant="light" color={change.change === 'removed' ? 'red' : (change.change === 'added' ? 'green' : 'blue')}>
                            {CHANGE_WORDS[change.change]}
                        </Badge>
                        {languageBadge(change.language_id)}
                    </Group>
                    {change.kind === 'file' ? (
                        <Stack gap={2} mt={4}>
                            <Group gap="xs" align="center" wrap="wrap">
                                <Text size="sm">Before:</Text>
                                <FileNames
                                    files={change.before_files}
                                    hrefOf={fileHref ? (file) => fileHref(change, file, 'before') : undefined}
                                />
                            </Group>
                            <Group gap="xs" align="center" wrap="wrap">
                                <Text size="sm">After:</Text>
                                <FileNames
                                    files={change.after_files}
                                    hrefOf={fileHref ? (file) => fileHref(change, file, 'after') : undefined}
                                />
                            </Group>
                        </Stack>
                    ) : (
                        <Stack gap={2} mt={4}>
                            <Text size="sm" className={styles.changeValue}>
                                Before: {change.before === null ? <Text span c="dimmed">empty</Text> : change.before}
                            </Text>
                            <Text size="sm" className={styles.changeValue}>
                                After: {change.after === null ? <Text span c="dimmed">empty</Text> : change.after}
                            </Text>
                            {change.truncated && <Text size="xs" c="dimmed">The value is shown shortened.</Text>}
                        </Stack>
                    )}
                </li>
            ))}
        </Stack>
    );
}
